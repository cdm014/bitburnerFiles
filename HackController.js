/***
NAME: HackController.js
PARAMETERS: Target
DESCRIPTION: Uses Bot network to try to extract maximum value from Target
***/

export async function main(ns) {
	var server = ns.args[0];
    var connections = await ns.scan();
    var newAction = "new";
    var currentAction = "current";
	
	var hasRootAccess = await ns.hasRootAccess(server);

	if (hasRootAccess) {
		await ns.tprint("I have root access");
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
        await ns.tprint("money thresh: "+MoneyThresh);
        await ns.tprint("SecThresh: "+ SecThresh);
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
            
            await ns.tprint("Grow: "+growingFlag);
            await ns.tprint("Weaken:"+weakeningFlag);
            if (weakeningFlag) {
                
                newAction = "weaken";

            } else if (growingFlag) {
                
                newAction = "grow"
            } else {
                
                newAction = "hack"
            }
            await ns.tprint("action: "+newAction);
            if (newAction != currentAction) {
                await ns.tprint ("changing actions");
                currentAction = newAction;
                for (var i = 0; i < connections.length;i++) {
                    var host = connections[i];
                    await spread(host, server, newAction, ns);
                    		
                }
            }
            await ns.sleep(1500);

		}

    } else {
        await ns.tprint("I do not have root access");
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



