// IN index.js I HAVE SOCKET BY DEFAULT AS IT IS THE SERVER, HERE AS IT IS THE CLIENT, SOCKET IS THE RETURN VALUE FROM THE io() CALL
const socket = io() 

// ELEMENTS
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// TEMPLATES
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// OPTIONS
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true }) // MAKES THE ? TO GO AWAY

const autoscroll = () => {
    // NEW MESSAGE ELEMENT
    const $newMessage = $messages.lastElementChild

    // HEIGHT OF THE NEW MESSAGE
    const newMessageStyles = getComputedStyle($newMessage) // SO I CAN SEE THE MARGIN VALUES
    const newMessageMargin = parseInt(newMessageStyles.marginBottom) // I GET THE MARGIN VALUE
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin // I ADD THE MARGIN VALUE TO THE OFFSET 

    // VISIBLE HEIGHT
    const visibleHeight = $messages.offsetHeight

    // HEIGHT OF MESSAGES CONTAINER
    const containerHeight = $messages.scrollHeight

    // HOW FAR HAVE I SCROLLED?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) { // MAKES SURE WE WERE AT THE BOTTOM BEFORE THE LAST MESSAGE WAS ADDED
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, { // WILL RENDER ALL MESSAGES TO THE TEMPLATE CREATED IN index.html
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a') // moment WAS ALSO LOADED IN index.html SAME AS mustache
    })
    $messages.insertAdjacentHTML('beforeend', html) // beforeend RENDERS BEFORE THE END OF THE DIV
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationTemplate, { // WILL RENDER ALL MESSAGES TO THE TEMPLATE CREATED IN index.html
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html) // beforeend RENDERS BEFORE THE END OF THE DIV
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    // DISABLE FORM BUTTON TO PREVENT DOUBLE CLICKS
    $messageFormButton.setAttribute('disabled', 'disabled') // DISABLES THE FORM ONCE IT WAS SUBMITTED

    const message = e.target.elements.message.value // I ACCES THE INPUT ELEMENT BY ITS NAME (message)

    socket.emit('sendMessage', message, (error) => { // EVENT ACKNOWLEDGEMENT
        // RE-ENABLE THE FORM BUTTON
        $messageFormButton.removeAttribute('disabled') // ENABLES THE FORM ONCE THE MESSAGE IS SENT
        $messageFormInput.value = '' // CLEARS THE INPUT TEXT AFTER SENDING THE MESSAGE
        $messageFormInput.focus() // MOVES THE CURSOR INSIDE THE FORM

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }
    // DISABLE BUTTON TO PREVENT DOUBLE CLICKS
    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => { // GETS THE COORDINATES OF THE USER
        // console.log(position)
        const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }
        socket.emit('sendLocation', coords, () => { // EVENT ACKNOWLEDGEMENT
            // RE-ENABLE BUTTON
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })
})

socket.emit('join', { username, room }, (error) => { // SENDS THE OBJECT TO THE SERVER
    if (error) {
        alert(error)
        location.href = '/' // SENDS BACK THE USER TO THE HOME PAGE
    }
}) 

// server (emit) -> client (receive) - countUpdated
// client (emit) -> server (receive) - increment

// RECEIVES WHAT THE SERVER EMMITED
// socket.on('countUpdated', (count) => { 
//     console.log('The count has been updated!', count)
// })

// WHAT THE PROGRAM WILL DO WHENEVER THE USER CLICKS THE BUTTON
// document.querySelector('#increment').addEventListener('click', () => { 
//     console.log('Clicked')
//     socket.emit('increment') // SENDS BACK INFO FROM THE CLIENT TO THE SERVER
// })  