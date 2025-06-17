const queryInput = document.getElementById('queryInput');
const getWeatherBtn = document.getElementById('getWeatherBtn');
const resultsDiv = document.getElementById('results');
const errorDiv = document.getElementById('error');
const loadingDiv = document.getElementById('loading');
const promptSuggestionsDiv = document.getElementById('promptSuggestions');

// --- Event Listeners ---
getWeatherBtn.addEventListener('click', fetchWeather);
queryInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        fetchWeather();
    }
});

promptSuggestionsDiv.addEventListener('click', (event) => {
    if (event.target.classList.contains('prompt-btn')) {
        queryInput.value = event.target.textContent; // Set input value
        fetchWeather(); // Trigger fetch
    }
});

async function fetchWeather() {
    const query = queryInput.value.trim();
    if (!query) {
        showError("Please enter a location or query.");
        return;
    }

    resultsDiv.innerHTML = '';
    resultsDiv.style.display = 'none';
    hideError();
    showLoading();

    try {
        const response = await fetch('/api/weather-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: query }),
        });

        const result = await response.json();
        hideLoading();

        if (!response.ok || result.ok === false) {
            showError(result.message || `An error occurred (Status: ${response.status})`);
            return;
        }

        // Success! Display the data
        resultsDiv.style.display = 'block';
        displayWeatherData(result);

    } catch (err) {
        console.error("Fetch error:", err);
        hideLoading();
        showError('Failed to connect to the server or an unexpected error occurred.');
    }
}

function showLoading() {
    loadingDiv.style.display = 'block';
}

function hideLoading() {
    loadingDiv.style.display = 'none';
}

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    resultsDiv.innerHTML = ''; 
    resultsDiv.style.display = 'none';
}

function hideError() {
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
}

function getIconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// --- Data Display Function ---
function displayWeatherData(result) {
    resultsDiv.innerHTML = '';

    const { requestDetails, weatherData } = result;

    // const thoughtfulResponse = document.createElement('div');
    // thoughtfulResponse.className = 'card thoughtful-response';
    // thoughtfulResponse.innerHTML = `
        
    //         ${result.friendlyAdvice.split('\n\n').map(section => {
    //             const lines = section.split('\n');
    //             const heading = lines[0];
    //             const details = lines.slice(1).map(line => `<p>${line}</p>`).join('');
    //             return `<h3>${heading}</h3>${details}`;
    //         }).join('')}
        

    // `;
    const thoughtfulResponse = document.createElement('div');
    thoughtfulResponse.className = 'card thoughtful-response';
    thoughtfulResponse.innerHTML = `
        
            ${result.friendlyAdvice.split('\n').map(advice => `<p>${advice}</p>`).join('')}
        

    `;

    resultsDiv.appendChild(thoughtfulResponse);

    const toolCallCard = document.createElement('div');
    toolCallCard.className = 'card tool-call-card';

    const simulatedFunctionName = requestDetails.requestType === 'forecast'
        ? 'get_weather_forecast'
        : 'get_current_weather';

    const simulatedArguments = `{\n  "latitude": ${requestDetails.latitude?.toFixed(4) || 'null'},\n  "longitude": ${requestDetails.longitude?.toFixed(4) || 'null'}\n}`;

    toolCallCard.innerHTML = `
        <h2><i class="fas fa-cogs"></i> LLM Tool Call Simulation</h2>
        <p>To fulfill your request, the Language Model (like Gaia) conceptually performs a "tool call". Based on its analysis, it decided to use the following tool:</p>
        <p><strong>Tool/Function Name:</strong> <code>${simulatedFunctionName}</code></p>
        <p><strong>With Arguments:</strong></p>
        <pre><code>${simulatedArguments}</code></pre>
        <p><em>Our backend then uses this information to call the appropriate Nubila Weather API endpoint.</em></p>
    `;

    if (requestDetails.latitude !== null && requestDetails.longitude !== null) {
       resultsDiv.appendChild(toolCallCard);
    }

    const interpretationCard = document.createElement('div');
    interpretationCard.className = 'card interpretation-card';
    interpretationCard.innerHTML = `
        <h2><i class="fas fa-brain"></i> Interpreted Request</h2>
        <p><strong>Query:</strong> ${queryInput.value}</p>
        <p><strong>Location:</strong> ${requestDetails.locationName || 'N/A'}</p>
        <p><strong>Coordinates:</strong> Lat: ${requestDetails.latitude?.toFixed(4) || 'N/A'}, Lon: ${requestDetails.longitude?.toFixed(4) || 'N/A'}</p>
        <p><strong>Request Type:</strong> ${requestDetails.requestType || 'N/A'}</p>
    `;
    resultsDiv.appendChild(interpretationCard);

    

    // Check Nubila's response structure (Keep this block as is)
    if (!weatherData || weatherData.ok === false) {
         // Don't call showError here as it clears resultsDiv, just display the error message
         const nubilaErrorDiv = document.createElement('div');
         nubilaErrorDiv.className = 'status-message error-message';
         nubilaErrorDiv.style.marginTop = '20px';
         nubilaErrorDiv.textContent = `Nubila API Error: ${weatherData?.message || 'Failed to fetch details from Nubila.'}`;
         resultsDiv.appendChild(nubilaErrorDiv); // Append error after interpretation/tool card
         return; // Stop further processing
    }

    // Display Current Weather or Forecast

    // ** CURRENT WEATHER **
    if (requestDetails.requestType === 'current' && weatherData.data && typeof weatherData.data === 'object' && !Array.isArray(weatherData.data)) {
        const current = weatherData.data;
        const currentCard = document.createElement('div');
        currentCard.className = 'card current-weather-card';
        currentCard.innerHTML = `
            <h2><i class="fas fa-map-marker-alt"></i> Current Weather in ${current.location_name || requestDetails.locationName}</h2>
            <p class="temperature">${current.temperature?.toFixed(1)}°C</p>
            <p class="condition">
                ${current.condition || ''} (${current.condition_desc || ''})
                ${current.condition_icon ? `<img src="${getIconUrl(current.condition_icon)}" alt="${current.condition_desc || ''}">` : ''}
            </p>
            <p><strong>Feels Like:</strong> ${current.feels_like?.toFixed(1)}°C</p>
            <p><strong>Min/Max:</strong> ${current.temperature_min?.toFixed(1)}°C / ${current.temperature_max?.toFixed(1)}°C</p>
            <p><strong>Humidity:</strong> ${current.humidity}%</p>
            <p><strong>Pressure:</strong> ${current.pressure} hPa</p>
            <p><strong>Wind:</strong> ${current.wind_speed?.toFixed(1)} m/s from ${current.wind_direction}°</p>
            <p><strong>UV Index:</strong> ${current.uv ?? 'N/A'}</p>
            <p><strong>Rain (1h):</strong> ${current.rain ?? 0} mm</p>
            <p><strong>Elevation:</strong> ${current.elevation} m</p>
            <p><strong>Timestamp:</strong> ${new Date(current.timestamp * 1000).toLocaleString()}</p>
        `;
        resultsDiv.appendChild(currentCard);

    // ** FORECAST WEATHER **
    } else if (requestDetails.requestType === 'forecast' && weatherData.data && Array.isArray(weatherData.data)) {
        const forecastSection = document.createElement('div');
        forecastSection.className = 'card forecast-section';
        forecastSection.innerHTML = `<h2><i class="fas fa-calendar-alt"></i> Forecast for ${weatherData.data[0]?.location_name || requestDetails.locationName}</h2>`;

        if (weatherData.data.length > 0) {
            const groupedForecasts = groupForecastsByDay(weatherData.data);
            const forecastContainer = document.createElement('div');

            for (const day in groupedForecasts) {
                const dayHeader = document.createElement('h3');
                dayHeader.className = 'forecast-day-header';
                dayHeader.textContent = day;
                forecastContainer.appendChild(dayHeader);

                const dayGrid = document.createElement('div');
                dayGrid.className = 'forecast-grid';

                groupedForecasts[day].forEach(forecast => {
                    const forecastItem = document.createElement('div');
                    forecastItem.className = 'forecast-item';
                    const forecastDate = new Date(forecast.timestamp * 1000);

                    forecastItem.innerHTML = `
                        <p class="time">${forecastDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                        <p class="temp">${forecast.temperature?.toFixed(1)}°C</p>
                        <div class="condition">
                           ${forecast.condition_icon ? `<img src="${getIconUrl(forecast.condition_icon)}" alt="${forecast.condition_desc || ''}">` : ''}
                           <span>${forecast.condition || ''}</span>
                        </div>
                        <p><i class="fas fa-tint" title="Humidity"></i> ${forecast.humidity}%</p>
                        <p><i class="fas fa-wind" title="Wind Speed"></i> ${forecast.wind_speed?.toFixed(1)} m/s</p>
                        <p title="Feels Like">${forecast.feels_like?.toFixed(1)}°C</p>
                    `;
                    dayGrid.appendChild(forecastItem);
                });
                forecastContainer.appendChild(dayGrid);
            }
            forecastSection.appendChild(forecastContainer);

        } else {
            forecastSection.innerHTML += `<p>No forecast data available.</p>`;
        }
        resultsDiv.appendChild(forecastSection);

    } else if (weatherData.message && !weatherData.data) {
         // This case handles Nubila API errors when NO weather/forecast data section was added
         // It might be redundant given the check in #3, but safe to keep.
         const nubilaErrorDiv = document.createElement('div');
         nubilaErrorDiv.className = 'status-message error-message';
         nubilaErrorDiv.style.marginTop = '20px';
         nubilaErrorDiv.textContent = `Nubila API Error: ${weatherData.message}`;
         resultsDiv.appendChild(nubilaErrorDiv);

    } else if (!weatherData.message) { // Only show this generic error if no specific Nubila error was found earlier
        // Handle cases where the type doesn't match the data structure AFTER the specific checks
         const fallbackErrorDiv = document.createElement('div');
         fallbackErrorDiv.className = 'status-message error-message';
         fallbackErrorDiv.style.marginTop = '20px';
         fallbackErrorDiv.textContent = `Received unexpected data format from Nubila.`;
         resultsDiv.appendChild(fallbackErrorDiv);
         console.warn("Unhandled Nubila data format:", weatherData);
    }
}

// --- Utility function to group forecasts by day ---
function groupForecastsByDay(forecastList) {
    const groups = {};
    const today = new Date();
    today.setHours(0,0,0,0); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

    forecastList.forEach(forecast => {
        const date = new Date(forecast.timestamp * 1000);
        date.setHours(0,0,0,0); // Get start of the forecast day

        let dayLabel;
        if (date.getTime() === today.getTime()) {
            dayLabel = "Today";
        } else if (date.getTime() === tomorrow.getTime()) {
            dayLabel = "Tomorrow";
        } else {
            dayLabel = date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
        }

        if (!groups[dayLabel]) {
            groups[dayLabel] = [];
        }
        groups[dayLabel].push(forecast);
    });
    return groups;
}