import { toastStore } from '../store/toastStore';
import type { ToastType, ToastOptions, Toast } from '../types/toast';

export const useToast = () => {
    const show = (options: ToastOptions) => {
        const id = Math.random().toString(36).substring(2, 9);
        const toast: Toast = {
            id,
            message: options.message,
            type: options.type || 'info',
            duration: options.duration !== undefined ? options.duration : 3000,
            position: options.position || 'top-right',
        };

        toastStore.addToast(toast);

        if (toast.duration && toast.duration > 0) {
            setTimeout(() => {
                dismiss(id);
            }, toast.duration);
        }

        return id;
    };

    const success = (message: string, duration?: number) => show({ message, type: 'success', duration });
    const error = (message: string, duration?: number) => show({ message, type: 'error', duration });
    const warn = (message: string, duration?: number) => show({ message, type: 'warning', duration });
    const info = (message: string, duration?: number) => show({ message, type: 'info', duration });

    const dismiss = (id: string) => {
        toastStore.removeToast(id);
    };

    return {
        show,
        success,
        error,
        warn,
        info,
        dismiss,
    };
};
