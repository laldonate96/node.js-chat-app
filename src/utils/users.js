const users = []

const addUser = ({ id, username, room }) => {
    // CLEAN THE DATA
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // VALIDATE THE DATA
    if (!username || !room) {
        return {
            error: 'Username and room are required!'
        }
    }

    // CHECK FOR EXISTING USER
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    // VALIDATE USERNAME
    if (existingUser) {
        return {
            error: 'Username is in use!'
        }
    }

    // STORE USER
    const user = { id, username, room }
    users.push(user)
    return { user }
}

const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id) // IF THERE IS NOT MATCH RETURNS -1

    if (index != -1) {
        return users.splice(index, 1)[0] // RETURNS THE REMOVED USER
    }
}

addUser({
    id: 22,
    username: 'Lucas   ',
    room: '   Buenos Aires'
})

addUser({
    id: 42,
    username: 'Mike',
    room: '   Buenos Aires'
})

addUser({
    id: 32,
    username: 'Lucas',
    room: 'Otra sala'
})

const getUser = (id) => {
    return users.find((user) => user.id === id)
}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    return users.filter((user) => user.room === room)
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}