<script setup>
import { ref, computed, watch } from 'vue'
import { useWeatherStore } from './store/weatherStore.js'
import AppTabs from './components/AppTabs.vue'
import WeatherWidget from './components/WeatherWidget.vue'
import BaseModal from './components/BaseModal.vue'
import CityAutocomplete from './components/CityAutocomplete.vue'

const store = useWeatherStore()

watch(() => store.theme, (theme) => {
  if (theme === 'dark') document.body.setAttribute('data-theme', 'dark')
  else document.body.removeAttribute('data-theme')
}, { immediate: true })

const activeTab = ref('main')
const showBlockLimitModal = ref(false)

const tabs = computed(() => [
  { key: 'main',      label: store.language === 'uk' ? 'Головна'  : 'Main' },
  { key: 'favorites', label: store.language === 'uk' ? 'Обране'   : 'Favorites' },
])

const langOptions = [
  { value: 'en', label: 'EN' },
  { value: 'uk', label: 'UK' },
]

const showAddModal = ref(false)
const modalCityQuery = ref('')
const modalCityGeo = ref(null)

function addBlock() {
  if (store.blocks.length >= store.MAX_BLOCKS) {
    showBlockLimitModal.value = true
    return
  }
  modalCityQuery.value = ''
  modalCityGeo.value = null
  showAddModal.value = true
}

function confirmAddBlock() {
  if (modalCityGeo.value) {
    store.addBlock(modalCityGeo.value.name)
    showAddModal.value = false
  }
}

function onModalCityUpdate() {
  modalCityGeo.value = null
}

const blockLimitText = computed(() =>
  store.language === 'uk'
    ? { title: 'Ліміт блоків', body: 'Максимум 5 блоків погоди.', close: 'Зрозуміло' }
    : { title: 'Block limit reached', body: 'You can have a maximum of 5 weather blocks.', close: 'Got it' }
)
</script>

<template>
  <div class="app">
    <header class="app__header">
      <div class="app__logo-wrap">
        <svg class="app__logo-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="sun-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#FFD95A"/>
              <stop offset="100%" stop-color="#FF9520"/>
            </radialGradient>
            <linearGradient id="cloud-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ffffff"/>
              <stop offset="100%" stop-color="#dce8f5"/>
            </linearGradient>
          </defs>

          <g stroke="#FFB830" stroke-width="2" stroke-linecap="round">
            <line x1="20" y1="4"  x2="20" y2="7"/>
            <line x1="20" y1="28" x2="20" y2="25" opacity=".35"/>
            <line x1="4"  y1="16" x2="7"  y2="16"/>
            <line x1="33" y1="16" x2="36" y2="16" opacity=".35"/>
            <line x1="8.3"  y1="7.3"  x2="10.4" y2="9.4"/>
            <line x1="29.6" y1="22.6" x2="31.7" y2="24.7" opacity=".35"/>
            <line x1="31.7" y1="7.3"  x2="29.6" y2="9.4" opacity=".5"/>
            <line x1="8.3"  y1="24.7" x2="10.4" y2="22.6" opacity=".2"/>
          </g>
          <circle cx="20" cy="16" r="9" fill="url(#sun-grad)"/>
          <path d="M38 33a6 6 0 0 0-6-6 5.97 5.97 0 0 0-1.1.1A7 7 0 0 0 18 30a5 5 0 0 0 0 10h20a4 4 0 0 0 0-8z" fill="url(#cloud-grad)" filter="drop-shadow(0 2px 4px rgba(0,0,0,.12))"/>
        </svg>
        <span class="app__logo-text">WeatherApp</span>
      </div>

      <div class="app__controls">
        <div class="app__lang-toggle">
          <button
            v-for="opt in langOptions"
            :key="opt.value"
            class="app__lang-btn"
            :class="{ 'app__lang-btn--active': store.language === opt.value }"
            @click="store.setLanguage(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </header>

    <main class="app__main">
      <AppTabs v-model="activeTab" :tabs="tabs" class="app__tabs" />


      <section v-if="activeTab === 'main'" class="app__section">
        <div class="app__content-wrapper">
          <div class="app__grid">
            <WeatherWidget
              v-for="block in store.blocks"
              :key="block.id"
              mode="main"
              :block-id="block.id"
            />
          </div>

          <div class="app__add-row">
            <button
              class="app__add-btn"
              :disabled="store.blocks.length >= store.MAX_BLOCKS"
              :title="store.language === 'uk' ? 'Додати блок' : 'Add block'"
              @click="addBlock"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              <span>{{ store.language === 'uk' ? 'Додати місто' : 'Add city' }}</span>
            </button>

            <span class="app__block-count">
              {{ store.blocks.length }} / {{ store.MAX_BLOCKS }}
            </span>
          </div>
        </div>
      </section>


      <section v-else class="app__section">
        <div class="app__content-wrapper">
          <div v-if="store.favorites.length" class="app__grid">
            <WeatherWidget
              v-for="city in store.favorites"
              :key="city"
              mode="favorites"
              :city="city"
            />
          </div>

          <div v-else class="app__empty">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" opacity=".2">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
            <p>{{ store.language === 'uk' ? 'Збережених міст немає' : 'No favorite cities yet' }}</p>
          </div>
        </div>
      </section>
    </main>

    <BaseModal
      v-if="showBlockLimitModal"
      :title="blockLimitText.title"
      :confirm-label="blockLimitText.close"
      :cancel-label="blockLimitText.close"
      @confirm="showBlockLimitModal = false"
      @cancel="showBlockLimitModal = false"
    >
      {{ blockLimitText.body }}
    </BaseModal>
    <!-- Modals -->
    <BaseModal
      v-if="showAddModal"
      :title="store.language === 'uk' ? 'Додати нове місто' : 'Add new city'"
      :confirm-label="store.language === 'uk' ? 'Додати' : 'Add'"
      :cancel-label="store.language === 'uk' ? 'Скасувати' : 'Cancel'"
      :confirm-disabled="!modalCityGeo"
      @confirm="confirmAddBlock"
      @cancel="showAddModal = false"
    >
      <div class="app__modal-body">
        <label class="app__modal-label">
          {{ store.language === 'uk' ? 'Оберіть місто для нового віджета:' : 'Select a city for the new widget:' }}
        </label>
        <CityAutocomplete
          v-model="modalCityQuery"
          :lang="store.language"
          class="app__modal-autocomplete"
          @select="geo => modalCityGeo = geo"
          @update:modelValue="onModalCityUpdate"
        />
      </div>
    </BaseModal>
  </div>
</template>

<style lang="scss">
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --app-bg: #f3f5f9;
  --app-surface: #ffffff;
  --app-surface-elevated: #ffffff;
  --app-input-bg: #f8fafc;
  --app-input-border: #e2e8f0;
  --app-text: #1a1d23;
  --app-text-muted: #828a99;
  --app-accent: #6b70ff;
  --app-border: #e8eaf2;
  --app-tab-bg: #eceff5;
  --app-tab-color: #6b7280;
  --app-tab-active-bg: #ffffff;
  --app-tab-active-color: #1a1d23;
}

body[data-theme="dark"] {
  --app-bg: #0f1423;
  --app-surface: #1e2235;
  --app-surface-elevated: #292f45;
  --app-input-bg: #151829;
  --app-input-border: #3b425d;
  --app-text: #f8fafc;
  --app-text-muted: #94a3b8;
  --app-accent: #818cf8;
  --app-border: #2b314e;
  --app-tab-bg: #151a2d;
  --app-tab-color: #94a3b8;
  --app-tab-active-bg: #1e2235;
  --app-tab-active-color: #818cf8;
  color-scheme: dark;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: var(--app-bg);
  color: var(--app-text);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
</style>

<style lang="scss" scoped>
.app {
  max-width: 1200px;
  min-width: 360px;
  margin: 0 auto;
  padding: 24px 16px 48px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin-bottom: 28px;

    @media (max-width: 550px) {
      justify-content: space-between;
    }
  }

  &__logo-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__logo-icon {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
  }

  &__logo-text {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--app-text);
    letter-spacing: -0.02em;
  }

  &__controls {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);

    @media (max-width: 550px) {
      position: static;
      transform: none;
    }
  }

  &__lang-toggle {
    display: flex;
    gap: 2px;
    background: var(--app-tab-bg);
    border-radius: 8px;
    padding: 3px;
  }

  &__lang-btn {
    padding: 4px 12px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--app-text-muted);
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: 0.04em;
    transition: background 0.15s, color 0.15s;

    &--active {
      background: var(--app-tab-active-bg);
      color: var(--app-accent);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    }
  }

  &__tabs {
    margin-bottom: 0;
    position: relative;
    z-index: 2;
  }

  &__section {
    display: flex;
    flex-direction: column;
    width: 100%;
    background: var(--app-surface);
    border: 1px solid var(--app-border);
    border-radius: 0 16px 16px 16px;
    padding: 32px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.02);
    position: relative;
    z-index: 1;

    @media (max-width: 640px) {
      padding: 16px;
      border-radius: 12px;
    }
  }

  &__content-wrapper {
    display: flex;
    flex-direction: column;
    gap: 24px;
    width: 100%;
  }

  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    width: 100%;

    > * {
      flex: 1 1 360px;
      min-width: 0;
    }

    @media (max-width: 640px) {
      flex-direction: column;
    }
  }

  &__add-row {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  &__add-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border: 1px dashed #d1d5db;
    border-radius: 12px;
    background: transparent;
    color: var(--app-text-muted);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s, background 0.2s;

    &:hover:not(:disabled) {
      background: rgba(0,0,0,0.02);
      border-color: #9ca3af;
      color: var(--app-text);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &__block-count {
    font-size: 0.8rem;
    color: var(--app-text-muted);
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 64px 24px;
    color: var(--app-text-muted);
    text-align: center;

    p { font-size: 0.95rem; }
  }
}
</style>
