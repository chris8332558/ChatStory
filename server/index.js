// Run the app
const app = require('./src/app')
const http = require('http');
const { Server } = require('socket.io');

// http.createServer(app): Creates an HTTP server that wraps your existing Express application. 
// This is necessary because Socket.IO needs to attach to the underlying HTTP server, not just the Express app.

// new Server(server, {...}): Creates a new Socket.IO server instance that "mounts" on top of your HTTP server. 
// This allows both regular HTTP requests (handled by Express) and WebSocket connections (handled by Socket.IO) to coexist on the same port

// CORS Configuration: The cors object allows cross-origin requests from any domain (origin: "*"). In production, you should specify your actual frontend domain instead of using the wildcard for security.

const server = http.createServer(app);
const io = new Server(server, { 
    cors: {origin: '*', methods: ['POST', 'GET']}
});



// Realtime logic
// io.on('connection', ...): Listens for new client connections. Every time a user opens your app, this callback fires
// Represents the individual connection to that specific user. Each user gets a unique socket object with a unique socket.id.
// This is where you define all the real-time interactions for each connected user.
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // When a client joins a room. The server with this socket will listen to the 'joinRoom' event
    socket.on('joinRoom', ({ room_id }) => {
        socket.join(room_id); // This means this socket joined the `room` with name `room_id`
        console.log(`User ${socket.id} joined room ${room_id}`);
    })
    

    // When a client sends a message
    // Listens for a custom event called 'sendMessage' from this user's client.
    socket.on('sendMessage', (data) => {
        const { room_id, message } = data; // Assume message is an Message object { text, user, createAt } defined in [roomid].tsx

        // Here you would save the message to your MongoDB collection
        // Message.create({ roomId, userId: message.user.id, content: message.text });

        // Broadcast the message to everyone in the room except the sender
        // This is the broadcasting logic. It sends the 'receiveMessage' event to all users in the specified room except the sender. This prevents the sender from receiving their own message twice
        socket.to(room_id).emit('reveiveMessage', message);
    })

    socket.on('disconnect', () => {
        console.log('User disconnected: ', socket.id);
    })

})



const port = process.env.PORT || 3000

server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});