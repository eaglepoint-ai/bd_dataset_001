import { reactive } from 'vue';
import type { Toast } from '../types/toast';

interface ToastState {
    toasts: Toast[];
}

const state = reactive<ToastState>({
    toasts: [],
});

export const toastStore = {
    get toasts() {
        return state.toasts;
    },

    addToast(toast: Toast) {
        state.toasts.push(toast);
    },

    removeToast(id: string) {
        const index = state.toasts.findIndex((t) => t.id === id);
        if (index !== -1) {
            state.toasts.splice(index, 1);
        }
    },
};
