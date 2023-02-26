export async function main(ns) {
	if (ns.getHostname() !== "home") {
		throw new Exception ("Please run this from home");
	}
	var files = new Array();
	files.push("WormBot.js");
	files.push("WormHack.js");
	files.push("WormNuke.js");
	files.push("autohack.js");
	files.push("scriptLauncher.js");
  
	for (var i = 0; i < files.length; i++) {
		let filename = files[i];
		let url = "https://raw.githubusercontent.com/cdm014/bitburnerFiles/master/"+filename;
		await ns.tprint(url);
		await ns.wget(url,filename);
	}
}
