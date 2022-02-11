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
var banlist = require("./banlist.json")
var stats = require("./stats.json")

// Import
const { sendMessage, deleteMessage, saveBanlist, savePlayers, saveStats, saveMarket, isRequest, getGood, updateMarket, checkSupply, cityGrow, delayToNextHour, numLayout, updateNeeds, saveEcon } = require("./otherFunctions")
const { getStats, ban } = require("./devFunctions")
const { getPlayer, updateBonus } = require("./playerFunctions") 
const { getMarketInfo, train, about, give, send, back, start, readme, rename, best, bonus } = require("./mainFunctions")




// Setting up commands (visible in telegram)
bot.setMyCommands([
    { command: "/market", description: "Market info" },
    { command: "/send", description: "Send trains to supply goods" },
    { command: "/back", description: "Get back trains to depot" },
    { command: "/train", description: "Buy a train" },
    { command: "/about", description: "Player info" },
    { command: "/bonus", description: "Get bonus" },
    { command: "/best", description: "Best players" },
    { command: "/give", description: "Support a player" },
    { command: "/readme", description: "Gameplay & Updates news" }
])

// Creating these variables to operate easier
const commands = {
    market: "/market",
    send: "/send",
    back: "/back",
    train: "/train",
    about: "/about",
    bonus: "/bonus",
    best: "/best",
    give: "/give",
    readme: "/readme",

    stats: "/stats@railtransbot",
    ban: "/ban@railtransbot",

    rename: "/rename",
    start: "/start"
}
const allCommands = [ "/market", "/market@railtransbot", "/send", "/send@railtransbot", "/back", "/back@railtransbot", "/train", "/train@railtransbot", "/about", "/about@railtransbot", "/bonus", "/bonus@railtransbot", "/best", "/best@railtransbot", "/give", "/give@railtransbot", "/readme", "/readme@railtransbot", "/rename", "/rename@railtransbot", "/start", "/start@railtransbot"]
const devCommands = ["/stats@railtransbot", "/ban@railtransbot"]



// Main 
bot.on("message", msg => {

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
    if ((!isRequest(allCommands, text) && !(devCommands.includes(text) && user.id === dev.id))) {

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
        savePlayers(players)

        if (checkSupply(market)) {

            while (checkSupply(market)) {
                cityGrow(market, econ)
                updateNeeds(market, econ)
                updateMarket(market, econ)
            }

            saveEcon(econ)

            sendMessage(bot, chatId, `🏙Kyiv has grown\nPopulation: ${numLayout(market.population)}`)
        }

        updateMarket(market, econ)
        saveMarket(market)

    } else if (text.includes(commands.back)) {

        reply = back(text, player, market)
        savePlayers(players)

        updateMarket(market, econ)
        saveMarket(market)

    } else if (text.includes(commands.train)) {

        reply = train(player, econ)
        savePlayers(players)

    } else if (text.includes(commands.about)) {

        // If there is replied message, then show the info of a player, whose message is replied
        if (msg.reply_to_message) {
            player = getPlayer(msg.reply_to_message.from, players)
            savePlayers(players)
        }

        reply = about(player, market)

    } else if (text.includes(commands.bonus)) {

        reply = bonus(player, econ)
        savePlayers(players)

    } else if (text.includes(commands.best)) {

        reply = best(players, market, econ, text)

    } else if (text.includes(commands.give)) {

        if (!msg.reply_to_message) {
            reply = `<a href="tg://user?id=${player.id}">${player.name}</a>, please reply that user message, who you wish to give some money`
        } else {

            // Checking if user is banned to give someone money
            if (!banlist.includes(player.id)) {
                reply = give(player, getPlayer(msg.reply_to_message.from, players), text)
                savePlayers(players)
            } else {
                reply = `<a href="tg://user?id=${player.id}">${player.name}</a>, you are not allowed to give money`
            }

        }

    } else if (text.includes(commands.readme)) {

        reply = readme()

    } else if (text.includes(commands.rename)) {

        reply = rename(player, msg.text)
        savePlayers(players)

    } else if (text.includes(commands.start)) {

        reply = start()

    } else if (text.includes(commands.stats)) {

        reply = getStats(stats)

    } else if (text.includes(commands.ban)) {

        reply = ban(msg.reply_to_message, banlist)
        saveBanlist(banlist)

    }


    // If a player plays the game outside the chat the bot was created for, then warn him to play bot there
    if (chatId != specChat.id && !(text.includes(commands.start) || text.includes(commands.readme))) {

        if (reply.endsWith("\n\n") || reply.endsWith("\n\n</code>")) {
            reply += `Play there: @nause121`
        } else if (reply.endsWith("\n") || reply.endsWith("\n</code>")) {
            reply += `\nPlay there: @nause121`
        } else {
            reply += `\n\nPlay there: @nause121`
        }

    }


    // Deleting message which contains command request
    // While bot shouldn't delete reply message if is private chat with bot
    deleteMessage(bot, chatId, msgId)
    if (msg.chat.type != "private") {
        deleteMessage(bot, chatId, msgId + 1, 40)
    }

    // Sending reply message
    sendMessage(bot, chatId, reply)

    // Updating stats
    if (user.id != dev.id) {
        saveStats(++stats)
    }

})



// Calculating income
setInterval(function() {

    for (player of players) {

        for (supply of player.supplies) {
            let good = getGood(supply.code, market)
            player.finance += supply.trains * good.cost.current
        }
    
    }

    savePlayers(players)

}, 30 * 1000)

// Updating bonus status && market needs every hour
setTimeout(function() {

    updateBonus(players)
    savePlayers(players)

    updateNeeds(market, econ)
    updateMarket(market, econ)
    saveMarket(market)

    setInterval(function() {

        updateBonus(players)
        savePlayers(players)

        updateNeeds(market, econ)
        updateMarket(market, econ)
        saveMarket(market)

    }, 60 * 60 * 1000)

}, delayToNextHour())
