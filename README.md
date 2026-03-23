# WeatherApp

A Vue 3 weather application built as a technical assignment. Displays current and 5-day forecasts for up to 5 cities simultaneously with favorites, localization, and day/night theming.

## Tech Stack

| Tool | Purpose |
|---|---|
| Vue 3 + `<script setup>` | UI & Composition API |
| Vite | Build tool & dev server |
| Pinia | State management (blocks, favorites, language) |
| Axios | HTTP requests |
| Chart.js (vanilla) | Temperature charts |
| SCSS (scoped, BEM) | Styling — no CSS frameworks |
| OpenWeatherMap API | Weather + geocoding data |

## Project Structure

```
src/
├── main.js
├── App.vue                       # Layout shell, tabs, + button
├── store/
│   └── weatherStore.js           # Pinia store
├── components/
│   ├── AppTabs.vue               # Main / Favorites tab switcher
│   ├── WeatherWidget.vue         # Core weather block
│   ├── CityAutocomplete.vue      # Debounced city search input
│   ├── WeatherChart.vue          # Vanilla Chart.js wrapper
│   ├── BaseModal.vue             # Reusable confirmation modal
│   └── AppLoader.vue             # Spinner preloader
└── utils/
    ├── api.js                    # Axios instances + helper functions
    └── debounce.js               # Vanilla debounce (no lodash)
```

## Getting Started

### 1. Get an API key

Create a free account at [openweathermap.org](https://openweathermap.org/api) and copy your key.

### 2. Configure environment

```bash
cp .env .env.local
```

Edit `.env.local`:

```env
VITE_OWM_KEY=your_api_key_here
```

### 3. Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Features

- **IP geolocation** — auto-detects city on first load via `get.geojs.io`
- **Multi-block layout** — add up to 5 city blocks via the `+` button
- **City autocomplete** — debounced search against OWM Geocoding API (no lodash)
- **Day / 5-day toggle** — switches between current weather and a 5-day forecast; weekly averages are calculated from 3-hour chunks using `reduce`
- **Chart.js line chart** — hourly or daily temperature, updates reactively via watchers, instance destroyed `onBeforeUnmount`
- **Favorites** — star any city, saved to `localStorage` via Pinia; max 5
- **Global Day/Night theme** — the entire application smoothly transitions between light and dark modes based on the core weather (OWM icon code `01d` vs `01n`) of the primary widget
- **Localization** — EN / UK toggle; language passed to OWM API for translated descriptions
- **Modals** — delete block confirmation, favorites limit warning

## Build for Production

```bash
npm run build
```

Output in `dist/`.
