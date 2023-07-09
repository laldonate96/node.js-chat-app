const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

// REFACTORING IN ORDER TO BE ABLE TO USE SOCKETIO AND EXPRESS ALL TOGETHER
const app = express()
const server = http.createServer(app) // CREATES A NEW WEBSERVER AND WE PASS THE EXPRESS APP (IF I DONT DO THIS, EXPRESS DOES IT AUTOMATICALLY BEHIND THE SCENES)
const io = socketio(server)

const port = 4000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

// let count = 0

// server (emit) -> client (receive) - countUpdated
// client (emit) -> server (receive) - increment

io.on('connection', (socket) => { // SOCKET IS AN OBJECT PROVIDED BY SOCKETIO MODULE
    console.log('New WebSocket connection') // PRINTS IN CONSOLE WHEN A NEW CLIENT CONNECTS TO THE SERVER

    // MAKE EVENTS TO BE EMITTED SPECIFICALLY INTO THAT ROOM
    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options }) // ...options SEPARATES THE OBJECT IN username AND room

        if (error) { // IF THERE IS AN ERROR SHOWS IT TO THE USER AND STOPS EXECUTION
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        // to() IS USED EMIT ONLY IN THE SPECIFIC ROOM
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`)) // EMITS THE MESSAGE TO EVERYONE EXCEPT THAT SOCKET
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        // IF EVERYTHING WENT WELL (NO ERROR) ACKNOWLEDGE SUCCESS
        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()

        if (filter.isProfane(message)) { 
            // FUNCTION TO CENSOR PROFANITY
            censoredWord = ''
            for (let index = 0; index < message.length; index++) {
                censoredWord += '*'
            }
            message = censoredWord

            //console.log(censoredWord)
            // IF THE MESSAGE CONTAINS BAD WORDS, EXECUTION WILL STOP AND SEND THE BELOW MESSAGE (ORIGINAL MESSAGE WILL NEVER BE SENT)
            //return callback('Profanity is not allowed!') 
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback() // THIS IS THE LAST PARAMETER (CALLBACK FUNCTION) THE CLIENT SENT (THE EVENT ACKNOWLEDGEMENT)
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`)) // GOOGLE MAPS LINK TO LOCATION
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`)) // NO NEED TO USE BROADCAST SINCE THE CLIENT WILL DISCONNECT SO IT WONT RECEIVE THE MESSAGE
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    // socket.emit('countUpdated', count) // SENDS AN EVENT FROM THE SERVER TO THE CLIENT

    // socket.on('increment', () => { // RECEIVE BACK INFO FROM THE CLIENT
    //     count++
    //     // ONCE AGAIN SEND THAT INFO TO THE CLIENT, THIS TIME WITH THE COUNTER INCREMENTED
    //     // socket.emit('countUpdated', count) // EMITS THE EVENT TO THAT SPECIFIC CONNECTION
    //     io.emit('countUpdated', count) // THIS CASE EMITS THE EVENT TO EVERY SERVER CONNECTION
    // })
})

server.listen(port, () => {
    console.log('Server is up on port ' + port)
})