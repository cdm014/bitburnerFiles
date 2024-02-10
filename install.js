export async function main(ns) {
	if (ns.getHostname() !== "home") {
		throw new Exception ("Please run this from home");
	}
	var files = new Array();
	files.push("TinyHack.js");
	files.push("TinyGrow.js");
	files.push("TinyWeaken.js");
	files.push("Controller.js");
	files.push("library.js"); 
	
  
	for (var i = 0; i < files.length; i++) {
		let filename = files[i];
		let url = "https://raw.githubusercontent.com/cdm014/bitburnerFiles/master/"+filename;
		await ns.tprint(url);
		await ns.wget(url,filename);
	}
}
