// backend/trelloApi.js
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const BASE_URL = 'https://api.trello.com/1';
const AUTH_PARAMS = `key=${process.env.TRELLO_API_KEY}&token=${process.env.TRELLO_API_TOKEN}`;

async function trelloApiCall(method, path, data = {}) {
    try {
        const url = `${BASE_URL}${path}?${AUTH_PARAMS}`;
        
        const response = await axios({
            method: method,
            url: url,
            data: data 
        });

        return response.data;
    } catch (error) {
        console.error(`Trello API Error (${path}):`, error.response ? error.response.data : error.message);
        // Error ko aage pass karein taaki Express usko catch kar sake
        throw new Error(`Failed Trello API call to ${path}. Status: ${error.response ? error.response.status : 'N/A'}`);
    }
}

// 1. Make new board
exports.createBoard = (name, defaultLists) => {
    return trelloApiCall('POST', '/boards', { 
        name, 
        defaultLists 
    });
};

// 2. Add new task (create card)
exports.createCard = (listId, name, desc) => {
    // Note: Trello API requires listId
    return trelloApiCall('POST', '/cards', { 
        idList: listId, 
        name, 
        desc 
    });
};

// 3. Update existing task (update card)
exports.updateCard = (cardId, updates) => {
    return trelloApiCall('PUT', `/cards/${cardId}`, updates);
};

exports.deleteCard = (cardId) => {
    // Standard practice is often to close the card (PUT /cards/{id} with closed=true) 
    // Lekin hum yahan standard DELETE use kar rahe hain, jaisa ki assignment ne allow kiya hai.
    return trelloApiCall('DELETE', `/cards/${cardId}`); 
};