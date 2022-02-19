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
        finance: 100000,
        supplies: [],
        rails: {
            level: 1,
            bonus: false
        },
        wagon: {
            level: 1,
            bonus: false    
        },
        bank: 300000
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
function updateBonus(type, players) {

    if (type === "rails") {
        for (let player of players) {
            player.rails.bonus = false
        }
    } else if (type === "wagon") {
        for (let player of players) {
            player.wagon.bonus = false
        }
    } else {
        for (let player of players) {
            player.rails.bonus = false
            player.wagon.bonus = false
        }
    }
    
}