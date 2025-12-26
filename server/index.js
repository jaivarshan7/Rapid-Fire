const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const gameManager = require('./gameState');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'password') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for dev, tighten for prod if needed
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // --- HOST EVENTS ---

    socket.on('create_room', () => {
        const room = gameManager.createRoom(socket.id);
        socket.join(room.pin);
        socket.emit('room_created', room.pin);
        console.log(`Room created: ${room.pin} by ${socket.id}`);
    });

    socket.on('start_game', ({ pin, questions }) => {
        const room = gameManager.getRoom(pin);
        if (room && room.hostSocketId === socket.id) {
            // Validate questions
            if (!questions || questions.length === 0) {
                // Should inject default questions if none provided? Or error.
                // For MVP, if no questions, use a default set.
                // We'll assume frontend sends them or we load them.
            }
            const firstQuestion = room.startGame(questions);
            io.to(pin).emit('game_started');
            // Wait a moment then send question? Or host triggers "next"?
            // Kahoot style: Host sees "Get Ready", then question pops up.
            // We'll let Host trigger the actual flows for control.
        }
    });

    socket.on('host_next_question', ({ pin }) => {
        const room = gameManager.getRoom(pin);
        if (room && room.hostSocketId === socket.id) {
            const question = room.nextQuestion();
            if (question) {
                io.to(pin).emit('next_question', question);
            } else {
                io.to(pin).emit('game_over', room.getLeaderboard());
            }
        }
    });
    
    socket.on('host_show_leaderboard', ({ pin }) => {
         const room = gameManager.getRoom(pin);
         if (room && room.hostSocketId === socket.id) {
             io.to(pin).emit('show_leaderboard', room.getLeaderboard());
         }
    });
    
    socket.on('host_show_question_results', ({ pin }) => {
        // Show correct answer distribution
        io.to(pin).emit('show_question_results');
    });

    // --- PLAYER EVENTS ---

    socket.on('join_room', ({ pin, name }) => {
        const room = gameManager.getRoom(pin);
        if (room && room.status === 'WAITING') {
            const player = room.addPlayer(name, socket.id);
            socket.join(pin);
            socket.emit('joined_room', { playerId: player.id, name: player.name });
            io.to(room.hostSocketId).emit('player_joined', { id: player.id, name: player.name });
            console.log(`${name} joined room ${pin}`);
        } else {
            socket.emit('error', 'Room not found or already started');
        }
    });

    socket.on('submit_answer', ({ pin, playerId, answer, timeLeft, maxTime }) => {
        const room = gameManager.getRoom(pin);
        if (room && room.status === 'IN_GAME') {
            const result = room.submitAnswer(playerId, answer, timeLeft, maxTime);
            if (result) {
                socket.emit('answer_result', result);
                // Notify host that a player answered (to update count)
                io.to(room.hostSocketId).emit('player_answered');
            }
        }
    });

    socket.on('disconnect', () => {
        // Handle cleanup
        // If host disconnects, might want to destroy room or reconnect logic (MVP: destroy)
        const roomByHost = gameManager.getRoomByHost(socket.id);
        if (roomByHost) {
            io.to(roomByHost.pin).emit('host_disconnected');
            gameManager.removeRoom(roomByHost.pin);
            console.log(`Host disconnected, room ${roomByHost.pin} closed`);
        } else {
            // Find if it was a player
            // This is O(N) over rooms, but fine for MVP
            for (const room of gameManager.rooms.values()) {
                 const player = room.removePlayer(socket.id);
                 if (player) {
                     io.to(room.hostSocketId).emit('player_left', { id: player.id });
                     break;
                 }
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
