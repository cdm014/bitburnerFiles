export async function main(ns) {
	if (ns.getHostname() !== "home") {
		throw new Exception ("Please run this from home");
	}
	var files = new Array();
	files.push("TinyHack.js");
	files.push("oneHack.js");
	files.push("TinyGrow.js");
	files.push("oneGrow.js");
	files.push("TinyWeaken.js");
	files.push("oneWeaken.js");
	files.push("Controller.js");
	files.push("library.js"); 
	files.push("test.js");
	for (var i = 0; i < files.length; i++) {
		let filename = files[i];
		await ns.rm(filename);
	}
  
	for (var i = 0; i < files.length; i++) {
		let filename = files[i];
		let url = "https://raw.githubusercontent.com/cdm014/bitburnerFiles/master/"+filename;
		await ns.tprint(url);
		await ns.wget(url,filename);
	}
}
