// Import
const dev = require("./dev.json")
const {  priceLayout } = require("./otherFunctions")

// Export
module.exports = { getStats, give }




// Function of dev command, which returns message of stats
function getStats(stats) {
    return `stats: ${stats}`
}

// Function to give a million to all players if there is any bug found
function give(players, player, text) {

    // Working with the text
    let items = text.split(" ")

    if (items.length != 2 || !parseInt(items[1]) || parseInt(items[1]) < 0) {
        return `<a href="tg://user?id=${dev.id}">${dev.name}</a>, specify amount of money as the second parameter`
    }

    // How much money to give
    let param = parseInt(items[1])
    
    // Whether to give money to all players or the one
    if (players != null) {

        for (let player of players) {
            player.finance += param
        }

        return `<a href="tg://user?id=${dev.id}">${dev.name}</a> has given everyone ${priceLayout(param)}`

    } else {

        player.finance += param

        return `<a href="tg://user?id=${dev.id}">${dev.name}</a> has given <a href="tg://user?id=${player.id}">${player.name}</a> ${priceLayout(param)}`

    }

}