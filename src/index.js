const GEOCODE_API_KEY = 'this needs to be populated';

const PLACEHOLDER_OPTIONS = [
    "Portland, OR",
    "Great Blue Hole",
    "Hana, HI",
    "Area 51"
]

document.addEventListener('DOMContentLoaded', await initialize);

async function initialize() {
    const input = document.getElementById('place');
    input.placeholder = selectPlaceholder();

    const form = document.getElementById('place-search');
    form.addEventListener('submit', onSubmit);
}

function selectPlaceholder() {
    const index = Math.floor(Math.random() * PLACEHOLDER_OPTIONS.length);
    return PLACEHOLDER_OPTIONS[index];
}

/**
 * @param {MouseEvent} event
 */
async function onSubmit(event) {
    event.preventDefault();

    const input = document.getElementById('place');

    /** @type {{ lat:number, lon:number }[]} */
    const places = await request(`https://geocode.maps.co/search?q=${input.value}&api_key=${GEOCODE_API_KEY}`);
    if (!places) {
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
        timestamp: observation.properties.timestamp,
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

    const hourlyPeriods = forecast.properties.periods;
    const hourlyPeriodsByDay = Object.groupBy(hourlyPeriods, period => period.startTime.substring(0, 10));

    renderForecast(hourlyPeriodsByDay);
}

async function request(url) {
    const sanitizedURL = encodeURI(url);
    const response = await fetch(sanitizedURL);
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
    const currentElement = document.createElement('div');
    currentElement.id = 'weather-current';

    const placeElement = document.createElement('div');
    placeElement.textContent = place.name;
    currentElement.append(placeElement);

    const stationElement = document.createElement('div');
    stationElement.textContent = `Station: ${station.id} at ${station.name}`;
    currentElement.append(stationElement);

    const temperatureElement = document.createElement('div');
    temperatureElement.textContent = weather.temperature
    currentElement.append(temperatureElement);

    const footer = document.getElementsByTagName('footer').item(0);
    footer.insertAdjacentElement('beforebegin', currentElement);
}

function renderForecast(data) {
    const div = document.createElement('div');
    div.textContent = JSON.stringify(data, null, 2);

    const footer = document.getElementsByTagName('footer').item(0);
    footer.insertAdjacentElement('beforebegin', div);
}
