// Import
const { priceLayout, calcSupplyShare, getGood, getSupply, getCapital, numLayout, checkBiggestShare, layoutMsg, calcIncome, getPosByCapital, checkBankLimit, fineIncome, calcWagonIncome, calcRailsIncome, calcCost, calcTrains } = require("./otherFunctions")

// Export
module.exports = { getMarketInfo, about, buy, start, send, back, readme, rename, best, bonus }




// Function to get market information
function getMarketInfo(market) {

    let reply = ``

    for (good of market.goods) {
        reply += `<code>🚂${good.trains.supplies}/${good.trains.needed} - ${priceLayout(good.cost.current)} - </code>${good.name}\n`
    } 

    // Info about date
    let date = new Date()

    reply += `\n🏙Kyiv pop: ${numLayout(market.population)} (${date.getDate()} day)`

    return layoutMsg(reply, "market")

}

// Function to send a train on supply
function send(text, player, market) {

    let reply = `<a href="tg://user?id=${player.id}">${player.name}</a>`

    // Checking if player has free trains to send
    if (player.trains.free === 0) {
        return `${reply}, you don't have any free trains, all of them are busy with supplies`
    } 

    // Working with text. Checking if command request is correst
    let items = text.split(" ")

    if (![2, 3].includes(items.length) || !getGood(items[1], market) || (items.length === 3 && ((!parseInt(items[2]) || parseInt(items[2]) < 0) && items[2] != "all"))) {
        return `${reply}, incorrect command request\nTry: <code>/send fur 1</code> or <code>/send coa</code>\n*Good code is first 3 characters of its name: <b>fur</b><s>niture</s>, <b>oil</b>`
    }

    // Getting data from text
    let good = getGood(items[1], market)
    let trains = 0

    if (items.length === 2 || items[2] === "all") {
        trains = player.trains.free
    } else {
        trains = parseInt(items[2])
    }

    // If player input consists more trains than player has, then reduce the value
    if (player.trains.free < trains) {
        trains = player.trains.free
    }

    // Operating sending
    good.trains.supplies += trains

    player.trains.free -= trains
    player.trains.busy += trains
    let supply = getSupply(good.code, player)

    if (supply) {

        supply.trains += trains

    } else {

        player.supplies.push({
            name: `${good.name}`,
            code: `${good.code}`,
            trains: trains
        })

    }

    return `${reply} has sent <b>${trains}</b> trains to supply <b>${good.name}</b>`

}

// Function to get trains back to depot
function back(text, player, market) {

    let reply = `<a href="tg://user?id=${player.id}">${player.name}</a>`

    // Checking if player has free trains to send
    if (player.trains.busy === 0) {
        return `${reply}, all your trains are at depot already`
    } 

    // Working with text. Checking if command request is correst
    let items = text.split(" ")

    if (![2, 3].includes(items.length) || (!getGood(items[1], market) && items[1] != "all") || (items.length === 3 && ((!parseInt(items[2]) || parseInt(items[2]) < 0) && items[2] != "all"))) {
        return `${reply}, incorrect command request\nTry: <code>/back all</code> or <code>/back coa</code>\n*Good code is first 3 characters of its name: <b>fur</b><s>niture</s>, <b>oil</b>`
    }

    // Getting data from text
    let good = items[1] === "all" ? null : getGood(items[1], market)
    let supply = items[1] === "all" ? null : getSupply(good.code, player)
    let trains = 0

    if (good && !supply) {
        return `${reply}, you have no trains on <b>${good.name}</b>`
    }

    if (items[1] === "all") {
        trains = player.trains.busy
    } else if (items.length === 2 || items[2] === "all") {
        trains = supply.trains
    } else {
        trains = parseInt(items[2])
    }

    // If player input consists more trains than player has, then reduce the value
    if (supply && supply.trains < trains) {
        trains = supply.trains
    }

    // Operating getting back
    if (good) {
        
        good.trains.supplies -= trains

    } else {
        
        for (supplyItem of player.supplies) {
            good = getGood(supplyItem.code, market)
            good.trains.supplies -= supplyItem.trains
        }

    }

    player.trains.free += trains
    player.trains.busy -= trains


    if (supply) {

        supply.trains -= trains

        if (supply.trains === 0) {
            player.supplies.splice(player.supplies.indexOf(supply), 1)
        }

    } else {

        player.supplies = []

    }

    return `${reply} has got <b>${trains}</b> trains back to depot`

}

// Function to buy a train
function buy(player, text, econ) {

    let reply = `<a href="tg://user?id=${player.id}">${player.name}</a>`

    // Workin with the text
    let items = text.split(" ")

    if (![1, 2].includes(items.length) || (items.length === 2 && !["train", "bank", "slot", "rail", "rails", "wagon", "wagons", "info"].includes(items[1]))) {
        return `${reply}, incorrect request\nTry: <code>/buy train</code> or <code>/buy bank</code>\n     <code>/buy rails</code> or <code>/buy wagon</code>`
    }

    // Output info about costs 
    if (items.length === 1 || (items.length === 2 && items[1] === "info")) {

        // Calculating train cost and bank slot cost
        let trainCost = calcCost("train", player, econ)
        let bankCost = calcCost("bank", player, econ)
        let railsCost = calcCost("rails", player, econ)
        let wagonCost = calcCost("wagon", player, econ)

        // Checking items bank, rails and wagon for max levels
        let bankInfo = bankCost ? `<b>${priceLayout(bankCost)}</b> - <code>/buy bank</code>` : `max level`
        let railsInfo = railsCost ? `<b>${priceLayout(railsCost)}</b> - <code>/buy rails</code>` : `max level`
        let wagonInfo = wagonCost ? `<b>${priceLayout(wagonCost)}</b> - <code>/buy wagon</code>` : `max level`

        return `${reply} costs for new\n🚂Train: <b>${priceLayout(trainCost)}</b> - <code>/buy train</code>\n🏦Bank slot: ${bankInfo}\n🏭Rails fac: ${railsInfo}\n🏭Wagon fac: ${wagonInfo}`

    }


    // Getting what to buy
    let param = items[1]

    // Operating purchase
    if (param === "train") {

        // Calculating train cost
        let trainCost = calcCost("train", player, econ)

        // If player doesn't have enough money
        if (player.finance < trainCost) {
            return `${reply}, you cannot buy a new train, because its price is ${priceLayout(trainCost)} and your finances are ${priceLayout(player.finance)}`
        }

        // Operate the purchase
        player.finance -= trainCost
        player.trains.free++

        return `${reply} has bougth a new 🚂train for ${priceLayout(trainCost)}`

    } else if (["bank", "slot"].includes(param)) {

        // Calculating bank slot cost
        let bankCost = calcCost("bank", player, econ)

        if (!bankCost) {
            return `${reply}, your 🏦bank has maximum level`
        }

        // If player doesn't have enough money
        if (player.finance < bankCost) {
            return `${reply}, you cannot buy a new bank slot, because its price is ${priceLayout(bankCost)} and your finances are ${priceLayout(player.finance)}`
        }

        // Operate the purchase
        player.finance -= bankCost
        player.bank += econ.bankRise

        return `${reply} has bougth a new 🏦bank slot for ${priceLayout(bankCost)}\n🏦Bank: ${priceLayout(player.bank)}`

    } else if (["rails", "rail"].includes(param)) {

        // Calculating rail factory cost
        let railsCost = calcCost("rails", player, econ)

        if (!railsCost) {
            return `${reply}, your 🏭rails factory has <b>maximum level</b>`
        }

        // If player doesn't have enough money
        if (player.finance < railsCost) {
            return `${reply}, you cannot pump your 🏭rails factory, because its improvement price is ${priceLayout(railsCost)} and your finances are ${priceLayout(player.finance)}`
        }

        // Operate the purchase
        player.finance -= railsCost
        player.rails.level++

        return `${reply} has pumped 🏭rails factory for ${priceLayout(railsCost)}`

    } else if (["wagon", "wagons"].includes(param)) {

        // Calculating rail factory cost
        let wagonCost = calcCost("wagon", player, econ)

        if (!wagonCost) {
            return `${reply}, your 🏭wagon factory has <b>maximum level</b>`
        }

        // If player doesn't have enough money
        if (player.finance < wagonCost) {
            return `${reply}, you cannot pump your 🏭wagon factory, because its improvement price is ${priceLayout(wagonCost)} and your finances are ${priceLayout(player.finance)}`
        }

        // Operate the purchase
        player.finance -= wagonCost
        player.wagon.level++

        return `${reply} has pumped 🏭wagon factory for ${priceLayout(wagonCost)}`

    } 
    
}

// Function which returns player info in string format for output
function about(player, market, players, econ) {

    // Variable to sum income from all trains 
    let income = 0

    // Getting info about player trains and general income
    let suppliesInfo = ``

    for (supply of player.supplies) {

        // Getting appropriate good from market with its last cost and other data
        let good = getGood(supply.code, market)

        // Checking if player has biggest share of the good supply
        let hasBiggestShare = checkBiggestShare(good, supply.trains, players)
        
        // Calculating train income from this good
        let trainIncome = good.cost.current * supply.trains * (hasBiggestShare ? 1.25 : 1)

        // Writing down the info about train
        suppliesInfo += `🚂${supply.trains} - ${priceLayout(trainIncome)} - ${hasBiggestShare ? `⚜️` : ``}${calcSupplyShare(good, supply.trains)}% - ${supply.name}\n`

        // Increasing general income with this train income
        income += trainIncome

    }

    // Getting income info
    let outBankLimit = checkBankLimit(player, income)

    let incomeInfo = `Income: ${outBankLimit ? `<b>${priceLayout(fineIncome(income))}</b> (decreased)` : `<b>${priceLayout(income)}</b>`}`

    // Sending player info back
    return `<a href="tg://user?id=${player.id}">${player.name}</a> - <b>${getPosByCapital(player, players, econ)}</b> Forbes\nTrains: <b>${player.trains.free}/${calcTrains(player)}</b>\nFinance: <b>${priceLayout(player.finance)} / ${priceLayout(player.bank)}</b>\nRail&Wagon: <b>${priceLayout(calcRailsIncome(player, econ))}</b> & <b>${priceLayout(calcWagonIncome(player, econ))}</b>\n${incomeInfo}\n\n${suppliesInfo}`

}

// Function to calculate bonus
function bonus(player, econ) {

    let reply = `<a href="tg://user?id=${player.id}">${player.name}</a>`

    // Checking if player has already played
    if (player.rails.bonus && player.wagon.bonus) {
        return `${reply}, you have already got bonuses from factories`
    } 

    // Calculating income
    let railsIncome = calcRailsIncome(player, econ)
    let wagonIncome = calcWagonIncome(player, econ)

    // Checking for bank limit
    railsIncome = checkBankLimit(player, railsIncome) ? fineIncome(railsIncome) : railsIncome
    wagonIncome = checkBankLimit(player, wagonIncome) ? fineIncome(wagonIncome) : wagonIncome

    // Operating income
    if (!player.rails.bonus && !player.wagon.bonus) {
        
        player.finance += railsIncome + wagonIncome
        player.rails.bonus = true
        player.wagon.bonus = true

        return `${reply}, you have got\n<b>${priceLayout(railsIncome)}</b> from rails prod.\n<b>${priceLayout(wagonIncome)}</b> from wagons prod.`

    } else if (!player.rails.bonus && player.wagon.bonus) {

        player.finance += railsIncome
        player.rails.bonus = true

        return `${reply}, you have got\n<b>${priceLayout(railsIncome)}</b> from rails prod.`

    } else if (player.rails.bonus && !player.wagon.bonus) {

        player.finance += wagonIncome
        player.wagon.bonus = true

        return `${reply}, you have got\n<b>${priceLayout(wagonIncome)}</b> from wagons prod.`

    }

}

// Function to get top players
function best(players, market, econ, text) {

    // Working with text. Spliiting it
    let items = text.split(" ")

    // Variable of reply text
    let reply = ``

    // If items.length is 1, then bot outputs goods and players who has biggest share with its supplies
    // If there is "cap", then output the top players by biggest capital
    // If threr is "inc", then output the top players by income
    // If there is good.code, then output its top suppliers
    // Otherwise output the "incorrect request" message  
    if (items.length === 1) {

        for (good of market.goods) {

            let playersCopy = []
    
            // Calculating supply share of the good of all players and 
            // Pushing only those who has this supply
            for (player of players) {
    
                let supply = getSupply(good.code, player) 
                if (supply) {
                    playersCopy.push({name: player.name, share: calcSupplyShare(good, supply.trains)})
                }
    
            }
    
            // Checking if there is at least one who supplies this good
            // If none, then white 'none supplies'
            if (playersCopy.length != 0) {
    
                // Sorting players by share
                playersCopy.sort(function (a, b) {
                    if (a.share > b.share) {
                        return -1
                    }
                    if (a.share < b.share) {
                        return 1
                    }
                    return 0
                })
    
                reply += `<code>${good.code} ${playersCopy[0].share}% - </code>${playersCopy[0].name}\n`
    
            } else {
    
                reply += `<code>${good.code} - </code>none supplies\n`
    
            }
    
        } 

        reply = layoutMsg(reply, "best")

    } else if (items.length === 2 && items[1] === "cap") {
        
        let playersCopy = []

        // Calculating capital of each player
        for (player of players) {
            playersCopy.push({name: player.name, capital: getCapital(player, econ)})
        }

        // Sorting players by capital
        playersCopy.sort(function (a, b) {
            if (a.capital > b.capital) {
                return -1
            }
            if (a.capital < b.capital) {
                return 1
            }
            return 0
        })

        // Writing info down
        for (let i = 0; i < 10; i++) {
            if (playersCopy[i]) {
                let player = playersCopy[i]
                reply += `<code>${priceLayout(player.capital)} - </code>${player.name}\n`
            }
        }

        reply = layoutMsg(reply, "bestCap")

    } else if (items.length === 2 && items[1] === "inc") {
        
        let playersCopy = []

        // Calculating income of each player
        for (let player of players) {
            playersCopy.push({name: player.name, income: calcIncome(player, market, players)})
        }

        // Sorting players by income
        playersCopy.sort(function (a, b) {
            if (a.income > b.income) {
                return -1
            }
            if (a.income < b.income) {
                return 1
            }
            return 0
        })

        // Writing info down
        for (let i = 0; i < 10; i++) {
            if (playersCopy[i]) {
                let player = playersCopy[i]
                reply += `<code>${priceLayout(player.income)} - </code>${player.name}\n`
            }
        }

        reply = layoutMsg(reply, "bestInc")

    } else if (items.length === 2 && getGood(items[1], market)) {
        
        let good = getGood(items[1], market)

        let playersCopy = []

        // Getting players who supplies the good
        for (player of players) {
            let supply = getSupply(good.code, player)
            if (supply) {
                playersCopy.push({name: player.name, share: calcSupplyShare(good, supply.trains), trains: supply.trains})
            }
        }

        // Checking if there are suppliers at all
        if (playersCopy.length != 0) {

            // Sorting players by share
            playersCopy.sort(function (a, b) {
                if (a.share > b.share) {
                    return -1
                }
                if (a.share < b.share) {
                    return 1
                }
                return 0
            })

            // Writing info down
            reply += `Top <b>${good.name}</b> suppliers\n\n`

            for (let i = 0; i < 8; i++) {
                if (playersCopy[i]) {
                    let player = playersCopy[i]
                    reply += `<code>🚂${player.trains}</code> - <code>${player.share}%</code> - ${player.name}\n`
                }
            }

            reply = layoutMsg(reply, "bestCode")

        } else {

            reply += `None supplies <b>${good.name}</b>`

        }

    } else {

        return `Incorrect request of /best command`

    }

    return `${reply}`

}

// Function to rename player
function rename(player, text) {

    // Declaring limits of max and min chars in the name
    let max = 24
    let min = 1

    // Working with the text
    let items = text.split(" ")
    items.shift()
    let newName = items.join(" ")

    // Checking for limits
    if (newName.length > max) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, max characters: <b>${max}</b>`
    } else if (newName.length < min) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, min characters: <b>${min}</b>`
    } else if (newName.includes("\n")) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, using new line is forbidden`
    }

    // Changing name
    player.name = newName

    return `<a href="tg://user?id=${player.id}">${player.name}</a>, your name has been changed successfully`

}

// Functions of readme and start
function readme() {
    return `<a href="https://telegra.ph/railtrans-02-09">Gameplay & Update news</a>`
}
function start() {
    return `This is Rail Transport Game, which allows you to transport different goods and compete with other players. Supply the city with appropriate goods and build the greatest railway empire!\n\n/market - check city needs\n/about - your player profile\n/readme - about gameplay`
}