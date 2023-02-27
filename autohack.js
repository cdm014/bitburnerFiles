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
	
	var hasRootAccess = await ns.hasRootAccess(server);

	if (hasRootAccess) {
		//if we have root access configure some info so we can know what to do
		var MaxMoney = await ns.getServerMaxMoney(server);
		var MoneyThresh = MaxMoney *.75; //we want a minimum of 75% of the maximum money available
		
		var MinSec = await ns.getServerMinSecurityLevel(server);
		//start weakening if we're at double the minimum security level
		var SecGoal = MinSec ;
		var SecThresh = MinSec * 2;
		var vserver = await ns.getHostname();
		var weakeningFlag = false;
		var growingFlag = false;
		while(true) {
			//main loop
			// goal priorities
			// 1. weaken first so other actions take less time
			// 2. grow money to maximize income
			// 3. hack when other goals are met
			var currentSecurity = await ns.getServerSecurityLevel(server);
			var currentMoney = await ns.getServerMoneyAvailable(server);
			if (currentSecurity > SecThresh) {
				weakeningFlag = true;
			} else if (currentSecurity == MinSec) {
				weakeningFlag = false;
			}
			if (currentMoney < MoneyThresh) {
				growingFlag = true;
			} else if (currentMoney == MaxMoney) {
				growingFlag = false;
			}
			if (weakeningFlag == true) {
				await weaken(server, vserver, ns);
			} else if (growingFlag == true) {
				await grow(server, vserver, ns);
			} else {
				await hack(server, vserver, ns);
			}
		}
	}
}

async function weaken(server, vserver, ns) {
	await ns.tprint(vserver +" weakening " + server);
	await ns.weaken(server);
}
			

async function grow (server, vserver, ns) {
	await ns.tprint(vserver + " growing " +server);
	await ns.grow(server);
}

async function hack (server, vserver, ns) {
	await ns.tprint(vserver + " hacking " + server);
	await ns.hack(server);
}
