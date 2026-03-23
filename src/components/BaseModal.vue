<script setup>
import { onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' },
  cancelLabel: { type: String, default: 'Cancel' },
  danger: { type: Boolean, default: false },
  confirmDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])

function onKeydown(e) {
  if (e.key === 'Escape') emit('cancel')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div class="modal" role="dialog" aria-modal="true" @click.self="$emit('cancel')">
      <div class="modal__card">
        <header v-if="title" class="modal__header">
          <h3 class="modal__title">{{ title }}</h3>
        </header>

        <div class="modal__body">
          <slot />
        </div>

        <footer class="modal__footer">
          <button
            class="modal__btn modal__btn--cancel"
            type="button"
            @click="$emit('cancel')"
          >
            {{ cancelLabel }}
          </button>
          <button
            class="modal__btn"
            :class="{ 'modal__btn--danger': danger }"
            type="button"
            :disabled="confirmDisabled"
            @click="$emit('confirm')"
          >
            {{ confirmLabel }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  animation: modal-fade-in 0.18s ease;

  &__card {
    width: 100%;
    max-width: 420px;
    margin: 16px;
    background: var(--app-surface, #ffffff);
    color: var(--app-text, #1a1d23);
    border-radius: 20px;
    border: 1px solid var(--color-border, var(--app-border));
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
    animation: modal-slide-up 0.2s ease;
  }

  &__header {
    padding: 20px 24px 0;
  }

  &__title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--app-text);
  }

  &__body {
    padding: 16px 24px 20px;
    font-size: 0.9rem;
    color: var(--app-text-muted);
    line-height: 1.6;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 0 24px 20px;
  }

  &__btn {
    padding: 10px 24px;
    border: 1px solid transparent;
    border-radius: 12px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
    background: var(--app-accent, #6b70ff);
    color: #fff;

    &:hover { opacity: 0.88; }
    &:active { transform: scale(0.97); }

    &--cancel {
      background: transparent;
      border: 1px solid var(--color-border, var(--app-border));
      color: var(--app-text, #1a1d23);

      &:hover {
        background: var(--color-hover, rgba(120, 120, 120, 0.1));
      }
    }

    &--danger {
      background: #e0442b;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
  }
}

@keyframes modal-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes modal-slide-up {
  from { transform: translateY(16px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
</style>
