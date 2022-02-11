// Import
const fs = require("fs")

// Export
module.exports = { sendMessage, deleteMessage, saveBanlist, savePlayers, saveStats, saveMarket, saveEcon, getName, priceLayout, calcSupplyShare, getSupply, getGood, isRequest, updateMarket, checkSupply, cityGrow, numLayout, delayToNextHour, updateNeeds }




// Function to update market prices
function updateMarket(market, econ) {

    for (good of market.goods) {

        let trainRatio = good.trains.supplies / good.trains.needed
        let costRange = good.cost.max - good.cost.min
        
        good.cost.current = Math.floor(good.cost.min + (trainRatio > econ.fullSupply ? 0 : costRange - (costRange / econ.fullSupply) * trainRatio))

    }

}

// Function to update market needs
function updateNeeds(market, econ) {

    let needsRange = []

    // Copying values from econ
    for (needsValue of econ.needsRange) {
        needsRange.push(needsValue)
    }

    // Getting max and min value
    let maxNeeds = getMaxOfArray(needsRange)
    let minNeeds = getMinOfArray(needsRange)

    if (maxNeeds === minNeeds) {
        maxNeeds++
    }


    // Updating market needs
    for (good of market.goods) {

        // Updating number of needs
        let index = Math.floor(Math.random() * needsRange.length)
        good.trains.needed = needsRange[index]
        needsRange.splice(index, 1)

        // Updating max cost
        good.cost.max = econ.goodCost.maxmax - ((econ.goodCost.maxmax - econ.goodCost.maxmin) / (maxNeeds - minNeeds)) * (good.trains.needed - minNeeds)

    }

}

// Function to check if all goods are supllied to make city grow
function checkSupply(market) {

    for (good of market.goods) {
        if (good.trains.needed > good.trains.supplies) {
            return false
        }
    }

    return true

}

// Function to grow the city and increase its supplies needs
function cityGrow(market, econ) {

    let index = Math.floor(Math.random() * econ.needsRange.length)

    econ.needsRange[index]++

    market.population += 10000

}

// Function to calculate how much share of supply is on appropriate player
function calcSupplyShare(good, playerTrains) {

    return Math.floor((playerTrains / good.trains.supplies) * 100)

}

// Function to get appropriate good of market.goods by specific code
function getGood(code, market) {

    for (good of market.goods) {
        if (code === good.code) {
            return good
        }
    }

    return false

}

// Function to get appropriate supply of a player
function getSupply(code, player) {

    for (supply of player.supplies) {
        if (code === supply.code) {
            return supply
        }
    }

    return false

}

// Function which checks whether text contains bot commands
function isRequest(allCommands, text) {
    
    for (command of allCommands) {
        if (text.includes(command)) {
            return true
        }
    }

    return false

}

// Function to layout price output, so 1000 will output as $1,000
function priceLayout(price) {

    return `$${numLayout(price)}`

}

// Function to layout num output, so 1000 will output as 1,000
function numLayout(num) {

    // Some operations with num to make it array by string symbols
    num = Math.floor(num)
    num = num.toString()
    num = num.split("")

    // The layouted num first will be written as symbols array and secondly as string to output
    let newNumArray = []
    let newNumString = ""

    // Creating layouted num with comas as symbols array
    for (let i = 0; i < num.length; i++) {
        if (i % 3 == 0 && i != 0) {
            newNumArray.unshift(",")
        }
        newNumArray.unshift(num[num.length - 1 - i])
    }

    // Converting symbol array of layouted num to simple string
    for (symbol of newNumArray) {
        newNumString += symbol
    }

    // Returning layouted num
    return `${newNumString}`

}

// Function to get user name
function getName(user) {

    // Checking if first_name and last_name are set by user
    // If user has no name, then his player name is initialized as "Player"
    if (user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`
    } else if (user.first_name) {
        return `${user.first_name}`
    } else if (user.last_name) {
        return `${user.last_name}`
    } else {
        return `Player`
    }

}

// Function to calculate delay to next hour
function delayToNextHour() {

    let thisHour = new Date()
    let nextHour = new Date()

    nextHour.setHours(thisHour.getHours() + 1, 0, 0, 0)

    return nextHour.getTime() - thisHour.getTime()
    
}

// Function to get maximum and minimum value of array
function getMaxOfArray(numArray) {
    return Math.max.apply(null, numArray);
}
function getMinOfArray(numArray) {
    return Math.min.apply(null, numArray);
}

// This function is simplified form of bot.sendMessage()
function sendMessage(bot, chatId, text) {
    bot.sendMessage(chatId, text, { parse_mode: "HTML" })
}

// Function to delete appropriate message
function deleteMessage(bot, chatId, msgId, delay = 1) {

    setTimeout(function () {
        bot.deleteMessage(chatId, msgId)
    }, delay * 1000)

}

// Functions to save data
function saveBanlist(banlist) {
    fs.writeFile("banlist.json", JSON.stringify(banlist), err => {
        if (err) throw err;
    });
}
function saveStats(stats) {
    fs.writeFile("stats.json", JSON.stringify(stats), err => {
        if (err) throw err;
    });
}
function savePlayers(players) {
    fs.writeFile("players.json", JSON.stringify(players), err => {
        if (err) throw err;
    });
}
function saveMarket(market) {
    fs.writeFile("market.json", JSON.stringify(market), err => {
        if (err) throw err;
    });
}
function saveEcon(econ) {
    fs.writeFile("econ.json", JSON.stringify(econ), err => {
        if (err) throw err;
    });
}