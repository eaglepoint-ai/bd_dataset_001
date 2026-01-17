<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { Toast } from '../types/toast';

const props = defineProps<{
  toast: Toast;
}>();

const emit = defineEmits<{
  (e: 'dismiss', id: string): void;
}>();

const progress = ref(100);
const startTime = Date.now();
const duration = props.toast.duration || 3000;
let timer: number | null = null;

const typeConfig = computed(() => {
  switch (props.toast.type) {
    case 'success':
      return {
        class: 'toast-success',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" /></svg>`
      };
    case 'error':
      return {
        class: 'toast-error',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clip-rule="evenodd" /></svg>`
      };
    case 'warning':
      return {
        class: 'toast-warning',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.401 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" /></svg>`
      };
    case 'info':
    default:
      return {
        class: 'toast-info',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" /></svg>`
      };
  }
});

const updateProgress = () => {
  const elapsed = Date.now() - startTime;
  progress.value = Math.max(0, 100 - (elapsed / duration) * 100);
  if (progress.value > 0) {
    timer = requestAnimationFrame(updateProgress);
  }
};

onMounted(() => {
  if (duration > 0) {
    timer = requestAnimationFrame(updateProgress);
  }
});

onUnmounted(() => {
  if (timer) cancelAnimationFrame(timer);
});

const dismiss = () => {
  emit('dismiss', props.toast.id);
};
</script>

<template>
  <div :class="['toast-item', typeConfig.class]" role="alert">
    <div class="toast-body">
      <div class="toast-icon" v-html="typeConfig.icon"></div>
      <div class="toast-content">
        <span class="toast-message">{{ toast.message }}</span>
      </div>
      <button class="toast-close" @click="dismiss" aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <div v-if="duration > 0" class="toast-progress-container">
      <div class="toast-progress-bar" :style="{ width: progress + '%' }"></div>
    </div>
  </div>
</template>

<style scoped>
.toast-item {
  position: relative;
  pointer-events: auto;
  min-width: 320px;
  max-width: 450px;
  margin-bottom: 12px;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.toast-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.toast-body {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 12px;
}

.toast-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

.toast-content {
  flex-grow: 1;
}

.toast-message {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  color: #1f2937;
}

.toast-close {
  flex-shrink: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  color: #6b7280;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-close:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #111827;
}

/* Progress Bar */
.toast-progress-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: rgba(0, 0, 0, 0.05);
}

.toast-progress-bar {
  height: 100%;
  transition: width 0.1s linear;
}

/* Variant Styles */
.toast-success {
  background-color: rgba(236, 253, 245, 0.85);
  border-left: 4px solid #10b981;
}
.toast-success .toast-icon { color: #10b981; }
.toast-success .toast-progress-bar { background-color: #10b981; }

.toast-error {
  background-color: rgba(254, 242, 242, 0.85);
  border-left: 4px solid #ef4444;
}
.toast-error .toast-icon { color: #ef4444; }
.toast-error .toast-progress-bar { background-color: #ef4444; }

.toast-warning {
  background-color: rgba(255, 251, 235, 0.85);
  border-left: 4px solid #f59e0b;
}
.toast-warning .toast-icon { color: #f59e0b; }
.toast-warning .toast-progress-bar { background-color: #f59e0b; }

.toast-info {
  background-color: rgba(239, 246, 255, 0.85);
  border-left: 4px solid #3b82f6;
}
.toast-info .toast-icon { color: #3b82f6; }
.toast-info .toast-progress-bar { background-color: #3b82f6; }
</style>
