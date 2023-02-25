/*
 * Name:
 * WormNuke.js
 *
 * Parameters:
 * currentPath - slash delimited path of servers from home to this server
 * level - lets the script know which tools can be employed
 *	0 - Nuke Only
 *	1 - BruteSSH 
 *	2 - FTPcrack
 *	3 - relaysmtp
 *	4 - httpworm
 *	5 - sqlinject
 *
 * Description:
 * scans servers connected to this server. Tries to nuke them then copy this script to them and run it
 */

export async function main(ns) {
	var currentPath = ns.args[0]; //comma delimited list of computers this script has been run on
	var level = ns.args[1]; //level of hack (how many ports we have programs to open)
	var connections = await ns.scan();	//list of machines this computer connects to
	var newConnections = new Array(); //where we'll hold the list of machines we haven't seen 

	for (var i = 0; i < connections.length; i++) {
		let hostname = connections[i];
		if (!(currentPath.includes(hostname))){
			// this is a new host we think
			newConnections.push(hostname);
		}
	}
	for (var i = 0; i < newConnections.length; i++) {
		let newHost = newConnections[i];
		await tryConnect(newHost, currentPath, level, ns);
	}
}

async function tryConnect(newHost, currentPath, level, ns) {
	//hack it if we already have not hacked it
	await ns.tprint("trying to connect to "+newHost);
	let NukeTries = 5;
	while (NukeTries > 0 ) {
		var hasRootAccess = await ns.hasRootAccess(newHost);
		if (!hasRootAccess) {
			await ns.tprint("I don't yet have access to "+newHost);
			let NumPortsRequired = await ns.getServerNumPortsRequired(newHost);
			if (NumPortsRequired <= level){
				await ns.tprint("I should be able to gain access to"+newHost);
				if (level >= 1) {
					await ns.brutessh(newHost);
				}
				if (level >= 2) {
					await ns.ftpcrack(newHost);
				}
				if (level >= 3) {
					await ns.smtprelay(newHost);
				}
				if (level >= 4) {
					await ns.httpworm(newHost);
				}
				if (level >= 5) {
					await ns.sqlinject(newHost);
				}
				await ns.nuke(newHost)
			} else {
				await ns.tprint("I don't think I can connect to "+newHost);
			}
		}
		NukeTries--;
	}
	let access = await ns.hasRootAccess(newHost);
	if (access) {
		await ns.tprint("I have access to "+newHost);
		//copy this script to it if it does not have it
		await ns.scp("WormNuke.js",newHost);
		//kill scripts currently running
		await ns.killall(newHost);
		//run this script on newHost
		let newPath = currentPath +"/"+newHost;
		await ns.exec("WormNuke.js",newHost,1,newPath,level);
	}
}