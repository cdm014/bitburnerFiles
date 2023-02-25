/*
 * Name:
 * autohack.js
 *
 * Parameters:
 * server - hostname to try to hack
 *
 * Description:
 * Script attempts to maximize income against target
 *
 */

export async function main(ns) {
	var server = ns.args[0];
	//Nuke our target or try
  var NukeTries = 5;
	while (NukeTries > 0) {
		var hasRootAccess = await ns.hasRootAccess(server);
		if (!hasRootAccess) {
			await nuke(server);
		}
		NukeTries--;
	}
	var hasRootAccess = await ns.hasRootAccess(server);

	if (hasRootAccess) {
		//if we have root access configure some info so we can know what to do
		var MaxMoney = await ns.getServerMaxMoney(server);
		var MoneyThresh = MaxMoney *.75;
		var MinSec = await ns.getServerMinSecurityLevel(server);
		var SecGoal = MinSec * 1.5;
		var SecThresh = MinSec * 2;
		var vserver = await ns.getHostname();
		while(true) {
			//main loop
			//execute an action 5 times so we're not constantly re-evaluating
			await ns.tprint(vserver + " Sec: "+ns.getServerSecurityLevel(server)+"/"+MinSec);
			await ns.tprint(vserver + " Money: "+ns.getServerMoneyAvailable(server)+"/"+MaxMoney);
			//if money is too low grow it
			if (ns.getServerMoneyAvailable(server) < MoneyThresh) {
				while (ns.getServerMoneyAvailable(server) < MaxMoney *.9)
				{
					await ns.tprint(vserver+" Growing");
					await ns.tprint(vserver+" Money: "+ns.getServerMoneyAvailable(server)+"/"+MaxMoney);
					await ns.grow(server);
				}
			} else if (ns.getServerSecurityLevel(server) > SecThresh)
			{
				while (ns.getServerSecurityLevel(server) > SecGoal) 
				{
					await ns.tprint(vserver+" weaken");
					await ns.tprint(vserver+" Sec: "+ns.getServerSecurityLevel(server)+"/"+MinSec);
					await ns.weaken(server);
				}
			} else 
			{
				while (ns.getServerMoneyAvailable(server) > MoneyThresh && ns.getServerSecurityLevel(server) < SecThresh) 
				{
					await ns.tprint(vserver+" hacking "+server);
					await ns.hack(server);
				}
			}

		}

	}
}