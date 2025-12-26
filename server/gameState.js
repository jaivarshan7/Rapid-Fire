const { v4: uuidv4 } = require('uuid');

class Player {
    constructor(id, name, socketId) {
        this.id = id;
        this.name = name;
        this.socketId = socketId;
        this.score = 0;
        this.streak = 0;
        this.lastAnswerTime = 0;
    }
}

class Room {
    constructor(pin, hostSocketId) {
        this.pin = pin;
        this.hostSocketId = hostSocketId;
        this.players = new Map(); // id -> Player
        this.status = 'WAITING'; // WAITING, IN_GAME, FINISHED
        this.currentQuestionIndex = -1;
        this.questions = [];
        this.answers = new Map(); // questionIndex -> { playerId -> { answer, time, score } }
    }

    addPlayer(name, socketId) {
        const id = uuidv4();
        const player = new Player(id, name, socketId);
        this.players.set(id, player);
        return player;
    }

    removePlayer(socketId) {
        for (const [id, player] of this.players.entries()) {
            if (player.socketId === socketId) {
                this.players.delete(id);
                return player;
            }
        }
        return null;
    }

    startGame(questions) {
        this.status = 'IN_GAME';
        this.questions = questions;
        this.currentQuestionIndex = -1;
        return null;
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            return this.questions[this.currentQuestionIndex];
        }
        this.status = 'FINISHED';
        return null;
    }

    submitAnswer(playerId, answer, timeLeft, maxTime) {
        const player = this.players.get(playerId);
        if (!player) return null;

        const currentQ = this.questions[this.currentQuestionIndex];
        const isCorrect = answer === currentQ.correctAnswer;
        
        // Calculate Score: 1000 * (1 - (timeElapsed / 2) / maxTime)  <-- simplistic Kahoot formula clone
        // Or simpler: Base points + bonus for speed.
        // Let's use: if correct, 500 + (500 * timeLeft / maxTime)
        
        let points = 0;
        if (isCorrect) {
            player.streak++;
            
            // Base points: Linear decay from 1000 to 500 based on time
            let basePoints = Math.round(500 + (500 * (timeLeft / maxTime)));
            
            // Streak Bonus
            let streakBonus = 0;
            if (player.streak >= 6) streakBonus = 500;
            else if (player.streak === 5) streakBonus = 400;
            else if (player.streak === 4) streakBonus = 300;
            else if (player.streak === 3) streakBonus = 200;
            else if (player.streak === 2) streakBonus = 100;
            
            points = basePoints + streakBonus;
            player.score += points;
        } else {
            player.streak = 0;
        }

        // Store detailed answer info if needed for stats
        // logic skipped for brevity
        
        return { isCorrect, points, totalScore: player.score, streak: player.streak };
    }

    getLeaderboard() {
        return Array.from(this.players.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 5); // Top 5
    }
}

class GameManager {
    constructor() {
        this.rooms = new Map(); // pin -> Room
    }

    createRoom(hostSocketId) {
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        const room = new Room(pin, hostSocketId);
        this.rooms.set(pin, room);
        return room;
    }

    getRoom(pin) {
        return this.rooms.get(pin);
    }

    removeRoom(pin) {
        this.rooms.delete(pin);
    }
    
    // Helper to find room by host socket
    getRoomByHost(socketId) {
        for (const room of this.rooms.values()) {
            if (room.hostSocketId === socketId) return room;
        }
        return null;
    }
}

module.exports = new GameManager();
