// server.js
require('dotenv').config();
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const NUBILA_API_KEY = process.env.NUBILA_API_KEY;
const GAIA_API_ENDPOINT = process.env.GAIA_API_ENDPOINT;
const GAIA_API_KEY = process.env.GAIA_API_KEY;
const GAIA_MODEL_NAME = process.env.GAIA_MODEL_NAME;

if (!NUBILA_API_KEY) {
    console.error("Error: NUBILA_API_KEY is not defined in .env file.");
    process.exit(1);
}
if (!GAIA_API_ENDPOINT) {
    console.error("Error: GAIA_API_ENDPOINT is not defined in .env file.");
    process.exit(1);
}
if (!GAIA_API_KEY) {
    console.error("Error: GAIA_API_KEY is not defined in .env file.");
    process.exit(1);
}
if (!GAIA_MODEL_NAME) {
    console.error("Error: GAIA_MODEL_NAME is not defined in .env file.");
    process.exit(1);
}

// --- Middleware ---
app.use(cors()); // Allow requests from frontend
app.use(express.json()); // Parse JSON request bodies
app.use(express.static('public')); // Serve static files from 'public' directory

// Function to call Gaia API for query analysis
async function analyzeQueryWithGaia(query) {
    console.log(`Querying Gaia for: "${query}"`);
    const prompt = `
Analyze the user's weather request. Extract the location name, its approximate latitude, and longitude.
Also determine if the user wants 'current' weather or a 'forecast'.

Respond ONLY with a valid JSON object containing:
- "locationName": string (the extracted location)
- "latitude": number | null (approximate latitude, null if unknown)
- "longitude": number | null (approximate longitude, null if unknown)
- "requestType": "current" | "forecast" (the type of weather info requested)

User Request: "${query}"

JSON Response:
`;

    try {
        const response = await fetch(GAIA_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GAIA_API_KEY}`
            },
            body: JSON.stringify({
                model: `${GAIA_MODEL_NAME}`,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.2,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Gaia API Error (${response.status}): ${errorBody}`);
            throw new Error(`Gaia API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Extract the JSON part from the response content
        const content = data.choices[0]?.message?.content;
        if (!content) {
            console.error("Gaia response missing content:", data);
            throw new Error('Invalid response format from Gaia: No content.');
        }

        console.log("Raw Gaia Response Content:", content);

        // Attempt to parse the JSON from the content string
        try {
            // Find the start and end of the JSON object
            const jsonStart = content.indexOf('{');
            const jsonEnd = content.lastIndexOf('}');
            if (jsonStart === -1 || jsonEnd === -1) {
                 throw new Error('Could not find JSON object in Gaia response.');
            }
            const jsonString = content.substring(jsonStart, jsonEnd + 1);
            const analysis = JSON.parse(jsonString);

            console.log("Parsed Gaia Analysis:", analysis);

            // Basic validation
            if (!analysis.locationName || typeof analysis.requestType === 'undefined') {
                 throw new Error('Gaia response missing required fields (locationName, requestType).');
            }
             if (typeof analysis.latitude !== 'number' || typeof analysis.longitude !== 'number') {
                 console.warn("Gaia did not provide valid coordinates. Nubila query might fail.");
                 // Allow proceeding but coordinates might be invalid for Nubila
                 analysis.latitude = analysis.latitude || null; // Ensure null if invalid
                 analysis.longitude = analysis.longitude || null; // Ensure null if invalid
             }

            return analysis;
        } catch (parseError) {
            console.error("Error parsing Gaia JSON response:", parseError);
            console.error("Problematic content string:", content);
            throw new Error(`Failed to parse JSON from Gaia response: ${parseError.message}`);
        }

    } catch (error) {
        console.error("Error calling Gaia API:", error);
        throw new Error(`Could not analyze query with Gaia: ${error.message}`); // Rethrow for handling in the route
    }
}

// Function to call Nubila API
async function getNubilaWeather(lat, lon, type = 'current') {
    if (lat === null || lon === null || typeof lat !== 'number' || typeof lon !== 'number') {
        throw new Error("Invalid or missing latitude/longitude for Nubila API call.");
    }

    const endpoint = type === 'forecast' ? 'forecast' : 'weather';
    const url = `https://api.nubila.ai/api/v1/${endpoint}?lat=${lat}&lon=${lon}`;
    console.log(`Querying Nubila: ${url} (Type: ${type})`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Api-Key': NUBILA_API_KEY
            }
        });

        const data = await response.json();

        if (!response.ok || data.ok === false) {
            console.error(`Nubila API Error (${response.status}):`, data);
            throw new Error(data.message || `Nubila API request failed with status ${response.status}`);
        }

        console.log("Nubila API Success Response:", data);
        return data; // Return the whole response (includes 'ok' and 'data' fields)

    } catch (error) {
        console.error("Error calling Nubila API:", error);
        throw new Error(`Could not fetch weather data from Nubila: ${error.message}`); // Rethrow
    }
}

// NEW FUNCTION: Use Gaia to generate personalized weather advice
async function generateLLMWeatherAdvice(weatherData, locationName, requestType, originalQuery) {
    console.log("Weather data received:", JSON.stringify(weatherData, null, 2));
    
    // Handle the structure based on the actual API response
    let currentData;
    let forecast = null;
    
    // Check if the response contains 'data' array (forecast) or a single object (current)
    if (Array.isArray(weatherData.data)) {
        // This is the forecast format with array of entries
        currentData = weatherData.data[0]; // Use the first entry as current
        forecast = weatherData.data.slice(1); // Rest are forecast entries
    } else {
        // This might be the current weather format
        currentData = weatherData.data;
    }
    
    // Create a detailed weather context for the LLM to work with
    let weatherContext = {
        location: locationName,
        current: {
            temperature: currentData.temperature || currentData.temp,
            feelsLike: currentData.feels_like,
            condition: currentData.condition,
            description: currentData.condition_desc,
            windSpeed: currentData.wind_speed,
            humidity: currentData.humidity,
            uvIndex: currentData.uv || 0,
            isDay: true // Default to day since we don't have sunrise/sunset data
        }
    };
    
    // Add forecast data if available
    if (forecast && forecast.length > 0) {
        weatherContext.forecast = {
            tomorrow: {
                condition: forecast[0].condition,
                description: forecast[0].condition_desc,
                tempMin: forecast[0].temperature_min,
                tempMax: forecast[0].temperature_max,
                humidity: forecast[0].humidity
            }
        };
    }
    
    // Stringify the weather data for the prompt
    const weatherContextJSON = JSON.stringify(weatherContext, null, 2);
    
    const prompt = `
You are a friendly, thoughtful weather assistant. Based on the weather data provided, create personalized advice and recommendations for the user who asked: "${originalQuery}"

Weather data:
${weatherContextJSON}

Respond with thoughtful, sweet advice that includes:
1. A warm, personalized greeting mentioning the location
2. Appropriate clothing suggestions based on the weather
3. Activity recommendations that would be enjoyable in these conditions
4. Health tips related to the weather (hydration, sun protection, etc.)
5. A mood suggestion (music, mindset) that pairs well with this weather
6. If forecast data is available, a brief mention of tomorrow's weather

Make your response conversational, friendly, and include relevant emojis. Your advice should be both practical and uplifting.

Response:
`;

    try {
        //console.log("Generating LLM weather advice");
        const response = await fetch(GAIA_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GAIA_API_KEY}`
            },
            body: JSON.stringify({
                model: `${GAIA_MODEL_NAME}`,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7, // Slightly higher temperature for more creative responses
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Gaia API Error for weather advice (${response.status}): ${errorBody}`);
            throw new Error(`Gaia API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const advice = data.choices[0]?.message?.content;
        
        if (!advice) {
            console.error("Gaia response missing content for weather advice:", data);
            throw new Error('Invalid response format from Gaia for weather advice: No content.');
        }

        //console.log("Generated weather advice:", advice);
        return advice;

    } catch (error) {
        console.error("Error generating weather advice with Gaia:", error);
        // Return a fallback message if LLM fails
        return `Weather for ${locationName}: ${currentData.condition_desc}, ${currentData.temperature || currentData.temp}°C (feels like ${currentData.feels_like}°C). Take care and have a wonderful day!`;
    }
}

app.post('/api/weather-info', async (req, res) => {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim() === '') {
        return res.status(400).json({ ok: false, message: "Query parameter is required." });
    }

    try {
        // 1. Analyze query with Gaia
        const analysis = await analyzeQueryWithGaia(query);

        if (!analysis || analysis.latitude === null || analysis.longitude === null) {
             return res.status(400).json({ ok: false, message: `Could not determine valid coordinates for "${analysis?.locationName || query}". Please be more specific.` });
        }

        // 2. Get weather from Nubila based on analysis
        const weatherData = await getNubilaWeather(analysis.latitude, analysis.longitude, analysis.requestType);
        
        // 3. Generate thoughtful and sweet advice using LLM
        const friendlyAdvice = await generateLLMWeatherAdvice(
            weatherData, 
            analysis.locationName, 
            analysis.requestType,
            query
        );

        // 4. Send enhanced response back to frontend
        res.json({
            ok: true,
            requestDetails: analysis,
            weatherData: weatherData,
            friendlyAdvice: friendlyAdvice
        });

    } catch (error) {
        console.error("Error processing weather request:", error);
        // Send specific error message back to frontend
        res.status(500).json({ ok: false, message: error.message || "An internal server error occurred." });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});