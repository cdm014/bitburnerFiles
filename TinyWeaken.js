export async function main(ns) {
  var target = ns.args[0];
  while(true)
  {
    await ns.weaken(target);
  }
}