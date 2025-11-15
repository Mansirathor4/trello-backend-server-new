// backend/server.js

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 

dotenv.config(); // .env file load karein

const { createBoard, createCard, updateCard, deleteCard } = require('./trelloApi');

const app = express();
const PORT = process.env.PORT || 3000;
// --- Board ID ko yahan define kar dein taaki har jagah use ho sake ---
const TRELLO_BOARD_ID = process.env.TRELLO_BOARD_ID; 

// Middleware
app.use(cors()); 
app.use(express.json()); 

// --- 1. WebSocket Server Setup ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        // FIX: origin ko wildcard (*) set kiya gaya hai Vercel par stability ke liye.
        origin: "*", 
        methods: ["GET", "POST"],
        // credentials: true // Credentials allow karein
    },
    // Vercel par Socket.io ko stable banane ke liye transports ko polling par set karein.
    // NOTE: Agar client-side par 'polling' set hai, toh yeh zaroori nahi, lekin better hai.
    // transports: ['polling'] 
});

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);
    
    // Client ke connect hone par, unhe Trello board ID ke room se join karwayein
    const boardRoom = TRELLO_BOARD_ID;
    socket.join(boardRoom);
    console.log(`Socket ${socket.id} joined room: ${boardRoom}`);

    socket.on('disconnect', () => {
        console.log(`User Disconnected: ${socket.id}`);
    });
});
// -----------------------------------

// --- 2. Required Backend API Endpoints (30 points) ---
// ... (API Endpoints code mein koi change nahi) ...

app.post('/api/boards', async (req, res) => {
    try {
        const { name, defaultLists } = req.body; 
        const newBoard = await createBoard(name, defaultLists);
        res.status(201).json(newBoard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const { listId, name, desc } = req.body; 
        const newCard = await createCard(listId, name, desc);
        res.status(201).json(newCard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/tasks/:cardId', async (req, res) => {
    try {
        const { cardId } = req.params;
        const updates = req.body; 
        const updatedCard = await updateCard(cardId, updates);
        res.status(200).json(updatedCard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/tasks/:cardId', async (req, res) => {
    try {
        const { cardId } = req.params;
        await deleteCard(cardId);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- 3. Trello Webhook Listener (Real-time Core - 30 points) ---
// ... (Webhook code mein koi change nahi) ...

app.head('/api/webhook/trello', (req, res) => {
    console.log('Trello Webhook HEAD received for validation.');
    res.status(200).send();
});

app.post('/api/webhook/trello', (req, res) => {
    const trelloEvent = req.body;
    
    if (trelloEvent && trelloEvent.action && trelloEvent.action.data.board) {
        const actionType = trelloEvent.action.type;
        const boardId = trelloEvent.action.data.board.id;

        let normalizedEvent = {
            boardId: boardId,
            type: '', 
            data: trelloEvent.action.data 
        };

        switch (actionType) {
            case 'createCard':
                normalizedEvent.type = 'TASK_CREATED';
                break;
            case 'updateCard':
                if (trelloEvent.action.data.listBefore || trelloEvent.action.data.listAfter) {
                    normalizedEvent.type = 'TASK_MOVED';
                } else {
                    normalizedEvent.type = 'TASK_UPDATED';
                }
                break;
            case 'deleteCard': 
            case 'closeCard': 
                normalizedEvent.type = 'TASK_DELETED';
                break;
            default:
                return res.status(200).send('Event not relevant to tasks.'); 
        }

        // Broadcast event to clients subscribed to this board's room
        io.to(boardId).emit('trello-update', normalizedEvent);
        console.log(`Broadcasted event: ${normalizedEvent.type} to Room: ${boardId}`);
    }

    res.status(200).send(); // Trello ko acknowledge karna zaroori hai
});


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});