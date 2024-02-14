var programs = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];
var serverFile = "/Servers.txt"


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

    await ns.tprint(JSON.stringify(server));
    fullServers.push(server)
  }
  return fullServers;
}

export async function buildServer(ns, name) {
  let server = new Object();
  server.Name = name;
  server.RequiredPorts = await ns.getServerNumPortsRequired(server.Name);
  server.RequiredLevel = await ns.getServerRequiredHackingLevel(server.Name);
  server.MinSecurity = await ns.getServerMinSecurityLevel(server.Name);
  server.MaxMoney = await ns.getServerMaxMoney(name);
  server = await scoreServer(ns,server);
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
 * @param {NS} ns
 * @param {SERVER} server
 */
export async function scoreServer(ns, server){
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
  server.Score = score;

  return server;
}

/**
 * calls getServers and writes the results to a JSON file
 * 5.45 GB of Ram
 * @param {NS} ns 
 */
export async function writeServers(ns) {
  let Servers = await getServers(ns);
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
 * 
 * @param {NS} ns 
 * @param {SERVER} server 
 */
export async function runBatch(ns, server) {

}


/**
 * Builds a context object that includes our basic information
 * @param {NS} ns 
 * @returns Context
 */
async function buildContext(ns) {
  var ContextFileString = await ns.Read("Context.JSON");
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
  await ns.Write("Context.JSON",Context,"w")
  return Context;
}