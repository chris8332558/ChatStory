// Run the app
const app = require('./src/app')
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Room = require('./src/models/postgres/room');
const Message = require('./src/models/mongo/message');

// http.createServer(app): Creates an HTTP server that wraps your existing Express application. 
// This is necessary because Socket.IO needs to attach to the underlying HTTP server, not just the Express app.

// new Server(server, {...}): Creates a new Socket.IO server instance that "mounts" on top of your HTTP server. 
// This allows both regular HTTP requests (handled by Express) and WebSocket connections (handled by Socket.IO) to coexist on the same port

// CORS Configuration: The cors object allows cross-origin requests from any domain (origin: "*"). In production, you should specify your actual frontend domain instead of using the wildcard for security.
const server = http.createServer(app);
const io = new Server(server, { 
    cors: {origin: '*', methods: ['POST', 'GET']}
});


// Socket auth middleware: Registers a middleware, which is a function that gets executed for every incoming Socket.
io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token ||
                    socket.handshake.headers['x-auth-token'] ||
                    socket.handshake.query?.token;
        if (!token) return next(new Error('No auth token when passing Socket auth middleware'));

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        socket.user = decoded.user; // {id, username}
        next();
    } catch(err) {
        next(new Error('Invalid token when passing Socket auth middleware'));
    }
});



// Realtime logic
// io.on('connection', ...): Listens for new client connections. Every time a user opens your app, this callback fires
// Represents the individual connection to that specific user. Each user gets a unique socket object with a unique socket.id.
// This is where you define all the real-time interactions for each connected user.
io.on('connection', (socket) => {
    console.log('io.on(connection): A user connected:', socket.id);

    // When a client joins a room. The server with this socket will listen to the 'joinRoom' event
    socket.on('joinRoom', async ({ room_id }) => {
        try {
            const userId = socket.user.id;
            const isMember = await Room.isMember({ user_id, room_id });
            if (!isMember) return;
            socket.join(room_id); // This means this socket joined the `room` with name `room_id`
            console.log(`socket.on(joinRoom): User ${socket.id} joined room ${room_id}`);
        } catch (err) {
            console.error('server/index: joinRoom error:', err);
        }
    })
    

    // When a client sends a message
    // Listens for a custom event called 'sendMessage' from this user's client.
    socket.on('sendMessage', async (data) => {
        try {
            const user_id = socket.user.id;
            const username = socket.user.username;
            const { room_id, message } = data; // Assume message is an Message object { text, user, createAt } defined in [roomid].tsx

            if (!message || !message.trim()) return;
            const isMember = await Room.isMember({ user_id, room_id });
            if (!isMember) return;

            const saved = await Message.create({
                room_id, user_id, username, text: message.trim(),
            })

            const payload = {
                id: saved._id,
                roomId: saved.roomId,
                userId: saved.userId,
                username: saved.username,
                text: saved.text,
                createdAt: saved.createdAt,
            };

            // Broadcast the message to everyone in the room except the sender
            // This is the broadcasting logic. It sends the 'receiveMessage' event to all users in the specified room except the sender. This prevents the sender from receiving their own message twice
            io.to(room_id).emit('receiveMessage', payload);
            console.log(`io.to(reveiceMessage): User ${socket.id} received a message from ${room_id}: ${message}`);
        } catch (err) {
            console.error('sendMessage error:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected: ', socket.id);
    });
});



const port = process.env.PORT || 3000

server.listen(port, () => {
    console.log(`Server + WebSocket are listening on port ${port}`);
});