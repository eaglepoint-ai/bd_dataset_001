<script setup lang="ts">
import { computed } from 'vue';
import { toastStore } from '../store/toastStore';
import ToastItem from './ToastItem.vue';
import type { ToastPosition } from '../types/toast';

const toasts = computed(() => toastStore.toasts);

const removeToast = (id: string) => {
  toastStore.removeToast(id);
};

const groupedToasts = computed(() => {
  const groups: Record<ToastPosition, any[]> = {
    'top-right': [],
    'top-left': [],
    'top-center': [],
    'bottom-right': [],
    'bottom-left': [],
    'bottom-center': []
  };

  toasts.value.forEach(toast => {
    const pos = toast.position || 'top-right';
    groups[pos].push(toast);
  });

  return groups;
});

const positions = ['top-right', 'top-left', 'top-center', 'bottom-right', 'bottom-left', 'bottom-center'] as ToastPosition[];
</script>

<template>
  <div v-for="pos in positions" :key="pos" :class="['toast-container-wrapper', `pos-${pos}`, { 'has-toasts': groupedToasts[pos].length > 0 }]">
    <TransitionGroup :name="pos.includes('top') ? 'toast-top' : 'toast-bottom'">
      <ToastItem 
        v-for="toast in groupedToasts[pos]" 
        :key="toast.id" 
        :toast="toast"
        @dismiss="removeToast"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container-wrapper {
  position: fixed;
  z-index: 10000;
  padding: 24px;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.3s ease;
}

.pos-top-right { top: 0; right: 0; align-items: flex-end; }
.pos-top-left { top: 0; left: 0; align-items: flex-start; }
.pos-top-center { top: 0; left: 50%; transform: translateX(-50%); align-items: center; }
.pos-bottom-right { bottom: 0; right: 0; align-items: flex-end; flex-direction: column-reverse; }
.pos-bottom-left { bottom: 0; left: 0; align-items: flex-start; flex-direction: column-reverse; }
.pos-bottom-center { bottom: 0; left: 50%; transform: translateX(-50%); align-items: center; flex-direction: column-reverse; }

/* Top Transitions */
.toast-top-enter-active,
.toast-top-leave-active {
  transition: all 0.4s cubic-bezier(0.21, 1.02, 0.73, 1);
}

.toast-top-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

.toast-top-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Bottom Transitions */
.toast-bottom-enter-active,
.toast-bottom-leave-active {
  transition: all 0.4s cubic-bezier(0.21, 1.02, 0.73, 1);
}

.toast-bottom-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

.toast-bottom-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.toast-top-move,
.toast-bottom-move {
  transition: transform 0.4s cubic-bezier(0.21, 1.02, 0.73, 1);
}
</style>
