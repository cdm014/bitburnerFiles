export async function main (ns) {
	var scriptName =  ns.args[0];
	var newArgs = new Array();
	for (var index = 1; index < ns.args.length; index++) {
		newArgs.push(ns.args[index]);
	}
	var server = await ns.getHostname();
	var maxRam = await ns.getServerMaxRam(server);
	var reqRam = await ns.getScriptRam(scriptName);
	var threads = Math.max(1,Math.floor(maxRam/reqRam));
	await ns.spawn(scriptName,threads, newArgs);
}
