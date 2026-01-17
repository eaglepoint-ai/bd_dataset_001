import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toastStore } from '@/store/toastStore';
import { useToast } from '@/composables/useToast';
import { mount } from '@vue/test-utils';
import ToastContainer from '@/components/ToastContainer.vue';
import ToastItem from '@/components/ToastItem.vue';

describe('Toast Notification System', () => {
    beforeEach(() => {
        // Clear toasts before each test
        while (toastStore.toasts.length > 0) {
            toastStore.removeToast(toastStore.toasts[0].id);
        }
    });

    describe('Requirement 1: TypeScript Interface & Types', () => {
        it('should create a toast with correct properties and unique ID', () => {
            const { show } = useToast();
            const id = show({
                message: 'Test Message',
                type: 'success',
                duration: 5000,
                position: 'top-right'
            });

            const toast = toastStore.toasts.find(t => t.id === id);
            expect(toast).toBeDefined();
            expect(toast?.message).toBe('Test Message');
            expect(toast?.type).toBe('success');
            expect(toast?.duration).toBe(5000);
            expect(toast?.position).toBe('top-right');
            expect(typeof toast?.id).toBe('string');
        });
    });

    describe('Requirement 2: Reactive Store & useToast Composable', () => {
        it('should manage an array of active toasts reactively with variant helpers', () => {
            const { success, error, info, warn } = useToast();

            success('Success');
            error('Error');
            info('Info');
            warn('Warning');

            expect(toastStore.toasts.length).toBe(4);
            expect(toastStore.toasts[0].type).toBe('success');
            expect(toastStore.toasts[1].type).toBe('error');
            expect(toastStore.toasts[2].type).toBe('info');
            expect(toastStore.toasts[3].type).toBe('warning');
        });

        it('should dismiss a toast manually using the dismiss method', () => {
            const { show, dismiss } = useToast();
            const id = show({ message: 'Dismiss Me' });

            expect(toastStore.toasts.length).toBe(1);
            dismiss(id);
            expect(toastStore.toasts.length).toBe(0);
        });
    });

    describe('Requirement 3: ToastContainer rendering & Transitions', () => {
        it('should render ToastContainer and display toasts based on position', async () => {
            const { show } = useToast();
            show({ message: 'Top Center Toast', position: 'top-center' });

            const wrapper = mount(ToastContainer);
            await wrapper.vm.$nextTick();

            const container = wrapper.find('.pos-top-center');
            expect(container.exists()).toBe(true);
            expect(wrapper.findComponent(ToastItem).exists()).toBe(true);
            expect(wrapper.text()).toContain('Top Center Toast');
        });
    });

    describe('Requirement 4: Automatic Dismissal', () => {
        it('should automatically dismiss toast after custom duration', () => {
            vi.useFakeTimers();
            const { show } = useToast();
            show({ message: 'Auto Dismiss', duration: 1500 });
            expect(toastStore.toasts.length).toBe(1);
            vi.advanceTimersByTime(1500);
            expect(toastStore.toasts.length).toBe(0);
            vi.useRealTimers();
        });

        it('should use default duration of 3000ms if not specified', () => {
            vi.useFakeTimers();
            const { info } = useToast();
            info('Default Duration');
            expect(toastStore.toasts.length).toBe(1);
            vi.advanceTimersByTime(2999);
            expect(toastStore.toasts.length).toBe(1);
            vi.advanceTimersByTime(1);
            expect(toastStore.toasts.length).toBe(0);
            vi.useRealTimers();
        });
    });

    describe('Aesthetics & UI Components (Bonus Reqs)', () => {
        it('should handle stacking of multiple toasts in different positions simultaneously', async () => {
            const { show } = useToast();
            show({ message: 'Top Right', position: 'top-right' });
            show({ message: 'Bottom Center', position: 'bottom-center' });

            const wrapper = mount(ToastContainer);
            await wrapper.vm.$nextTick();

            expect(wrapper.findAll('.toast-item').length).toBe(2);
            expect(wrapper.find('.pos-top-right').exists()).toBe(true);
            expect(wrapper.find('.pos-bottom-center').exists()).toBe(true);
        });

        it('should apply correct CSS classes and include progress bar', () => {
            const toast = { id: '1', message: 'Visual Test', type: 'error' as const, duration: 3000 };
            const wrapper = mount(ToastItem, {
                props: { toast }
            });

            expect(wrapper.classes()).toContain('toast-error');
            expect(wrapper.find('.toast-progress-bar').exists()).toBe(true);
            expect(wrapper.find('.toast-icon').exists()).toBe(true);
        });
    });
});
