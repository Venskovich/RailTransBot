// Import
const { priceLayout, calcSupplyShare, getGood, getSupply, numLayout } = require("./otherFunctions")

// Export
module.exports = { getMarketInfo, about, train, give, start, send, back, readme, rename, best, bonus }




// Function to get market information
function getMarketInfo(market) {

    let reply = `<code>`

    for (good of market.goods) {
        reply += `🚂${good.trains.supplies}/${good.trains.needed} - ${priceLayout(good.cost.current)} - ${good.name}\n`
    } 

    reply += `\n🏙Kyiv pop: ${numLayout(market.population)}</code>`

    return reply

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
        return `${reply}, incorrect command request`
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
        return `${reply}, incorrect command request`
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
function train(player, econ) {

    let reply = `<a href="tg://user?id=${player.id}">${player.name}</a>`
    
    // If player doesn't have enough money
    if (player.finance < econ.trainCost) {
        return `${reply}, you cannot buy a new train, because its default price is ${priceLayout(econ.trainCost)} and your finances are ${priceLayout(player.finance)}`
    }

    // Operate the purchase
    player.finance -= econ.trainCost
    player.trains.free++

    return `${reply} has bougth a new 🚂train`

}

// Function which returns player info in string format for output
function about(player, market) {

    // Variable to sum income from all trains 
    let income = 0

    // Getting info about player trains and general income
    let suppliesInfo = ``

    for (supply of player.supplies) {

        // Getting appropriate good from market with its last cost and other data
        let good = getGood(supply.code, market)

        // Calculating train income from this good
        let trainIncome = good.cost.current * supply.trains

        // Writing down the info about train
        suppliesInfo += `🚂<b>${supply.trains}</b> - ${priceLayout(trainIncome)} - ${calcSupplyShare(good, supply.trains)}% - ${supply.name}\n`

        // Increasing general income with this train income
        income += trainIncome

    }

    // Sending player info back
    return `<a href="tg://user?id=${player.id}">${player.name}</a>\nTrains: <b>${player.trains.free}/${player.trains.busy + player.trains.free}</b>\nFinance: <b>${priceLayout(player.finance)}</b>\nIncome: <b>${priceLayout(income)}</b>\n\n${suppliesInfo}`

}

// Function to calculate bonus
function bonus(player, econ) {

    let reply = `<a href="tg://user?id=${player.id}">${player.name}</a>`

    if (player.bonus) {
        return `${reply}, you have already got bonus this hour`
    } 

    player.finance += econ.bonus
    player.bonus = true

    return `${reply}, you have got ${priceLayout(econ.bonus)}`

}

// Function to get top players
function best(players, market, econ, text) {

    // Working with text. Spliiting it
    let items = text.split(" ")

    // Variable of reply text
    let reply = `<code>`

    // If items.length is 1, then bot outputs goods and players who has biggest share with its supplies
    // If there is "cap", then output the top 10 players by biggest capital
    // If there is good.code, then output its top 10 suppliers
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
    
                reply += `${good.code} ${playersCopy[0].share}% - ${playersCopy[0].name}\n`
    
            } else {
    
                reply += `${good.code} - none supplies\n`
    
            }
    
        } 

    } else if (items.length === 2 && items[1] === "cap") {
        
        let playersCopy = []

        // Calculating capital of each player
        for (player of players) {
            playersCopy.push({name: player.name, capital: econ.trainCost * (player.trains.free + player.trains.busy) + player.finance})
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
                reply += `${priceLayout(player.capital)} - ${player.name}\n`
            }
        }


    } else if (items.length === 2 && getGood(items[1], market)) {
        
        let good = getGood(items[1], market)

        let playersCopy = []

        // Getting players who supplies the good
        for (player of players) {
            let supply = getSupply(good.code, player)
            if (supply) {
                playersCopy.push({name: player.name, share: calcSupplyShare(good, supply.trains)})
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
            reply += `Top ${good.name} suppliers\n\n`

            for (let i = 0; i < 8; i++) {
                if (playersCopy[i]) {
                    let player = playersCopy[i]
                    reply += `${player.share}% - ${player.name}\n`
                }
            }

        } else {

            reply += `None supplies ${good.name}`

        }

    } else {

        return `Incorrect request of /best command`

    }

    return `${reply}</code>`

}

// Function to support one player by another one with finance
function give(giver, recipient, text) {

    let param = null

    // Working with text and checking if the request is correct
    if (/\/give(@war121bot)? +\d{0,3}%/.test(text)) {
        param = (parseInt(/\d+/.exec(text)[0]) / 100) * giver.finance
    } else if (/\/give(@war121bot)? +\d+k|к/.test(text)) {
        param = parseInt(/\d+/.exec(text)[0]) * 1000
    } else if (/\/give(@war121bot)? +\d+/.test(text)) {
        param = parseInt(/\d+/.exec(text)[0])
    } else if (text === "/give all" || text === "/give@war121bot all") {
        param = giver.finance
    } else {
        return `<a href="tg://user?id=${giver.id}">${giver.name}</a>, incorrect request. Correct request example:\n<code>/give 1000</code> || <code>/give all</code>`
    }

    // Some exclusions 
    if (param > giver.finance && giver.finance >= 1) {
        return `<a href="tg://user?id=${giver.id}">${giver.name}</a>, wow, you are so generous! The problem is you don't have ${priceLayout(param)}. Your budget is ${priceLayout(giver.finance)} only`
    } else if (giver.finance < 1) {
        return `<a href="tg://user?id=${giver.id}">${giver.name}</a>, well, this is good deed, buy you don't have any money`
    }

    // If everything is okay, then calculate transaction
    giver.finance -= param
    recipient.finance += param

    return `<a href="tg://user?id=${giver.id}">${giver.name}</a>, you've supported <a href="tg://user?id=${recipient.id}">${recipient.name}</a> with ${priceLayout(param)}`

}

// Function to rename player
function rename(player, text) {

    // Declaring limits of max and min chars in the name
    let max = 28
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
    return `This is Rail Transport Game, which allows you to transport different goods and compete with other chat members. Supply the city with appropriate goods, buy new trains and build the greatest railway empire!\n\n*The game is created only for @nause121 chat`
}