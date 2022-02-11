// Import
const { getName } = require("./otherFunctions")

// Export
module.exports = { getPlayer, updateBonus }




// Function to create player
function createPlayer(user, players) {

    // Creating new player object
    let newPlayer = {
        id: user.id,
        name: getName(user),
        trains: {
            free: 4,
            busy: 0
        },
        finance: 300000,
        supplies: [],
        bonus: false
    }

    // Pushing the newPlayer
    players.push(newPlayer)

    // Return the player
    return newPlayer

}

// Function which finds player by userId and returns it
function getPlayer(user, players) {

    for (player of players) {
        if (player.id === user.id) {
            return player
        }
    }

    return createPlayer(user, players)

}

// Update bonus status
function updateBonus(players) {

    for (player of players) {
        player.bonus = false
    }

}