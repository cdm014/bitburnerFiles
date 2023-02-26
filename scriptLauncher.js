/*
 * Name:
 * scriptLauncher.js
 *
 * Parameters:
 * script name - name of script to run on current host
 * passable parameters - parameters for the script to be run
 *
 * Description: 
 * runs the script whose name is the first argument as many times as ram allows
 */

export async function main (ns) {
	var scriptName =  ns.args[0];
	var newArgs = ns.args.slice(2);
	var server = await ns.getHostname();
	await ns.killall();
	var maxRam = await ns.getServerMaxRam(server);
	var reqRam = await ns.getScriptRam(scriptName);
	var threads = Math.max(1,Math.floor(maxRam/reqRam));
	await ns.spawn(scriptName,threads, ...newArgs);
}
