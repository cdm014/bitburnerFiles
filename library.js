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

async function getAllServers(ns) {
    var CheckedServers = new Array();
    var SeenServers = new Array();
    CheckedServers.push("home");
}