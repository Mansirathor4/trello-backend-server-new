import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

// NOTE: Vercel deployed backend ka URL
const SOCKET_SERVER_URL = "https://trello-hiring-backend.vercel.app";

function TrelloBoard() {
    const [status, setStatus] = useState("Connecting to server...");
    const [events, setEvents] = useState([]); 

    useEffect(() => {
        // Socket.io client ko connect karein
        const socket = io(SOCKET_SERVER_URL, {
            transports: ['polling'] 
        });

        // Connection events
        socket.on('connect', () => {
            setStatus("Connected to Vercel Backend!");
            console.log(`Socket connected: ${socket.id}`);
        });

        // Backend se aane wale Trello events ko listen karein
        // Event name: 'trello-update'
        socket.on('trello-update', (data) => {
            console.log('--- Real-time Trello Event Received ---', data);
            
            // Naye event ko list mein add karein
            setEvents((prevEvents) => [
                { 
                    id: Date.now(), 
                    type: data.type, 
                    cardName: data.data.card ? data.data.card.name : 'Unknown Card',
                    listName: data.data.list ? data.data.list.name : 'Unknown List',
                    timestamp: new Date().toLocaleTimeString()
                },
                ...prevEvents // Latest event sabse upar
            ]);
        });

        socket.on('disconnect', () => {
            setStatus("Disconnected.");
        });

        // Cleanup function
        return () => socket.disconnect();
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h2 className="text-3xl font-bold text-blue-500">
                Trello Realtime Feed (Vercel + Socket.io) 🎉
            </h2>
            <p>Backend Connection Status: <strong>{status}</strong></p>
            
            <hr style={{ margin: '20px 0' }} />

            <div style={{ marginTop: '20px' }}>
                <h3>Recent Trello Events:</h3>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {events.length === 0 ? (
                        <li>No events received yet. Create/Update a card on Trello!</li>
                    ) : (
                        events.map((event) => (
                            <li 
                                key={event.id} 
                                style={{ 
                                    border: '1px solid #ccc', 
                                    padding: '10px', 
                                    marginBottom: '10px', 
                                    borderRadius: '5px',
                                    backgroundColor: event.type === 'TASK_CREATED' ? '#e6ffe6' : '#fff0e6' 
                                }}
                            >
                                <strong>[{event.timestamp}]</strong> Action: {event.type}
                                <br />
                                Card: **{event.cardName}**
                                <br />
                                List: {event.listName}
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}

export default TrelloBoard;