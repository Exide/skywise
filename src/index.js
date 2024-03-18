const GEOCODE_API_KEY = '65f72560cc5c4741478354siac76dcb';

const PLACEHOLDER_OPTIONS = [
    'Portland, OR',
    'Hana, HI',
    'Area 51',
    'Monument Valley',
    'Salton Sea',
    'Savannah Historic District',
    'Napa Valley',
    'Key West',
    'Kenai Fjords National Park',
    'Great Salt Lake',
    'Acadia National Park',
    'The Breakers, Newport',
    'Charleston, South Carolina',
]

document.addEventListener('DOMContentLoaded', await initialize);

async function initialize() {
    const input = document.getElementById('place');
    input.placeholder = `e.g. ${selectPlaceholder()}`;

    const form = document.getElementById('place-search');
    form.addEventListener('submit', onSubmit);
}

function selectPlaceholder() {
    const index = Math.floor(Math.random() * PLACEHOLDER_OPTIONS.length);
    return PLACEHOLDER_OPTIONS[index];
}

function clear() {
    const error = document.getElementById('error');
    if (error) error.remove();

    const weatherNow = document.getElementById('weather-now');
    if (weatherNow) weatherNow.remove();

    const weatherForecasts = document.getElementsByClassName('weather-forecast');
    Array.from(weatherForecasts).forEach(e => e.remove());
}

/**
 * @param {MouseEvent} event
 */
async function onSubmit(event) {
    event.preventDefault();
    clear();

    const input = document.getElementById('place');

    /** @type {{ lat:number, lon:number }[]} */
    const places = await request(`https://geocode.maps.co/search?q=${input.value}&api_key=${GEOCODE_API_KEY}`);
    if (!places || places.length === 0) {
        renderError('We couldn\'t find that place.');
        return;
    }

    const place = {
        name: places[0].display_name,
        latitude: places[0].lat,
        longitude: places[0].lon
    };

    /** @type {{ properties:{ forecastHourly:string, observationStations:string } }} */
    const point = await request(`https://api.weather.gov/points/${place.latitude},${place.longitude}`);
    if (!point) {
        renderError('We couldn\'t find weather data for that place.');
        return;
    }

    /** @type {{ features:[{ id }] }} */
    const stations = await request(point.properties.observationStations);
    if (!stations) {
        renderError('We couldn\'t find any weather stations for that place.');
        return;
    }

    const station = {
        url: stations.features[0].id,
        id: stations.features[0].properties.stationIdentifier,
        name: stations.features[0].properties.name
    };

    /** @type {{ WeatherObservation }} */
    const observation = await request(`${station.url}/observations/latest`);
    if (!observation) {
        renderError('We couldn\'t find any recent weather observations from the station at your place.')
        return;
    }

    const currentWeather = {
        timestamp: new Date(observation.properties.timestamp),
        description: observation.properties.textDescription,
        temperature: observation.properties.temperature.value
    }

    renderCurrentWeather(place, station, currentWeather);

    /** @type {{ WeatherForecast }} */
    const forecast = await request(point.properties.forecastHourly);
    if (!forecast) {
        renderError('We couldn\`t forecast the weather for your place.');
        return
    }

    forecast.properties.periods
        .map(p => ({
            start: new Date(p.startTime),
            stop: new Date(p.endTime),
            daytime: p.isDaytime,
            temperature: p.temperature,
            description: p.shortForecast
        }))
        .forEach(renderForecast);
}

async function request(url) {
    const sanitizedURL = encodeURI(url);
    const response = await fetch(sanitizedURL);
    console.debug(`GET ${sanitizedURL}`);
    if (response.ok) return response.json();
}

/**
 * @param {string} message
 */
function renderError(message) {
    const error = document.getElementById('error');
    if (error) error.remove();

    const p = document.createElement('p');
    p.id = 'error';
    p.classList.add('error');
    p.textContent = message;

    const footer = document.getElementsByTagName('footer').item(0);
    footer.insertAdjacentElement('beforebegin', p);
}

function renderCurrentWeather(place, station, weather) {
    const weatherNowElement = document.createElement('div');
    weatherNowElement.id = 'weather-now';

    const placeElement = document.createElement('div');
    placeElement.classList.add('place');
    placeElement.textContent = place.name;
    weatherNowElement.append(placeElement);

    const stationElement = document.createElement('div');
    stationElement.classList.add('station');
    stationElement.textContent = `${station.id} at ${station.name}`;
    weatherNowElement.append(stationElement);

    const timestampElement = document.createElement('div');
    timestampElement.classList.add('timestamp');
    timestampElement.textContent = weather.timestamp;
    weatherNowElement.append(timestampElement);

    const temperatureElement = document.createElement('div');
    temperatureElement.classList.add('temperature');
    temperatureElement.textContent = `${celsiusToFahrenheit(weather.temperature)} °F`
    weatherNowElement.append(temperatureElement);

    const descriptionElement = document.createElement('div');
    descriptionElement.classList.add('description');
    descriptionElement.textContent = weather.description;
    weatherNowElement.append(descriptionElement);

    const footer = document.getElementsByTagName('footer').item(0);
    footer.insertAdjacentElement('beforebegin', weatherNowElement);
}

function renderForecast(forecast) {
    const weatherForecastElement = document.createElement('div');
    weatherForecastElement.id = `${forecast.start.getTime()}`;
    weatherForecastElement.classList.add('weather-forecast');
    weatherForecastElement.classList.add(forecast.daytime ? 'day' : 'night')

    const timeElement = document.createElement('div');
    timeElement.classList.add('time');
    let timeString = forecast.start.toLocaleTimeString('en-US', { hour: 'numeric' });
    if (forecast.start.getHours() === 0) {
        const date = forecast.start.toLocaleDateString('en-US', { weekday: 'long' });
        timeString = `${timeString} (${date})`;
    }
    timeElement.textContent = timeString
    weatherForecastElement.append(timeElement);

    const descriptionElement = document.createElement('div');
    descriptionElement.classList.add('description');
    descriptionElement.textContent = forecast.description;
    weatherForecastElement.append(descriptionElement);

    const temperatureElement = document.createElement('div');
    temperatureElement.classList.add('temperature');
    temperatureElement.textContent = `${forecast.temperature} °F`;
    weatherForecastElement.append(temperatureElement);

    const footer = document.getElementsByTagName('footer').item(0);
    footer.insertAdjacentElement('beforebegin', weatherForecastElement);
}

function celsiusToFahrenheit(temp) {
    return Math.round((temp * 9/5) + 32);
}
