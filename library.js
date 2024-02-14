export async function getServers(ns) {
    await ns.tprint("GetServers called");
    var NewServers = new Array();
    var SeenServers = new Array();
    NewServers.push("home");
    await ns.tprint("NewServers array length : "+NewServers.length);
    await ns.tprint("test");
    while (NewServers.length >0 ) {
        let s1 = NewServers.pop();
        await ns.tprint("checking: "+s1);
        if (!SeenServers.includes(s1)) {
            await ns.tprint(s1+" has not been seen already");
            let connections = await ns.scan(s1);
            let i = 0;
            while (i < connections.length) {
                let newServer = connections[i];
                await ns.tprint("Adding: "+newServer);
                NewServers.push(newServer);
                i++;
            }
            SeenServers.push(s1);
        } else {
            await ns.tprint(s1+" has already been checked");
        }
    }
    await ns.tprint("seen servers: "+SeenServers.length);
}