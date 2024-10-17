const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Use CORS for allowing requests from Angular
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

// Directly include the API key here (not recommended for production)
const GEMINI_API_KEY = 'AIzaSyDSxcXuCiugOP5-Ffg-VPY3HiCF9gQTVIw'; // Replace with your actual key

// Function to make API request with exponential backoff
async function makeApiRequest(userMessage, retries = 3) {
    console.log(userMessage,'ttttttt');
    
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
    const headers = {
        'Content-Type': 'application/json',
    };

    const body = {
        contents: [
            {
                parts: [
                    {
                        text: userMessage
                    }
                ]
            }
        ]
    };
  
    try {
        const response = await axios.post(`${apiUrl}?key=${GEMINI_API_KEY}`, body, { headers });
        return response.data;
    } catch (error) {
        const statusCode = error.response ? error.response.status : 500;
        if (statusCode === 429 && retries > 0) {
            const backoffTime = Math.pow(2, 3 - retries) * 1000; // Exponential backoff
            console.log(`Rate limit exceeded, retrying in ${backoffTime / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            return await makeApiRequest(userMessage, retries - 1); // Retry
        }
        throw new Error(error.response?.data?.error?.message || 'An unknown error occurred.');
    }
}

// API route for chat
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;
    console.log('api test',userMessage);
    
    try {
        const apiResponse = await makeApiRequest(userMessage);
        res.json(apiResponse);
    } catch (error) {
        console.error('Error from Gemini:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
