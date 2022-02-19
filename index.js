// Setting up bot
const TelegramApi = require("node-telegram-bot-api")
const token = require("./token");
const bot = new TelegramApi(token, { polling: true })

// Getting data from data bases and declaring variables to operate with them
const dev = require("./dev.json")
const specChat = require("./specChat.json")
var econ = require("./econ.json")
var market = require("./market.json")
var players = require("./players.json")
var stats = require("./stats.json")

// Import
const { sendMessage, deleteMessage, savePlayers, saveStats, saveMarket, isRequest, updateMarket, checkSupply, cityGrow, delayToNextHour, numLayout, updateNeeds, saveEcon, calcIncome, delayToFourthHour, delayToMidnight } = require("./otherFunctions")
const { getStats, give } = require("./devFunctions")
const { getPlayer, updateBonus } = require("./playerFunctions") 
const { getMarketInfo, buy, about, send, back, start, readme, rename, best, bonus } = require("./mainFunctions")




// Setting up commands (visible in telegram)
bot.setMyCommands([
    { command: "/market", description: "Market info" },
    { command: "/send", description: "Send trains to supply goods" },
    { command: "/back", description: "Get back trains to depot" },
    { command: "/buy", description: "Buy a train, bank slot, factory equipment etc." },
    { command: "/about", description: "Player info" },
    { command: "/bonus", description: "Get bonus from rails & wagon productions" },
    { command: "/best", description: "Best players" },
    { command: "/readme", description: "Gameplay & Updates news" }
])

// Creating these variables to operate easier
const commands = {
    market: "/market",
    send: "/send",
    back: "/back",
    buy: "/buy",
    about: "/about",
    bonus: "/bonus",
    best: "/best",
    readme: "/readme",

    stats: "/stats@railtransbot",
    give: "/give",

    rename: "/rename",
    start: "/start"
}
const allCommands = [ "/market", "/market@railtransbot", "/send", "/send@railtransbot", "/back", "/back@railtransbot", "/buy", "/buy@railtransbot", "/about", "/about@railtransbot", "/bonus", "/bonus@railtransbot", "/best", "/best@railtransbot", "/readme", "/readme@railtransbot", "/rename", "/rename@railtransbot", "/start", "/start@railtransbot"]
const devCommands = ["/stats@railtransbot", "/give"]



// FUTURE UPDATES
// - new train type
// - special good
// - train sale 
// - tenders && discounts
// - about full
// - new player finances
// - same name restricted
// - winEvent

// TASK TO DO NOW
// - message info improvement




// Main 
bot.on("message", msg => {

    // If group chat is wrong, then leave it
    if (msg.chat.type != "private" && msg.chat.id != specChat.id) {
        bot.leaveChat(msg.chat.id)
        return
    }

    // Creating these variables to make it easier to operate with message
    let text = msg.text.toLowerCase()
    let chatId = msg.chat.id
    let msgId = msg.message_id
    let user = msg.from

    // Declaring player variable. It is initialized if the user calls any bot command
    // Declared to make it easier to operate with player data
    let player = null

    // Variable which contains message reply text
    let reply = ""


    // If a message is not a command request, then ignore it and do not execute the following code
    // The same is if message was sent by bot
    // Otherwise create the new player or initialize it
    if ((!isRequest(allCommands, text) && !(isRequest(devCommands, text) && user.id === dev.id))) {

        return

    } else {

        if (user.is_bot || (msg.reply_to_message && msg.reply_to_message.from.is_bot)) {
            deleteMessage(bot, chatId, msgId)
            return
        }

        player = getPlayer(user, players)
        savePlayers(players)

    }

    // Bot commands
    if (text.includes(commands.market)) {

        reply = getMarketInfo(market)

    } else if (text.includes(commands.send)) {

        reply = send(text, player, market)

        // If every need of the city is supplied, then make city grow
        if (checkSupply(market)) {

            while (checkSupply(market)) {
                cityGrow(market, econ)
                updateNeeds(market, econ)
                updateMarket(market, econ)
            }

            saveEcon(econ)

            sendMessage(bot, chatId, `🏙Kyiv has grown\nPopulation: ${numLayout(market.population)}`)


            // Giving some bonus to that player, whose last action has provoked the growth
            player.finance += econ.bonus

        }

        savePlayers(players)

        updateMarket(market, econ)
        saveMarket(market)

    } else if (text.includes(commands.back)) {

        reply = back(text, player, market)
        savePlayers(players)

        updateMarket(market, econ)
        saveMarket(market)

    } else if (text.includes(commands.buy)) {

        reply = buy(player, text, econ)
        savePlayers(players)

    } else if (text.includes(commands.about)) {

        // If there is replied message, then show the info of a player, whose message is replied
        if (msg.reply_to_message) {
            player = getPlayer(msg.reply_to_message.from, players)
            savePlayers(players)
        }

        reply = about(player, market, players, econ)

    } else if (text.includes(commands.bonus)) {

        reply = bonus(player, econ)
        savePlayers(players)

    } else if (text.includes(commands.best)) {

        reply = best(players, market, econ, text)

    } else if (text.includes(commands.readme)) {

        reply = readme()

    } else if (text.includes(commands.rename)) {

        // The ability for developer to rename player profile
        if (msg.reply_to_message && user.id === dev.id) {
            player = getPlayer(msg.reply_to_message.from, players)
        }

        // Executing
        reply = rename(player, msg.text)
        savePlayers(players)

    } else if (text.includes(commands.start)) {

        reply = start()

    } else if (text.includes(commands.stats)) {

        reply = getStats(stats)

    } else if (text.includes(commands.give)) {

        if (msg.reply_to_message) {
            player = getPlayer(msg.reply_to_message.from, players)
            reply = give(null, player, text)
        } else {
            reply = give(players, null, text)
        }

        savePlayers(players)

    } 


    // Deleting message which contains command request
    // While bot shouldn't delete reply message if is private chat with bot
    deleteMessage(bot, chatId, msgId)
    if (msg.chat.type != "private" && !text.includes(commands.give)) {
        deleteMessage(bot, chatId, msgId + 1, 40)
    }

    // Sending reply message
    sendMessage(bot, chatId, reply)

    // Updating stats
    if (user.id != dev.id) {
        saveStats(++stats)
    }

})



// Execute when the program is started
updateNeeds(market, econ)

if (checkSupply(market)) {

    while (checkSupply(market)) {
        cityGrow(market, econ)
        updateNeeds(market, econ)
        updateMarket(market, econ)
    }

    saveEcon(econ)

}

updateMarket(market, econ)
saveMarket(market)



// Calculating income for all players every 30 seconds
setInterval(function() {

    for (let player of players) {
        player.finance += calcIncome(player, market, players)
    }

    savePlayers(players)

}, 30 * 1000)

// Updating market needs every hour
setTimeout(function() {

    updateNeeds(market, econ)

    if (checkSupply(market)) {

        while (checkSupply(market)) {
            cityGrow(market, econ)
            updateNeeds(market, econ)
            updateMarket(market, econ)
        }

        saveEcon(econ)

    }

    updateMarket(market, econ)
    saveMarket(market)

    setInterval(function() {

        updateNeeds(market, econ)

        if (checkSupply(market)) {

            while (checkSupply(market)) {
                cityGrow(market, econ)
                updateNeeds(market, econ)
                updateMarket(market, econ)
            }
    
            saveEcon(econ)
    
        }

        updateMarket(market, econ)
        saveMarket(market)

    }, 60 * 60 * 1000)

}, delayToNextHour())

// Updating bonus status of rails production
setTimeout(function() {

    updateBonus("rails", players)
    savePlayers(players)

    setInterval(function() {

        updateBonus("rails", players)
        savePlayers(players)

    }, 60 * 60 * 1000)

}, delayToNextHour())

// Updating bonus status of wagon production
setTimeout(function() {

    updateBonus("wagon", players)
    savePlayers(players)

    setInterval(function() {

        updateBonus("wagon", players)
        savePlayers(players)

    }, 4 * 60 * 60 * 1000)

}, delayToFourthHour())



// Updating game cycle
setTimeout(function() {

    let today = new Date()

    if (today.getDate() === 1) {
        updateGame() 
    }

    setInterval(function() {

        today = new Date()

        if (today.getDate() === 1) {
            updateGame() 
        }

    })

}, delayToMidnight())

function updateGame() {

    players = []
    savePlayers(players)

    for (let good of market.goods) {
        good.trains.supplies = 0
    }

    econ.needsRange = [2, 3, 4, 5, 6, 7, 8, 9]
    saveEcon(econ)

    updateNeeds(market, econ)
    updateMarket(market, econ)
    saveMarket(market)

}