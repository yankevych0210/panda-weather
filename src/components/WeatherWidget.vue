<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useWeatherStore } from '../store/weatherStore.js'
import {
  fetchCurrentWeather,
  fetchForecast,
  fetchLocationByIp,
  fetchCitySuggestions,
} from '../utils/api.js'
import CityAutocomplete from './CityAutocomplete.vue'
import WeatherChart from './WeatherChart.vue'
import AppLoader from './AppLoader.vue'
import BaseModal from './BaseModal.vue'

const props = defineProps({
  mode: { type: String, default: 'main' },
  blockId: { type: Number, default: null },
  city: { type: String, default: '' },
})

const store = useWeatherStore()

const cityName = ref(props.city || '')
const coords = ref(null)
const viewMode = ref('day')
const weather = ref(null)
const forecast = ref(null)
const loading = ref(false)
const showDeleteModal = ref(false)
const showLimitModal = ref(false)


const isNight = computed(() => {
  const icon = weather.value?.weather?.[0]?.icon ?? ''
  return icon.endsWith('n')
})

const isFav = computed(() => store.isFavorite(cityName.value))

const lang = computed(() => store.language)

const ui = computed(() => TRANSLATIONS[lang.value] ?? TRANSLATIONS.en)

const chartData = computed(() =>
  viewMode.value === 'day' ? buildDayChart() : buildWeekChart()
)


function buildDayChart() {
  if (!forecast.value) return { labels: [], datasets: [] }
  const today = new Date().toISOString().slice(0, 10)
  let items = forecast.value.list.filter((i) => i.dt_txt.startsWith(today))
  if (!items.length) items = forecast.value.list.slice(0, 8)
  return {
    labels: items.map((i) => i.dt_txt.slice(11, 16)),
    datasets: [{ label: '°C', data: items.map((i) => i.main.temp), ...lineStyle() }],
  }
}

function buildWeekChart() {
  if (!forecast.value) return { labels: [], datasets: [] }
  const byDay = forecast.value.list.reduce((acc, item) => {
    const day = item.dt_txt.slice(0, 10)
    ;(acc[day] ??= []).push(item.main.temp)
    return acc
  }, {})
  const days = Object.keys(byDay)
  const avgs = days.map((day) => {
    const arr = byDay[day]
    return +(arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1)
  })
  return {
    labels: days.map(formatDayLabel),
    datasets: [{ label: '°C', data: avgs, ...lineStyle() }],
  }
}

function lineStyle() {
  return {
    borderColor: 'var(--color-accent)',
    backgroundColor: 'rgba(99,102,241,0.14)',
    fill: true,
    tension: 0.4,
    pointRadius: 4,
    pointBackgroundColor: 'var(--color-accent)',
    pointHoverRadius: 6,
  }
}

function formatDayLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString(
    lang.value === 'uk' ? 'uk-UA' : 'en-US',
    { weekday: 'short', month: 'short', day: 'numeric' }
  )
}


async function fetchWeather() {
  if (!coords.value) return
  loading.value = true
  try {
    const [cur, fore] = await Promise.all([
      fetchCurrentWeather(coords.value.lat, coords.value.lon, lang.value),
      fetchForecast(coords.value.lat, coords.value.lon, lang.value),
    ])
    weather.value = cur.data
    forecast.value = fore.data
  } catch (err) {
    console.error('Weather fetch error:', err)
  } finally {
    loading.value = false
  }
}

async function resolveCity(name) {
  const { data } = await fetchCitySuggestions(name, lang.value)
  return data?.[0] ?? null
}

async function detectByIp() {
  try {
    const { data } = await fetchLocationByIp()
    if (!data?.city) return
    const geo = await resolveCity(data.city)
    if (geo) applyGeo(geo)
  } catch (err) {
    console.error('IP detection failed:', err)
  }
}


function applyGeo(geo) {
  cityName.value = geo.name
  coords.value = { lat: geo.lat, lon: geo.lon }
  if (props.mode === 'main' && props.blockId !== null) {
    store.setBlockCity(props.blockId, geo.name)
  }
  fetchWeather()
}

function onCitySelect(geo) {
  applyGeo(geo)
}

function setViewMode(mode) {
  viewMode.value = mode
  if (props.mode === 'main' && props.blockId !== null) {
    store.setBlockMode(props.blockId, mode)
  }
}

function toggleFavorite() {
  if (!cityName.value) return
  const result = store.toggleFavorite(cityName.value)
  if (result === 'limit') showLimitModal.value = true
}

function confirmDelete() {
  store.removeBlock(props.blockId)
  showDeleteModal.value = false
}


onMounted(async () => {
  if (props.mode === 'favorites' && props.city) {
    const geo = await resolveCity(props.city).catch(() => null)
    if (geo) {
      coords.value = { lat: geo.lat, lon: geo.lon }
      cityName.value = geo.name
      await fetchWeather()
    }
    return
  }

  const block = store.blocks.find((b) => b.id === props.blockId)
  if (block?.mode) viewMode.value = block.mode

  if (block?.city) {
    const geo = await resolveCity(block.city).catch(() => null)
    if (geo) {
      coords.value = { lat: geo.lat, lon: geo.lon }
      cityName.value = geo.name
      await fetchWeather()
    }
  } else if (props.blockId === store.blocks[0]?.id) {
    await detectByIp()
  }
})

watch(lang, () => {
  if (coords.value) fetchWeather()
})

watch(isNight, (val) => {
  if (props.mode === 'main' && props.blockId === store.blocks[0]?.id) {
    store.setTheme(val ? 'dark' : 'light')
  }
})

const TRANSLATIONS = {
  en: {
    today: 'Today',
    week: '5 Days',
    humidity: 'Humidity',
    wind: 'Wind',
    feelsLike: 'Feels like',
    loading: 'Loading weather...',
    addFav: 'Add to favorites',
    removeFav: 'Remove from favorites',
    deleteTitle: 'Remove block',
    deleteBody: 'Are you sure you want to remove this weather block?',
    confirmDelete: 'Remove',
    cancel: 'Cancel',
    limitTitle: 'Favorites limit reached',
    limitBody: 'Please remove a city to add a new one. Max 5 allowed.',
    close: 'Got it',
  },
  uk: {
    today: 'Сьогодні',
    week: '5 днів',
    humidity: 'Вологість',
    wind: 'Вітер',
    feelsLike: 'Відчувається',
    loading: 'Завантаження...',
    addFav: 'Додати до обраного',
    removeFav: 'Вилучити з обраного',
    deleteTitle: 'Видалити блок',
    deleteBody: 'Ви впевнені, що хочете видалити цей блок?',
    confirmDelete: 'Видалити',
    cancel: 'Скасувати',
    limitTitle: 'Ліміт обраного',
    limitBody: 'Видаліть місто, щоб додати нове. Максимум 5.',
    close: 'Зрозуміло',
  },
}
</script>

<template>
  <div
    class="widget"
    :class="{
      'widget--night': isNight,
      'widget--favorites': mode === 'favorites',
    }"
  >

    <div class="widget__header">
      <CityAutocomplete
        v-model="cityName"
        :lang="lang"
        :readonly="mode === 'favorites'"
        class="widget__autocomplete"
        @select="onCitySelect"
      />

      <div class="widget__actions">
        <button
          class="widget__icon-btn widget__icon-btn--star"
          :class="{ 'widget__icon-btn--active': isFav }"
          :title="isFav ? ui.removeFav : ui.addFav"
          @click="toggleFavorite"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </button>

        <button
          v-if="mode === 'main'"
          class="widget__icon-btn widget__icon-btn--delete"
          :title="ui.deleteTitle"
          @click="showDeleteModal = true"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>
    </div>


    <div class="widget__tabs-container">
      <div class="widget__toggle">
      <button
        class="widget__toggle-btn"
        :class="{ 'widget__toggle-btn--active': viewMode === 'day' }"
        @click="setViewMode('day')"
      >
        {{ ui.today }}
      </button>
      <button
        class="widget__toggle-btn"
        :class="{ 'widget__toggle-btn--active': viewMode === 'week' }"
        @click="setViewMode('week')"
      >
        {{ ui.week }}
      </button>
    </div>


    <div class="widget__body">
      <AppLoader v-if="loading" :label="ui.loading" />

      <template v-else-if="weather">
        <div class="widget__info">
          <div class="widget__main-temp">
            <img
              class="widget__icon"
              :src="`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`"
              :alt="weather.weather[0].description"
            />
            <span class="widget__temp">{{ Math.round(weather.main.temp) }}°C</span>
          </div>

          <div class="widget__details">
            <p class="widget__city-name">{{ weather.name }}, {{ weather.sys.country }}</p>
            <p class="widget__condition">{{ weather.weather[0].description }}</p>
            <ul class="widget__meta">
              <li class="widget__meta-item">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7zm0 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg>
                {{ ui.feelsLike }}: {{ Math.round(weather.main.feels_like) }}°C
              </li>
              <li class="widget__meta-item">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v15.86zm2 0V4.07c3.95.49 7 3.85 7 7.93s-3.05 7.44-7 7.93z"/></svg>
                {{ ui.humidity }}: {{ weather.main.humidity }}%
              </li>
              <li class="widget__meta-item">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M14.5 17c0 1.65-1.35 3-3 3s-3-1.35-3-3h2c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1H2v-2h9.5c1.65 0 3 1.35 3 3zM19 6.5C19 4.57 17.43 3 15.5 3S12 4.57 12 6.5h2c0-.83.67-1.5 1.5-1.5S17 5.67 17 6.5 16.33 8 15.5 8H2v2h13.5C17.43 10 19 8.43 19 6.5zm-2 5.5H2v2h15c.83 0 1.5.67 1.5 1.5S15.83 16 15 16v2c1.93 0 3.5-1.57 3.5-3.5S18.93 12 17 12z"/></svg>
                {{ ui.wind }}: {{ weather.wind.speed }} m/s
              </li>
            </ul>
          </div>
        </div>
      </template>

      <div v-else class="widget__empty">—</div>
    </div>
    </div>


    <div class="widget__chart">
      <WeatherChart v-if="!loading && forecast" :chart-data="chartData" :is-night="isNight" />
    </div>


    <BaseModal
      v-if="showDeleteModal"
      :title="ui.deleteTitle"
      :confirm-label="ui.confirmDelete"
      :cancel-label="ui.cancel"
      danger
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    >
      {{ ui.deleteBody }}
    </BaseModal>

    <BaseModal
      v-if="showLimitModal"
      :title="ui.limitTitle"
      :confirm-label="ui.close"
      :cancel-label="ui.cancel"
      @confirm="showLimitModal = false"
      @cancel="showLimitModal = false"
    >
      {{ ui.limitBody }}
    </BaseModal>
  </div>
</template>

<style lang="scss" scoped>
.widget {
  --color-surface:   #ffffff;
  --color-border:    #eef0f6;
  --color-text:      #1a1d23;
  --color-text-muted: #828a99;
  --color-accent:    #6b70ff;
  --color-hover:     #f8fafc;
  --color-input-bg:  #f8fafc;
  --color-input-bg-readonly: #f1f5f9;
  --color-toggle-bg: #f3f5f9;
  --color-toggle-active-bg: #6b70ff;
  --color-toggle-active-text: #ffffff;
  --color-btn-secondary: rgba(0,0,0,0.06);
}

.widget--night {
  --color-surface:   linear-gradient(145deg, #2b314e, #1a1e35);
  --color-border:    rgba(255, 255, 255, 0.05);
  --color-text:      #f8fafc;
  --color-text-muted: #94a3b8;
  --color-accent:    #818cf8;
  --color-hover:     rgba(255, 255, 255, 0.06);
  --color-input-bg:  rgba(15, 23, 42, 0.4);
  --color-input-bg-readonly: rgba(15, 23, 42, 0.2);
  --color-toggle-bg: rgba(15, 23, 42, 0.5);
  --color-toggle-active-bg: #818cf8;
  --color-toggle-active-text: #0f1221;
  --color-btn-secondary: rgba(255,255,255,0.06);
}

.widget {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.02);
  transition: background 0.3s, border-color 0.3s;

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__autocomplete {
    flex: 1;
    min-width: 0;
  }

  &__actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  &__icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: color 0.2s, background 0.2s, border-color 0.2s;

    &:hover { background: var(--color-hover); }

    &--star {
      &:hover { color: #f59e0b; border-color: #f59e0b; }
    }

    &--star#{&}--active {
      color: #f59e0b;
      border-color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
    }

    &--delete {
      &:hover { color: #e0442b; border-color: #e0442b; }
    }
  }

  &__tabs-container {
    display: flex;
    flex-direction: column;
  }

  &__toggle {
    display: flex;
    gap: 4px;
    background: transparent;
    padding: 0 16px;
    width: fit-content;
    margin-bottom: -1px;
    position: relative;
    z-index: 2;
  }

  &__toggle-btn {
    padding: 8px 24px;
    border: 1px solid transparent;
    border-bottom: 1px solid transparent;
    border-radius: 16px 16px 0 0;
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;

    &:hover:not(&--active) {
      background: var(--color-hover);
    }

    &--active {
      background: var(--color-surface);
      color: var(--color-accent);
      border: 1px solid var(--color-accent);
      border-bottom-color: var(--color-surface);
    }
  }

  &__body {
    min-height: 110px;
    display: flex;
    align-items: flex-start;
    border: 1px solid var(--color-accent);
    border-radius: 0 12px 12px 12px;
    padding: 20px;
    position: relative;
    z-index: 1;
  }

  &__info {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    width: 100%;
  }

  &__main-temp {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
  }

  &__icon {
    width: 64px;
    height: 64px;
    object-fit: contain;
  }

  &__temp {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text);
    line-height: 1;
    margin-top: -6px;
  }

  &__details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__city-name {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__condition {
    margin: 0;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    text-transform: capitalize;
  }

  &__meta {
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__meta-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.82rem;
    color: var(--color-text-muted);

    svg { flex-shrink: 0; opacity: 0.7; }
  }

  &__empty {
    color: var(--color-text-muted);
    font-size: 1.5rem;
    margin: auto;
    opacity: 0.3;
  }

  &__chart {
    margin-top: 16px;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 16px;
    min-width: 0;
    overflow: hidden;
  }
}
</style>
