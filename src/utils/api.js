import axios from 'axios'

const OWM_KEY = import.meta.env.VITE_OWM_KEY

export const geoApi = axios.create({
  baseURL: 'https://api.openweathermap.org/geo/1.0',
})

export const weatherApi = axios.create({
  baseURL: 'https://api.openweathermap.org/data/2.5',
})


;[geoApi, weatherApi].forEach((instance) => {
  instance.interceptors.request.use((config) => {
    config.params = { appid: OWM_KEY, units: 'metric', ...config.params }
    return config
  })
})

export const ipapiClient = axios.create({
  baseURL: 'https://get.geojs.io/v1/ip/geo.json',
})



export function fetchCitySuggestions(query, lang = 'en') {
  return geoApi.get('/direct', {
    params: { q: query, limit: 5, lang },
  })
}

export function fetchCurrentWeather(lat, lon, lang = 'en') {
  return weatherApi.get('/weather', { params: { lat, lon, lang } })
}

export function fetchForecast(lat, lon, lang = 'en') {
  return weatherApi.get('/forecast', { params: { lat, lon, lang } })
}

export function fetchLocationByIp() {
  return ipapiClient.get('')
}
