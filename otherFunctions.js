// Import
const fs = require("fs")

// Export
module.exports = { sendMessage, deleteMessage, savePlayers, saveStats, saveMarket, saveEcon, getName, priceLayout, calcSupplyShare, getSupply, getGood, getCapital, isRequest, updateMarket, checkSupply, cityGrow, numLayout, delayToNextHour, updateNeeds, checkBiggestShare, layoutMsg, calcSupplyIncome, calcIncome, getPosByCapital, checkBankLimit, fineIncome, calcRailsIncome, calcWagonIncome, calcCost, calcTrains, delayToFourthHour, delayToMidnight }




// Function to update market prices
function updateMarket(market, econ) {

    for (good of market.goods) {

        let trainRatio = good.trains.supplies / good.trains.needed
        
        good.cost.current = Math.floor(good.cost.max / (1 + trainRatio))

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

    market.population += 5000

}

// Function to calculate how much share of supply is on appropriate player
function calcSupplyShare(good, playerTrains) {

    return Math.floor((playerTrains / good.trains.supplies) * 100)

}

// Function to check if the player has biggest share of appropriate supply
function checkBiggestShare(good, playerTrains, players) {

    let trainsSupply = []

    // Getting players who supplies the good
    for (let player of players) {
        let supply = getSupply(good.code, player)
        if (supply) {
            trainsSupply.push(supply.trains)
        }
    }

    // If there is only one player, this means the player is the only supplier of the good
    if (trainsSupply.length === 1) {
        return true
    } 

    // Sorting players by share
    trainsSupply.sort(function(a, b) {
        return b - a
    })
      
    // If playerTrains doesn't equal to the first element, then false
    if (playerTrains != trainsSupply[0]) {
        return false
    }

    return playerTrains != trainsSupply[1]

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

    for (let supply of player.supplies) {
        if (code === supply.code) {
            return supply
        }
    }

    return false

}

// FUnction to calculate income from one supply
function calcSupplyIncome(supply, good, players) {
    return supply.trains * good.cost.current * (checkBiggestShare(good, supply.trains, players) ? 1.25 : 1)
}

// Function to calculate player income
function calcIncome(player, market, players) {
    
    let income = 0
    
    for (let supply of player.supplies) {
        income += calcSupplyIncome(supply, getGood(supply.code, market), players)
    }
    
    return checkBankLimit(player, income) ? fineIncome(income) : income

}

// Function to check if player has finances outside bank limit
function checkBankLimit(player, income) {
    return (player.finance + income) > player.bank 
}

// Function to fine income if player finances are outside bank limit
function fineIncome(income) {
    return income / 3
}

// Function to calculate income from factories
function calcWagonIncome(player, econ) {
    return player.wagon.level * econ.wagonIncome
}
function calcRailsIncome(player, econ) {
    return player.rails.level * econ.railsIncome
}

// Function to calculate costs of new items
function calcCost(type, player, econ) {

    if (type === "train") {
        return econ.trainInCost + calcTrains(player) * econ.trainCostStep 
    } else if (type === "bank") {
        return player.bank != econ.bankMax ? Math.floor(econ.bankCostStep * ((player.bank - econ.bankMin) / econ.bankRise)) : false
    } else if (type === "rails") {
        return player.rails.level != econ.railsMax ? (20 * econ.railsIncome * player.rails.level) : false
    } else if (type === "wagon") {
        return player.wagon.level != econ.wagonMax ? (6 * econ.wagonIncome * player.wagon.level) : false
    }

}

// Function to calculate amount of trains, player has 
function calcTrains(player) {
    return player.trains.free + player.trains.busy
}

// Function to calculate player capital
function getCapital(player, econ) {

    let trains = calcTrains(player) - 4
    let trainCap = 4 * econ.trainInCost + (((econ.trainInCost - econ.trainCostStep) + calcCost("train", player, econ)) / 2) * trains

    let railsCap = ((20 * econ.railsIncome + 20 * econ.railsIncome * (player.rails.level - 1)) / 2) * player.rails.level

    let wagonCap = ((6 * econ.wagonIncome + 6 * econ.wagonIncome * (player.wagon.level - 1)) / 2) * player.wagon.level

    return trainCap + railsCap + wagonCap + player.finance

}

// Function to get player position by capital
function getPosByCapital(player, players, econ) {

    // Array to store players and their capital
    let playersCopy = []

    // Calculating capital of each player
    for (let player of players) {
        playersCopy.push({id: player.id, capital: getCapital(player, econ)})
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

    // Getting position
    for (let i = 0; i < playersCopy.length; i++) {
        if (playersCopy[i].id === player.id) {
            return i + 1
        }
    }

}
 
// Function to layout messages
function layoutMsg(text, type) {

    // Splitting text into lines
    let lines = text.split("\n")

    // Deleting those lines from the end, which are empty
    for (let i = lines.length - 1; i >= 0; i--) {

        if (lines[i] === "") {
            lines.pop()
        } else {
            break
        }

    } 

    // An array to operate with later
    let msg = []

    // Layouting different messages
    if (type === "market") {

        let maxSupplyLen = 0
        let maxNeededLen = 0
        let maxCostLen = 0

        // Pushing info about every line
        for (let i = 0; i < 8; i++) {

            // Creating object, which has string value of the line && length of numbers
            let line = {
                text: lines[i],
                supply: /[0-9]+\//.exec(lines[i])[0],
                needed: /\/[0-9]+/.exec(lines[i])[0],
                cost: /\$[0-9]+/.exec(lines[i])[0]
            }

            // Pushing to the array
            msg.push(line)


            // Writing max length
            if (maxSupplyLen < line.supply.length) {
                maxSupplyLen = line.supply.length
            }
            if (maxNeededLen < line.needed.length) {
                maxNeededLen = line.needed.length
            }
            if (maxCostLen < line.cost.length) {
                maxCostLen = line.cost.length
            }

        }

        // Pushing extra zeros && rewrite text values
        for (let i = 0; i < 8; i++) {
            
            lines[i] = lines[i].replace(/[0-9]+\//, `${calcSpace(maxSupplyLen - msg[i].supply.length)}${msg[i].supply}`)
            lines[i] = lines[i].replace(/\/[0-9]+/, `${msg[i].needed}${calcSpace(maxNeededLen - msg[i].needed.length)}`)
            lines[i] = lines[i].replace(/\$[0-9]+/, `${calcSpace(maxCostLen - msg[i].cost.length)}${msg[i].cost}`)

        }
        
    } else if (type === "best") {

        let maxShareLen = 0

        // Pushing info about every line
        for (let i = 0; i < 8; i++) {

            // Creating object, which has string value of the line && length of numbers
            let line = {
                text: lines[i],
                share: /[0-9]+\%/.exec(lines[i])[0]
            }

            // Pushing to the array
            msg.push(line)


            // Writing max length
            if (line.share && maxShareLen < line.share.length) {
                maxShareLen = line.share.length
            }

        }       

        // Pushing extra zeros && rewrite text values
        for (let i = 0; i < 8; i++) {
    
            if (msg[i].share) {
                lines[i] = lines[i].replace(/[0-9]+\%/, `${calcSpace(maxShareLen - msg[i].share.length)}${msg[i].share}`) 
            }

        }

    } else if (type === "bestCap" || type === "bestInc") {

        let maxCapitalLen = 0

        // Pushing info about every line
        for (let i = 0; i < lines.length; i++) {

            // Creating object, which has string value of the line && length of numbers
            let line = {
                text: lines[i],
                capital: /\$[0-9,]+/.exec(lines[i])[0]
            }

            // Pushing to the array
            msg.push(line)


            // Writing max length
            if (maxCapitalLen < line.capital.length) {
                maxCapitalLen = line.capital.length
            }

        }       

        // Pushing extra zeros && rewrite text values
        for (let i = 0; i < lines.length; i++) {
    
            lines[i] = lines[i].replace(/\$[0-9,]+/, `${calcSpace(maxCapitalLen - msg[i].capital.length)}${msg[i].capital}`) 

        }


    } else if (type === "bestCode") {

        let maxTrainsLen = 0
        let maxShareLen = 0

        // Pushing info about every line
        for (let i = 2; i < lines.length; i++) {

            // Creating object, which has string value of the line && length of numbers
            let line = {
                text: lines[i],
                trains: /[0-9]+/.exec(/🚂[0-9]+/.exec(lines[i])[0])[0],
                share: /[0-9]+\%/.exec(lines[i])[0]
            }

            // Pushing to the array
            msg.push(line)


            // Writing max length
            if (maxTrainsLen < line.trains.length) {
                maxTrainsLen = line.trains.length
            }
            if (maxShareLen < line.share.length) {
                maxShareLen = line.share.length
            }

        }

        // Pushing extra zeros && rewrite text values
        for (let i = 2; i < lines.length; i++) {
            
            lines[i] = lines[i].replace(/🚂[0-9]+/, `🚂${calcSpace(maxTrainsLen - msg[i-2].trains.length)}${msg[i-2].trains}`)
            lines[i] = lines[i].replace(/[0-9]+\%/, `${calcSpace(maxShareLen - msg[i-2].share.length)}${msg[i-2].share}`) 

        }


    }

    return lines.join("\n")

}

// Function to calculate space
function calcSpace(num) {
    let space = ""
    for (let i = 0; i<num; i++) {
        space += " "
    }
    return space
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

// Function to calculate delays in ms
function delayToNextHour() {

    let thisHour = new Date()
    let nextHour = new Date()

    nextHour.setHours(thisHour.getHours() + 1, 0, 0, 0)

    return nextHour.getTime() - thisHour.getTime()
    
}
function delayToFourthHour() {

    let thisTime = new Date()
    let nextTime = new Date()

    let hours = 4 - thisTime.getHours() % 4
    nextTime.setHours(thisTime.getHours() + hours, 0, 0, 0)

    return nextTime.getTime() - thisTime.getTime()

}
function delayToMidnight() {
    
    let thisTime = new Date()
    let nextTime = new Date()

    nextTime.setHours(0, 0, 0, 0)
    nextTime.setDate(thisTime.getDate() + 1)

    return nextTime.getTime() - thisTime.getTime()

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