<script setup>
defineProps({
  modelValue: { type: String, required: true },
  tabs: { type: Array, required: true },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <nav class="app-tabs" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="app-tabs__tab"
      :class="{ 'app-tabs__tab--active': modelValue === tab.key }"
      role="tab"
      :aria-selected="modelValue === tab.key"
      @click="$emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>

<style lang="scss" scoped>
.app-tabs {
  display: flex;
  justify-content: flex-start;
  gap: 4px;
  width: 100%;

  &__tab {
    padding: 12px 32px;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 12px 12px 0 0;
    background: transparent;
    color: var(--app-tab-color, #6b7280);
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
    position: relative;
    top: 1px;

    &:hover:not(&--active) {
      background: rgba(120, 120, 120, 0.1);
    }

    &--active {
      background: var(--app-surface, #ffffff);
      color: var(--app-accent, #6b70ff);
      border-color: var(--app-border, #eef0f6);
      border-style: solid;
      border-width: 1px 1px 0 1px;
      z-index: 1;
    }
  }
}
</style>
