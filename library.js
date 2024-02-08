var programs = ["BruteSSH.exe","FTPCrack.exe","relaySMTP.exe","HTTPWorm.exe","SQLInject.exe"];

/**
 * gets an integer value representing how many ports we can open
 * @param {*} ns - netscript library provided by game
 */
async function getProgramLevel(ns) {
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
 * gets a list of all servers reachable from home i
 * this shouldn't need to be called often
 * @param {netscript} ns 
 * @returns Array of server objects
 */
async function getServers(ns) {
    var NewServers = new Array();
    var SeenServers = new Array();
    NewServers.push("home");
    while (NewServers.length >0 ) {
        let s1 = NewServers.pop();
        if (!SeenServers.includes(s1)) {
            let connections = await ns.scan(s1);
            let i = 0;
            while (i < connections.length) {
                let newServer = connections[i];
                NewServers.push(newServer);
                i++;
            }
            SeenServers.push(s1);
        }
    }
    let fullServers = new Array();
    while (SeenServers.length > 0 ) {
        let sname = SeenServers.pop();
        let server = buildServer(ns,sname);
        fullServers.push(server)
    }
    return fullServers;
}

/**
 * calls getServers and writes the results to a JSON file
 * @param {netscript} ns 
 */
async function writeServers(ns) {
    let Servers = getServers(ns);
    let ServerString = JSON.stringify(Servers);
    await ns.write("Servers.JSON",ServerString,"w");
}

/**
 * returns an array of Server objects
 * @param {netscript} ns 
 */
async function readServers(ns) {
    let ServerString = await ns.read("Servers.JSON");
    let Servers = new Array();
    if (ServerString != "") {
        Servers = JSON.parse(ServerString);
    }
    return Servers;
}

/**
 * Checks if we're capable of hacking this server
 * @param {netscript} ns 
 * @param {ContextObject} context 
 * @param {string} server 
 */
async function canNuke(ns, context, server) {
    var portsRequired = await ns.getServerNumPortsRequired(server);
    var levelRequired = await ns.getServerRequiredHackingLevel(server);
    if (portsRequired <= context.ProgramLevel &&
        levelRequired <= context.HackingLevel) {
            return true;
        } else {
            return false;
        }
}

/**
 * Builds a context object that includes our basic information
 * @param {netscript} ns 
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

/**
 * Reads the Context object from the file system and returns it
 * @param {netscript} ns 
 * @returns Context
 */
async function readContext(ns) {
    var ContextFileString = await ns.Read("Context.JSON");
    var Context = new Object();
    if (ContextFileString != "") {
        Context = JSON.parse(ContextFileString);
    } else {
        Context = await BuildContext(ns);
    }
    return Context;
}

async function nukeServer(ns, context, server) {
    let index = context.ProgramLevel;
    while (index > 0) {
        switch(index) {
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
    }
    await ns.nuke(server);
}

async function buildServer(ns, name) {
    let server = new Object();
    server.Name = name;
    server.RequiredPorts =  await ns.getServerNumPortsRequired(server.Name);
    server.RequiredLevel = await ns.getServerRequiredHackingLevel(server.Name);
    server.MinSecurity = await ns.getServerMinSecurityLevel(server.Name);
    server.MaxMoney = await ns.getServerMaxMoney(target);

}

/**
 * score by likely money received over time
 * @param {netscript} ns 
 * @param {Server} server 
 */
async function scoreServer(ns, server) {
    let hackSuccess = 1;
    let hackPercent = await ns.hackAnalyzePercent(server.Name);
    let moneyAvailable = await ns.getServerMoneyAvailable(server.Name);
    let hackMultiplier = 100 / (100 - hackPercent); 
    let hackAmount = (hackPercent / 100 ) * hackSuccess *  moneyAvailable;
    let growthNumber = await ns.growthAnalyze(server.Name,hackMultiplier);
    let weakenNumber = Math.max((0.002 + (growthNumber * 0.004)) / 0.005,1);
    let hackTime = await ns.getHackTime(server.Name);
    let growTime = await ns.getGrowTime(server.Name) * growthNumber;
    let weakTime = await ns.getWeakkenTime(server.Name) * weakenNumber;
    let totalTime = hackTime + growTime + weakTime;
    server.Score = hackAmount / totalTime;
    return server;
}