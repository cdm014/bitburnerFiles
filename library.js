var programs = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];
var serverFile = "/Servers.txt";
var contextFile = "/Context.txt";
var hackTargetFile = "/hackTarget.txt";
var growTargetFile = "/growTarget.txt";
var weakTargetFile = "/weakTarget.txt";
var effectBuffer = 200; //how many ms between effects;

class Context {
  ProgramLevel = 0;
  HackingLevel = 0;
  Money = 0;
}

class Server {
  Name = "";
  RequiredPorts = 0;
  RequiredLevel = 0;
  MinSecurity = 0;
  MaxMoney = 0;
  RAM = 0;
  HackScore = 0;
  GrowScore = 0;
  WeakenScore = 0;
}

class ThreadPlan {
  Type = null;
  Start = null;
}


/**
* @param {NS} ns
**/
export async function getServers(ns) {
  await ns.tprint("GetServers called");
  var NewServers = new Array();
  var SeenServers = new Array();
  NewServers.push("home");
  await ns.tprint("NewServers array length : " + NewServers.length);
  await ns.tprint("test");
  while (NewServers.length > 0) {
    let s1 = NewServers.pop();
    await ns.tprint("checking: " + s1);
    if (!SeenServers.includes(s1)) {
      await ns.tprint(s1 + " has not been seen already");
      let connections = await ns.scan(s1);
      let i = 0;
      while (i < connections.length) {
        let newServer = connections[i];
        await ns.tprint("Adding: " + newServer);
        NewServers.push(newServer);
        i++;
      }
      SeenServers.push(s1);
    } else {
      await ns.tprint(s1 + " has already been checked");
    }
  }
  await ns.tprint("seen servers: " + SeenServers.length);
  let fullServers = new Array();
  while (SeenServers.length > 0) {
    let sname = SeenServers.pop();
    let server = await buildServer(ns, sname);
    if (server.HackScore > 0 ){
      await ns.tprint(JSON.stringify(server));
    }
    
    fullServers.push(server)
  }
  return fullServers;
}


/**
 * 
 * @param {NS} ns 
 * @param {string} name 
 * @returns {Server}
 */
export async function buildServer(ns, name) {
  let server = new Object();
  server.Name = name;
  server.RequiredPorts = await ns.getServerNumPortsRequired(server.Name);
  server.RequiredLevel = await ns.getServerRequiredHackingLevel(server.Name);
  server.MinSecurity = await ns.getServerMinSecurityLevel(server.Name);
  server.MaxMoney = await ns.getServerMaxMoney(name);
  server.RAM = await ns.getServerMaxRam(server.Name);
  server = await scoreServer(ns,server);
  server = await growScoreServer(ns, server);
  server = await weakenScoreServer(ns, server);
  /*
  server.hackSecs = await ns.getHackTime(server.Name);
  server.growSecs = await ns.getGrowTime(server.Name);
  server.weakSecs = await ns.getWeakenTime(server.Name);
  server.maxMoney = await ns.getServerMaxMoney(name);

  //await ns.tprint("Server: "+server);
  */
  return server;

}

/**
* @param {NS} ns
* @param {string} server
**/
export async function scoreServerName(ns, server) {
  //the closer we are to max money the more we can hack
  let curMoney = await ns.getServerMoneyAvailable(server);
  let x = await ns.getServerMoneyAvailable(server)
  let maxMoney = await ns.getServerMaxMoney(server);
  let hackPercent = await ns.hackAnalyze(server);
  let hackMoney = hackPercent * curMoney;
  let hackChance = await ns.hackAnalyzeChance(server);
  let m1 = 1 / (1 - hackPercent);
  let gthreads = Math.max(await ns.growthAnalyze(server, m1), 1);
  let hackRam = 0.1;
  let growRam = 0.15;
  let weakRam = 0.15;
  let hackSecs = await ns.getHackTime(server);
  let growSecs = await ns.getGrowTime(server);
  let weakSecs = await ns.getWeakenTime(server);
  let weakThreads = ((0.002) + (gthreads * 0.004)) / 0.005;
  weakThreads = Math.ceil(Math.max(weakThreads, 1));
  let score = (hackChance * hackMoney) / (
    (hackRam * hackSecs) +
    (gthreads * (growRam * growSecs)) +
    (weakThreads * (weakRam * weakSecs))
  );
  return score;
}
/**
 * Cost / Benefit analysis of hacking server
 * @param {NS} ns
 * @param {Server} server
 */
export async function scoreServer(ns, server){
  if (server.Name != "home") {
    let curMoney = await ns.getServerMoneyAvailable(server.Name);
    let hackPercent = await ns.hackAnalyze(server.Name);
    let hackMoney = hackPercent * curMoney;
    let hackChance = await ns.hackAnalyzeChance(server.Name);
    let m1 = 1 / (1 - hackPercent);
    let gthreads = Math.max(await ns.growthAnalyze(server.Name, m1), 1);

    let hackRam = 0.1;
    let growRam = 0.15;
    let weakRam = 0.15;
    let hackSecs = await ns.getHackTime(server.Name);
    let growSecs = await ns.getGrowTime(server.Name);
    let weakSecs = await ns.getWeakenTime(server.Name);
    let weakThreads = ((0.002) + (gthreads * 0.004)) / 0.005;
    weakThreads = Math.ceil(Math.max(weakThreads, 1));
    let score = (hackChance * hackMoney) / (
      (hackRam * hackSecs) +
      (gthreads * (growRam * growSecs)) +
      (weakThreads * (weakRam * weakSecs))
    );
    server.GrowThreads = Math.ceil(gthreads);
    server.WeakenThreads = Math.ceil(weakThreads);
    server.HackScore = score;
  } else {
    server.HackScore = 0;
    server.GrowThreads = 0;
    server.WeakenThreads = 0;
  }
 

  return server;
}

/**
 * cost benefit analysis of growing server
 * @param {NS} ns
 * @param {Server} server
 */
export async function growScoreServer(ns, server){
  let curMoney = await ns.getServerMoneyAvailable(server.Name);
  if (curMoney != server.MaxMoney && server.Name != "home" && server.HackScore > 0) {
    let m1 = server.MaxMoney / curMoney;
    //await ns.tprint(server.Name + "m1 = "+m1);
    let gthreads = Math.max(await ns.growthAnalyze(server.Name, m1), 1);
    let wthreads = Math.ceil(Math.max(1, 4/5 * gthreads));
    let growSecs = await ns.getGrowTime(server.Name);
    let weakSecs = await ns.getWeakenTime(server.Name);
    let growCost = (0.15 * gthreads * growSecs) + (0.15 * wthreads * weakSecs);
    let reward = server.MaxMoney / server.MinSecurity;
    server.GrowScore = reward/growCost;
  } else {
    server.GrowScore = 0;
  }
  return server;
}

/**
 * 
 * @param {NS} ns 
 * @param {Server} server 
 * @returns {Server} server
 */
export async function weakenScoreServer(ns, server) {
  let curSec = await ns.getServerSecurityLevel(server.Name);
  if (curSec != server.MinSecurity && server.Name != "home" && server.HackScore > 0) {
    let wthreads = Math.ceil(Math.max(1, (curSec - server.MinSecurity)/ 0.05));
    let weakSecs = await ns.getWeakenTime(server.Name);
    let weakCost = (0.15 * wthreads * weakSecs)
    let reward = server.MaxMoney / server.MinSecurity;
    server.WeakenScore = reward / weakCost;
  } else {
    server.WeakenScore = 0;
  }

  return server;
}

/**
 * calls getServers and writes the results to a JSON file
 * 5.45 GB of Ram
 * @param {NS} ns 
 * @param {[Server]} Servers
 * @returns {[Server]} servers
 */
export async function writeServers(ns, Servers = null) {
  if (Servers == null) {
    Servers = await getServers(ns);
  }
  let ServerString = JSON.stringify(Servers);
  await ns.write(serverFile, ServerString, "w");
  return Servers;
}

/**
 * returns an array of Server objects
 * @param {NS} ns 
 */
export async function readServers(ns) {
  let ServerString = await ns.read(serverFile);
  let Servers = new Array();
  if (ServerString != "") {
    Servers = JSON.parse(ServerString);
  }
  return Servers;
}

/**
 * Builds a context object that includes our basic information
 * @param {NS} ns 
 * @returns {Context} context
 */
export async function buildContext(ns) {
  var ContextFileString = await ns.read(contextFile);
  var Context = new Object();
  if (ContextFileString != "") {
      Context = JSON.parse(ContextFileString);
  } else {
      Context.ProgramLevel = 0;
      Context.HackingLevel = 0;
      Context.Money = 0;
  }
  Context.Money = await ns.getServerMoneyAvailable("home");
  Context.HackingLevel = await ns.getHackingLevel();
  Context.ProgramLevel = await getProgramLevel(ns);
  await ns.write(contextFile,JSON.stringify(Context),"w")
  return Context;
}

/**
 * @param {NS} ns
 * @returns {int} highes program level available
 */
export async function getProgramLevel(ns) {
    var stop = false;
    var index = 0;
    while (!stop && index < programs.length) {
        var program = programs[index]
        var exists = await ns.fileExists(program)
        if (!exists) {
            stop = true;
        } else {
            index++;
        }        
    }
    return index; 
}

/**
 * Scan's the server information to identify the best targets and set them up for 
 * later use
 * @param {NS} ns 
 */
export async function setTargets(ns) {
  let servers = await readServers(ns);
  await ns.tprint("servers: "+JSON.stringify(servers));
  let hackServer = null;
  let growServer = null;
  let weakenServer = null;
  for (var i = 0; i < (await servers).length; i++) {
    let server = servers[i];
    if (hackServer == null || hackServer.HackScore < server.HackScore) {
      await ns.tprint("found hack target: "+server.Name);
      hackServer = server;
    }
    if (weakenServer == null || weakenServer.WeakenScore < server.WeakenScore) {
      await ns.tprint ("found weaken server: "+server.Name);
      weakenServer = server;
    }
    if (growServer == null || growServer.GrowScore < server.GrowScore) {
      await ns.tprint("found grow server: "+server.Name);
      growServer = server;
    }
  }
  await ns.write(hackTargetFile, JSON.stringify(hackServer),"w");
  await ns.write(growTargetFile, JSON.stringify(growServer), "w");
  await ns.write(weakTargetFile, JSON.stringify(weakenServer),"w");
}

/**
 * 
 * @param {NS} ns 
 */
export async function WeakenBatch(ns) {
  let targetString = await ns.read(weakTargetFile);
  let target = JSON.parse(targetString);
  let servers = await readServers(ns);
  let TotalRam = getTotalRam(servers);
  let batchRam = 2;
  let maxThreads = TotalRam / batchRam;
  let curSec = await ns.getServerSecurityLevel(target.Name);
  let wthreads = Math.ceil(Math.max(1, (curSec - target.MinSecurity)/ 0.05));
  let runThreads = Math.min(wthreads, maxThreads);
  // since it's only weaken I don't have to worry about time just have to space them out on a server by server basis
  var runningThreads = 0;
  var serverIndex = 0;
  while (serverIndex < servers.length && runningThreads < runThreads) {
    let server = servers[serverIndex];
    if (await ns.hasRootAccess(server.Name)) {
      await ns.killall(server.Name); //kill running processes
      let sThreads = server.RAM / 2; //number of threads this server can support
      await ns.exec("OneWeaken.js",server.Name,sThreads,target.Name);
      runningThreads += sThreads;
      await ns.sleep(effectBuffer);
    }

    serverIndex++;
    
  }
} 

/**
 * executes a sequence of grow and weaken threads
 * @param {NS} ns
 */
export async function GrowBatch(ns) {
  let targetString = await ns.read(growTargetFile);
  let target = JSON.parse(targetString);
  let servers = await readServers(ns);
  let TotalRam = getTotalRam(servers);
  let batchRam = 2;
  let maxThreads = TotalRam / batchRam;
  let curMoney = await ns.getServerMoneyAvailable(server.Name);
  let m1 = server.MaxMoney / curMoney;
  let gthreads = 2 * Math.ceil(Math.max(await ns.growthAnalyze(server.Name, m1), 1));
  let runThreads = Math.min(gthreads, maxThreads);
  let weakSecs = await ns.getWeakenTime(server.Name);
  let growSecs = await ns.getGrowTime(server.Name);
  let wbuffer = 2 * effectBuffer;
  let woverlaps = Math.ceil(weakSecs / wbuffer); // how many weakens will be runnig simultaneous if we do our timing right
  let goverlaps = Math.ceil(growSecs / wbuffer); // how many grow threads might run overlapped
  let growDelay = Math.max(0,Math.floor(weakSecs - (growSecs + effectBuffer))); // how many seconds after a weaken starts to start the corresponding grow
  let wstarts = Math.floor(growDelay / (2 * effectBuffer)); //how many other weakens will we launch before launching the next grow;
  let weakenTimes = new Array();
  let growTimes = new Array();
  let nextEffect = growSecs + growDelay; //allow enough time for the weaken to start
  let plannedThreads = 0;
  //plan out starts up to runThreads
  while (plannedThreads < runThreads - 1) {
    //plan the grow
    growTimes.push(Math.max(0,nextEffect - growSecs));
    nextEffect += effectBuffer; //set up for when the weaken should hit
    //plan the weaken
    weakenTimes.push(Math.max(0,nextEffect - weakSecs));
    nextEffect += effectBuffer; // set up for the next grow to hit
    plannedThreads += 2;

  }
  let weakenIndex = 0;
  let growIndex = 0;
  let threads = new Array();
  while (weakenIndex < weakenTimes.length || growIndex < growTimes.length) {
    let thread = new ThreadPlan();
    let nextWeaken = null;
    let nextGrow = null;
    if (weakenIndex < weakenTimes.length) {
      nextWeaken = weakenTimes[weakenIndex];
    }
    if (growIndex < growTimes.length) {
      nextGrow = growTimes[growIndex];
    }
    if (nextGrow != null && (nextWeaken == null || nextGrow < nextWeaken)) {
      thread.Start = nextGrow;
      thread.Type = "Grow";
      growIndex++;
    } else if (nextWeaken != null) {
      thread.Start = nextWeaken;
      thread.Type = "Weaken";
      weakenIndex++;
    }
    threads.push(thread);
  }

  //now we have an ordered list we can cycle through servers;
  var threadIndex = 0;
  let serverIndex = 0;
  let totalDelay = 0;
  while (serverIndex < servers.length && threadIndex < threads.length) {
    let server = servers[serverIndex];
    let sRAM = 0;
    //if we've nuked it
    if (await ns.hasRootAccess(server.Name)) {
       //as long as we can assign 2 gig of ram
      while (sRAM < server.RAM - 1 && threadIndex < threads.length){
        while (threadIndex < threads.length) {
          let thread = threads[threadIndex];
          //if it's not time yet then sleep until it is
          if (thread.Start > totalDelay) {
            let wait = thread.Start - totalDelay;
            totalDelay += wait;
            await ns.sleep(wait);
          }
          switch (thread.Type) {
            case "Grow":
              await ns.exec("OneGrow.js",server.Name,1,target.Name);
              break;
            case "Weaken":
              await ns.exec("OneWeaken.js",server.Name,1,target.Name);
          }
          sRAM += 2;
          threadIndex++;
        }
      }
    }
    //out of ram on this server so let's cycle through to the next
    serverIndex++;
  }
}

/**
 * get's the total ram available.
 * this will intentionally underreport when servers have odd amounts of ram
 * @param {[Server]} servers 
 */
function getTotalRam(servers) {
  var i = 0;
  var TotalRam = 0;
  while (i < servers.length) {
    let server = servers[i];
    let sram = (Math.floor(server.RAM / 2)) * 2
    TotalRam += sram;
    i++;
  }
}
