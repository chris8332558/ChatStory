// Run the app
const app = require('./src/app')
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Room = require('./src/models/postgres/room');
const Message = require('./src/models/mongo/message');
const { disconnectMongo } = require('./src/config');
const { connectToMongo } = require('./src/config');
const { pgPool } = require('./src/config');

// If the connection fails, the application will exit (as defined in your config/index.js file), 
// which is good because the app can't run properly without its database.
connectToMongo();

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
        console.log('server/index: io.use((socket, next))');
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



// Socket.IO server realtime logic
// io.on('connection', ...): Listens for new client connections. Every time a user opens your app and go to a chatroom, this callback fires
// Represents the individual connection to that specific user. Each user gets a unique socket object with a unique socket.id.
// This is where you define all the real-time interactions for each connected user.
io.on('connection', (socket) => {
    console.log('server/index: io.on(connection): socket.id:', socket.id);

    // When a client joins a room. The server with this socket will listen to the 'joinRoom' event
    socket.on('joinRoom', async (room_id) => {
        try {
            const user_id = socket.user.id;
            console.log(`server/index: socket.on(joinRoom): user_id: ${user_id}, room_id: ${room_id}`);
            const isMember = await Room.isMember({ user_id, room_id });
            if (!isMember) {
                console.error('server/index: is not member');
                return;
            }
            socket.join(room_id); // This means this socket joined the `room` with name `room_id`
            console.log(`server/index: socket.on(joinRoom): User with socket.id ${socket.id} joined the room with room_id ${room_id}`);
        } catch (err) {
            console.error('server/index: joinRoom error:', err);
        }
    })

    
    // This means this socket joined the `room` with name `unreadBumpRoom`
    socket.join('unreadBumpRoom');

    // When another client sends a message.
    // Listens for a custom event called 'sendMessage' from this user's client.
    // The sendMessage will contains { room_id, msg: Message }
    socket.on('sendMessage', async (data) => {
        try {
            console.log('server/index: socket.on(sendMessage)')
            const user_id = socket.user.id;
            const username = socket.user.username;
            const { room_id, text } = data;

            if (!text || !text.trim()) return;
            const isMember = await Room.isMember({ user_id, room_id });
            if (!isMember) return;

            const saved = await Message.create({
                room_id, user_id, username, text: text.trim(),
            })

            const seqRes = await pgPool.query(`UPDATE Room_Counters SET msg_seq = msg_seq + 1 WHERE room_id = $1 RETURNING msg_seq`, [room_id]);
            const newSeq = seqRes.rows[0].msg_seq;
            console.log(`server/index: socket.on(sendMessage): New message saved with _id: ${saved._id} in room_id: ${room_id}, newSeq: ${newSeq}`);

            // Update the sender's last_read_seq to the newSeq so they won't have unread for their own message
            await pgPool.query(`
                INSERT INTO User_Room_State (user_id, room_id, last_read_seq)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id, room_id) 
                DO UPDATE SET last_read_seq = GREATEST(User_Room_State.last_read_seq, EXCLUDED.last_read_seq)`, 
                [user_id, room_id, newSeq]);
             

            // fit the structure of Message in room_id.tsx
            const msg = {
                _id: saved._id,
                room_id: saved.room_id,
                user_id: saved.user_id,
                username: saved.username,
                text: saved.text,
                created_at: saved.created_at,
            };

            // Broadcast the message to everyone in the room
            // This is the broadcasting logic. It sends the 'receiveMessage' event to all users in the specified room except the sender. This prevents the sender from receiving their own message twice
            io.to(room_id).emit('receiveMessage', { msg, newSeq }); // client will listen to 'receiveMessage' to get new message
            console.log(`server/index: io.to(receiveMessage): Socket server emit(receiveMessage) to room:${room_id}, text: ${text}`);

            // Emitting a small “bump” event keeps socket traffic minimal and defers unread computation to a single GET /api/unreads call on the client, which simplifies server logic and remains responsive at scale.
            // notify other members in the room to refresh their unread counts (exclude sender)
            socket.to('unreadBumpRoom').emit('roomUnreadBump', { room_id }); // client can fetch /api/unreads
            console.log(`server/index: socket.to(roomUnreadBump): Socket server emit(roomUnreadBump) to room:${room_id}`);

        } catch (err) {
            console.error('sendMessage error:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('server/index: socket.on(disconnect): User disconnected: ', socket.id);
    });
});

// Graceful shutdown
function shutdown(signal) {
    console.log(`\n${signal} receieved, shotting down...`);
    // Stop accepting new connections; finish ongoing ones
    server.close(async() => {
        try {
            disconnectMongo();           
        } catch (err) {
            console.error('Error closing Mongo', err);
        } finally {
            process.exit(0);
        }
    })

    // Fallback: force exit if not closed in time
    setTimeout(() => {
        console.error('Force exist after timeout');
        process.exit(1);
    }, 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT')); // ctrl + c locally
process.on('SIGTERM', () => shutdown('SIGTERM')); // sent by container/orchestrator

const port = process.env.PORT || 3000

server.listen(port, () => {
    console.log(`Server + WebSocket are listening on port ${port}`);
});