<script setup>
import { ref, computed } from 'vue'
import { fetchCitySuggestions } from '../utils/api.js'
import { debounce } from '../utils/debounce.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  lang: { type: String, default: 'en' },
  readonly: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'select'])

const query = ref(props.modelValue)
const suggestions = ref([])
const isOpen = ref(false)
const loading = ref(false)
const activeIndex = ref(-1)
const rootEl = ref(null)

const hasSuggestions = computed(() => suggestions.value.length > 0)

const search = debounce(async (val) => {
  if (!val || val.length < 2) {
    suggestions.value = []
    isOpen.value = false
    return
  }
  loading.value = true
  try {
    const { data } = await fetchCitySuggestions(val, props.lang)
    suggestions.value = data
    isOpen.value = data.length > 0
    activeIndex.value = -1
  } catch {
    suggestions.value = []
  } finally {
    loading.value = false
  }
}, 350)

function onInput(e) {
  query.value = e.target.value
  emit('update:modelValue', query.value)
  search(query.value)
}

function selectCity(city) {
  const label = buildLabel(city)
  query.value = label
  emit('update:modelValue', label)
  emit('select', city)
  close()
}

function onKeydown(e) {
  if (!isOpen.value) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, suggestions.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (e.key === 'Enter' && activeIndex.value >= 0) {
    e.preventDefault()
    selectCity(suggestions.value[activeIndex.value])
  } else if (e.key === 'Escape') {
    close()
  }
}

function close() {
  suggestions.value = []
  isOpen.value = false
  activeIndex.value = -1
}

function onClickOutside(e) {
  if (rootEl.value && !rootEl.value.contains(e.target)) {
    close()
  }
}

function buildLabel(city) {
  return [city.name, city.state, city.country].filter(Boolean).join(', ')
}

import { onMounted, onBeforeUnmount } from 'vue'

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div class="city-autocomplete" ref="rootEl">
    <div class="city-autocomplete__field">
      <input
        class="city-autocomplete__input"
        type="text"
        :value="query"
        :readonly="readonly"
        :placeholder="readonly ? '' : (lang === 'uk' ? 'Пошук міста...' : 'Search city...')"
        autocomplete="off"
        @input="onInput"
        @keydown="onKeydown"
      />
      <span v-if="loading" class="city-autocomplete__spinner" />
    </div>

    <ul v-if="isOpen && hasSuggestions" class="city-autocomplete__dropdown" role="listbox">
      <li
        v-for="(city, i) in suggestions"
        :key="`${city.lat}-${city.lon}`"
        class="city-autocomplete__option"
        :class="{ 'city-autocomplete__option--active': i === activeIndex }"
        role="option"
        @mousedown.prevent="selectCity(city)"
      >
        {{ buildLabel(city) }}
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.city-autocomplete {
  position: relative;
  width: 100%;

  &__field {
    position: relative;
    display: flex;
    align-items: center;
  }

  &__input {
    width: 100%;
    padding: 14px 40px 14px 18px;
    border: 1px solid var(--color-border, var(--app-input-border));
    border-radius: 12px;
    background: var(--color-input-bg, var(--app-input-bg));
    color: var(--color-text, var(--app-text));
    font-size: 1rem;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
    outline: none;
    transition: border-color 0.2s, background 0.2s;

    &:focus {
      border-color: var(--color-accent, var(--app-accent));
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05), 0 0 0 3px rgba(107, 112, 255, 0.15);
    }

    &[readonly] {
      cursor: default;
      background: var(--color-input-bg-readonly, var(--app-surface));
    }
  }

  &__spinner {
    position: absolute;
    right: 12px;
    width: 16px;
    height: 16px;
    border: 2px solid var(--color-border, var(--app-border));
    border-top-color: var(--color-accent, var(--app-accent));
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  &__dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 100;
    margin: 0;
    padding: 6px 0;
    list-style: none;
    background: var(--color-surface, var(--app-surface-elevated));
    border: 1px solid var(--color-border, var(--app-border));
    border-radius: 10px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    overflow: hidden;
  }

  &__option {
    padding: 10px 14px;
    font-size: 0.9rem;
    color: var(--color-text, var(--app-text));
    cursor: pointer;
    transition: background 0.15s;

    &:hover,
    &--active {
      background: var(--color-hover, var(--app-border));
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
