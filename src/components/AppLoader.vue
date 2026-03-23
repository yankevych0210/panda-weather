<script setup>
defineProps({
  label: { type: String, default: '' },
})
</script>

<template>
  <div class="app-loader" role="status" :aria-label="label || 'Loading'">
    <div class="app-loader__ring">
      <span /><span /><span /><span />
    </div>
    <p v-if="label" class="app-loader__label">{{ label }}</p>
  </div>
</template>

<style lang="scss" scoped>
.app-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;

  &__ring {
    position: relative;
    width: 44px;
    height: 44px;

    span {
      position: absolute;
      inset: 0;
      border: 3px solid transparent;
      border-top-color: var(--color-accent);
      border-radius: 50%;
      animation: loader-spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite;

      &:nth-child(1) { animation-delay: -0.45s; }
      &:nth-child(2) { animation-delay: -0.3s;  }
      &:nth-child(3) { animation-delay: -0.15s; }
    }
  }

  &__label {
    margin: 0;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    letter-spacing: 0.02em;
  }
}

@keyframes loader-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
