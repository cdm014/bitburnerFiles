# ideas
## resource management
The two main costs are time and amount of ram needed this means costs can be expressed as RAM seconds
* hack cost (0.1 gb) * sec
* grow cost (0.15 gb) * sec
* weaken cost ( 0.15 gb) * sec

* hack = 2/5 of weaken
* grow = 4/5 of weaken

* hack = ((0.10 gb) x hackseconds) + ((2/5) x (0.15) x weakenseconds) = ((.10) x hackSeconds) + ((0.06) x weakenSeconds)
* grow = ((0.15 gb) x growseconds) + ((4/5) x (0.15) x weakenseconds) = ((.15) x growSeconds) + ((.12) x weakenSeconds)

* needed multiplier = (100 / (100 - hackanalyzepercent)) <- this is wrong but the closest easy value
* growNumber = growthAnalyze(server, multiplier)  

Using this the total cost to hack a server for 1 thread and return it to it's previous state is roughly:

* hackCost =  (0.1 x hackseconds) + (0.06 x weakenseconds) + (growNumber x (0.15 x growseconds) + (.12 x weakenseconds) )
* reward = (hackSuccess * hackReceive)

* score = reward / hackCost 
## batching




# notes
- scoring is a ram expensive function but it's probably not necessary on all servers or to be run very often
- identify best candidates for hacking via scoring
- identify best candidates for minimizing security by maxmoney / (minSecurity * weakenNumber)
- identify best candidates for growing by maxMoney / (currentSecurity * growNumber)

