/***
 * NAME: Controller.js
 * PARAMETER: HOSTNAME -- TARGET TO EXPLOIT
 * DESCRIPTION: 
 * 1. ATTEMPTS TO NUKE THE NETWORK GAINING ROOT ACCESS WHERE POSSIBLE
 * 2. DEPOSITS PAYLOAD ON ROOTED SERVERS
 * 3. ENGAGES ROOTED SERVERS IN HGW ATTACK
 */

/*** port openers */
var files = ["NA.EXE","SQLInject.exe","HTTPWorm.exe","relaySMTP.exe","FTPCrack.exe","BruteSSH.exe","NUKE.exe"];
var scripts = ["TinyWeaken.js", "TinyGrow.js","TinyHack.js"];
var NewServers = new Array();
var CheckedServers = new Array();
var BotList = new Array();
var vlevel;
var weakenMem;
var growMem;
var hackMem;
var myHackingLevel;
export async function main(ns) {
  files = ["NA.EXE","SQLInject.exe","HTTPWorm.exe","relaySMTP.exe","FTPCrack.exe","BruteSSH.exe","NUKE.exe"];
  scripts = ["TinyWeaken.js", "TinyGrow.js","TinyHack.js"];
  
  ns.tprint("Starting");
  let OldAction = "old";
  let time = 180;
  weakenMem = await ns.getScriptRam("TinyWeaken.js");
  growMem = await ns.getScriptRam("TinyGrow.js");
  hackMem = await ns.getScriptRam("TinyHack.js");
  var target = ns.args[0];
    files = files.reverse();
    vlevel = await HackLevel(ns);
  await ns.sleep(100);
  
  await ns.tprint("HackLevel: "+vlevel);
  while(true) {
    vlevel = await HackLevel(ns);
    await ns.tprint("HackLevel: "+vlevel);
    myHackingLevel = await ns.getHackingLevel();
    await nuke(ns);
    
    await ns.tprint("Bots: "+BotList);
    OldAction = "old";
    let r = 0;
    while (r < 10) {
        let action = await PickAction(ns, target);
        if (action != OldAction) {
             await ns.tprint ("Action: "+action);
            time = await Act(ns, action, target)  ;
            OldAction = action;
        }
        time = await GetTime(ns,action,target);

     
      
      await ns.sleep(time);
      r++;
    }

  
  }
}

async function HackLevel(ns) {
  files = ["NA.EXE","SQLInject.exe","HTTPWorm.exe","relaySMTP.exe","FTPCrack.exe","BruteSSH.exe","NUKE.exe"];
  files = files.reverse();

  for(var i = 0;  i <= files.length;i++) {
    await ns.tprint ("i: "+i);
    let file = files[i];
    await ns.tprint("file: "+file);
    if (! await ns.fileExists(file))
    {
      return i - 1;
    }
  }
}

async function nuke(ns) {
    CheckedServers = new Array();
  NewServers = new Array();
  BotList = new Array();
  NewServers.push("home");
  vlevel = await HackLevel(ns);
    await ns.tprint("HackLevel: "+vlevel);
  //await ns.tprint ("NewServers Count: "+ NewServers.length);
  var i = 0;
  while ( NewServers.length >0 ) {
    //await ns.tprint("Servers to Check: "+NewServers);
    let server = NewServers.pop();
    
    //await ns.tprint("i: "+i);
    var contained = await Contains(ns, CheckedServers,server);
    //await ns.tprint(server+" contained: "+contained);
    if (!contained) {
      //await ns.tprint("Checking: "+server);
      await scan(ns, server);
      var rooted = await ns.hasRootAccess(server);
      //await ns.tprint("rooted: " + rooted);
      var SufficientHacking = (myHackingLevel >= await ns.getServerRequiredHackingLevel(server));
      //await ns.tprint("high enough: "+SufficientHacking);
      var canOpen = (vlevel >= await ns.getServerNumPortsRequired(server));
      //await ns.tprint("canOpen: "+canOpen);

      if (!rooted && SufficientHacking && canOpen) {
        //await ns.tprint("trying for root on: "+server);
        await GetRoot(ns,server);
      }
      rooted = await ns.hasRootAccess(server);
      if (rooted) {
        //copy the files over
        //add it to our bot list
        if (server != "home"){
          await CopyFiles(ns,server);
          BotList.push(server);
        }
        
      }
      CheckedServers.push(server)
    }
    
    i++;
  }

}

async function Contains(ns, array, value) {
  //await ns.tprint("Contains called");
  //await ns.tprint("value: "+value);
  //await ns.tprint("array: "+array);
  var i = 0;
  while (i < array.length) {
    //await ns.tprint("contains "+i);
    let entry = array[i];
    if (entry == value) {
      //await ns.tprint(entry +"  = "+value);
      return true;
    } else {
      //await ns.tprint(entry+" != "+value);
    }
    i++;
  }
  return false;
}

async function scan(ns, server) {
  let connections = await ns.scan(server);
  let i = 0;
  while (i < connections.length) {
    let con = connections[i];
    if (!await Contains(ns,CheckedServers,con)) {
      //await ns.tprint("adding: "+con);
      NewServers.push(con);
    }
    i++;
  }
  
}

async function GetRoot(ns, server) {
  //await ns.tprint("getroot called for "+server);
  let level = vlevel;
  while (level > 0) {
    switch (level) {
      case 5:
        await ns.sqlinject(server);
        //await ns.tprint("trying sqlinject");
        break;
      case 4:
        //await ns.tprint("trying httpworm");
        await ns.httpworm(server);
        break;
      case 3:
        //await ns.tprint("trying relaySMTP");
        await ns.relaysmtp(server);
        break;
      case 2:
        //await ns.tprint("trying ftpcrack");
        await ns.ftpcrack(server);
        break;
      case 1:
        //await ns.tprint("trying brutess");
        await ns.brutessh(server);
        break;

    }
    level--;
  }
  await ns.nuke(server);
  //await ns.tprint("has root on "+server+": "+await ns.hasRootAccess(server));

}

async function CopyFiles(ns, server) {
  let i = 0;
  var scripts1 = ["TinyWeaken.js", "TinyGrow.js","TinyHack.js","OneWeaken.js","OneHack.js","OneGrow.js","library.js"];
  while (i < scripts1.length) {
    let filename = scripts1[i];
    await ns.scp(filename, server);
    i++;
  }

}

async function PickAction(ns, target) {
  let maxMoney = await ns.getServerMaxMoney(target);
  let curMoney = await ns.getServerMoneyAvailable(target);
  let minSecurity = await ns.getServerMinSecurityLevel(target);
  let curSecurity = await ns.getServerSecurityLevel(target);
  if (curSecurity > (minSecurity * 2)) {
    return "weaken";
  } else if (curMoney < (maxMoney * .9)){
   return "grow";
  } else {
    return "hack";
  }
}

async function Act (ns, action, target) {
  //await ns.tprint ("starting to "+action+" against "+target);
  var i = 0;
  var x = 0;
  let time = 0;
  let scriptMem = 0;
  switch(action) {
    case "hack":
      scriptMem = hackMem;
      x = 2;
      time = await ns.getHackTime(target);
      break;
    case "grow":
      scriptMem = growMem;
      time = await ns.getGrowTime(target);
      x = 1;
      break;
    case "weaken":
      scriptMem = weakenMem;
      time = await ns.getWeakenTime(target);
      x = 0;
      break;
  }
  let filename = scripts[x];
  

  while (i < BotList.length){
    let bot = BotList[i];
    //await ns.tprint("using: "+bot);
    await ns.killall(bot);
    let mem = await ns.getServerMaxRam(bot);
    let t = Math.floor(mem / scriptMem);
    if (t > 0) {
      await ns.exec(filename,bot,t,target);
    }
    

    i++;
  }
  return time;
}

async function GetTime(ns, action, target) {
  var i = 0;
  var x = 0;
  let time = 0;
  let scriptMem = 0;
  switch(action) {
    case "hack":
      scriptMem = hackMem;
      x = 2;
      time = await ns.getHackTime(target);
      break;
    case "grow":
      scriptMem = growMem;
      time = await ns.getGrowTime(target);
      x = 1;
      break;
    case "weaken":
      scriptMem = weakenMem;
      time = await ns.getWeakenTime(target);
      x = 0;
      break;
  }
  return time;
}


