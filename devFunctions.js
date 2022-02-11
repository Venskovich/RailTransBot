// Import
const dev = require("./dev.json")
const { getName } = require("./otherFunctions")

// Export
module.exports = { getStats, ban }




// Function of dev command, which returns message of stats
function getStats(stats) {
    return `stats: ${stats}`
}

// FUnction of dev command, which bans a player transactions ability
function ban(repliedMsg, banlist) {

    // Checking if there is replied message
    if (!repliedMsg) {
        return `<a href="tg://user?id=${dev.id}">${dev.name}</a>, please reply that user message, who you wish to ban`
    } 


    // Getting player to ban
    let player = repliedMsg.from

    // Reply message to return
    let reply = `Player <a href="tg://user?id=${player.id}">${getName(player)}</a>`


    // If this user is already banned, then unban him. Otherwise - ban
    if (banlist.includes(player.id)) {

        // Getting off the banlist
        banlist.splice(banlist.indexOf(player.id), 1)

        return `${reply} is free to give money`

    } else {

        // Pushing to the banlist
        banlist.push(player.id)

        return `${reply} is forbidden to give money`

    }
 
}
