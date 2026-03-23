import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const FAVORITES_KEY = 'weather_favorites'
const BLOCKS_KEY = 'weather_blocks'
const MAX_BLOCKS = 5
const MAX_FAVORITES = 5

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) ?? []
  } catch {
    return []
  }
}

let _globalNextId = 1

function loadBlocks() {
  try {
    const saved = JSON.parse(localStorage.getItem(BLOCKS_KEY))
    if (saved && saved.length > 0) {
      _globalNextId = Math.max(...saved.map(b => b.id)) + 1
      return saved
    }
  } catch {}
  return [createBlock(_globalNextId++)]
}

function createBlock(id, city = '') {
  return { id, city, mode: 'day' }
}

export const useWeatherStore = defineStore('weather', () => {
  const blocks = ref(loadBlocks())
  const favorites = ref(loadFavorites())
  const language = ref('en')
  const theme = ref('light')

  watch(favorites, (val) => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(val))
  }, { deep: true })

  watch(blocks, (val) => {
    localStorage.setItem(BLOCKS_KEY, JSON.stringify(val))
  }, { deep: true })

  function addBlock(city = '') {
    if (blocks.value.length >= MAX_BLOCKS) return null
    const id = _globalNextId++
    blocks.value.push(createBlock(id, city))
    return id
  }

  function removeBlock(id) {
    blocks.value = blocks.value.filter((b) => b.id !== id)
  }

  function setBlockCity(id, city) {
    const block = blocks.value.find((b) => b.id === id)
    if (block) block.city = city
  }

  function setBlockMode(id, mode) {
    const block = blocks.value.find((b) => b.id === id)
    if (block) block.mode = mode
  }

  function isFavorite(city) {
    return favorites.value.some((f) => f.toLowerCase() === city.toLowerCase())
  }

  function addFavorite(city) {
    if (isFavorite(city)) return 'already'
    if (favorites.value.length >= MAX_FAVORITES) return 'limit'
    favorites.value.push(city)
    return 'added'
  }

  function removeFavorite(city) {
    favorites.value = favorites.value.filter(
      (f) => f.toLowerCase() !== city.toLowerCase()
    )
  }

  function toggleFavorite(city) {
    if (isFavorite(city)) {
      removeFavorite(city)
      return 'removed'
    }
    return addFavorite(city)
  }

  function setLanguage(lang) {
    language.value = lang
  }

  function setTheme(t) {
    theme.value = t
  }

  return {
    blocks,
    favorites,
    language,
    theme,
    MAX_BLOCKS,
    MAX_FAVORITES,
    addBlock,
    removeBlock,
    setBlockCity,
    setBlockMode,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    setLanguage,
    setTheme,
  }
})
