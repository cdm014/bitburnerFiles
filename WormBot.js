/*
 * Name:
 * WormBot.js
 *
 * Parameters:
 * target - hostname to run action against
 * action - action to run
 *
 * Description:
 * gets list of connected servers. 
 * if they're not already running this script with the right parameters
 * kills all processes running then tries running the action against the target in a loop
 */

export async function main(ns) {
	//get our parameters
	var target = ns.args[0];
	var action = ns.args[1];
	// get our list to propagate to
	var connections = await ns.scan();
	for (var i = 0; i < connections.length;i++) {
		var host = connections[i];
		await spread(host, target, action, ns);
	}
	await attack(target, action, ns);
}

async function attack(target, action, ns) {
	while(true) {
		switch(action) {
			case "weaken":
				await ns.weaken(target);
				break;
			case "grow":
				await ns.grow(target);
				break;
			case "hack":
				await ns.hack(target);
				break;
			case "killall":
				let server = await ns.getHostname();
				await ns.killall(server);
				break;
		}
	}
}

async function spread(host, target, action, ns) {
	let canAccess = await ns.hasRootAccess(host);
	if (canAccess) {
		//check if we're running the script against the right target with the right action
		var isRunning = await ns.isRunning("WormBot.js",host,target,action);
		if (!isRunning) {
			await ns.killall(host);
			await ns.scp("WormBot.js", host);
			let maxMem = await ns.getServerMaxRam(host);
			let reqMem = await ns.getScriptRam("WormBot.js");
			let threads = Math.floor(maxMem/reqMem);
			await ns.tprint(host,"maxMem: "+maxMem+" reqMem: "+reqMem+" threads: "+threads);
			await ns.exec("WormBot.js",host,Math.max(1,threads),target,action);
			
		}
	}
}