/*
 * Name:
 * WormHack.js
 *
 * Parameters:
 * target - hostname to run autohack against
 *
 * Description:
 * Propagates through servers I have root access to
 * delivers the autohack.js file
 * delivers the WormHack.js file
 * executes WormHack.js on the new servers
 * sleeps for 30 seconds to avoid loopbacks
 * spawns autohack.js against the target
 */
export async function main(ns) {
	var target = ns.args[0];
	
	//get list of computers we can spread to
	var connections = await ns.scan();
	for (var i = 0; i < connections.length;i++) {
		var host = connections[i];
		await spread(host, target, ns);
	}
			await ns.sleep(30*1000);
			let server = await ns.getHostname();
			let maxMem = await ns.getServerMaxRam(server);
			let reqMem = await ns.getScriptRam("autohack.js");
			let threads = Math.max(1,Math.floor(maxMem/reqMem));
			await ns.spawn("autohack.js",threads,target);
}

async function spread (host, target, ns) {
	await ns.tprint("Trying to WormHack "+host);
	let canAccess = await ns.hasRootAccess(host);
	if (canAccess) {
		let wormHackRunning = await ns.isRunning("WormHack.js",host,target);
		let autoHackRunning = await ns.isRunning("autohack.js",host,target);
		if (!wormHackRunning && !autoHackRunning) {
			await ns.killall(host);
			await ns.scp("WormHack.js", host);
			await ns.scp("autohack.js", host);
			await ns.exec("WormHack.js",host,1,target);
		}
	}
}