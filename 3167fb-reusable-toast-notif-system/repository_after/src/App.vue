<script setup lang="ts">
import { useToast } from './composables/useToast';
import ToastContainer from './components/ToastContainer.vue';

const { success, error, warn, info, show } = useToast();

const triggerSuccess = () => success('Settings saved successfully!');
const triggerError = () => error('Failed to sync data with the server.');
const triggerWarning = () => warn('Your subscription expires in 3 days.');
const triggerInfo = () => info('New update available. Click to refresh.');

const triggerCustom = () => {
  show({
    message: 'Look at this beautiful bottom-center toast!',
    type: 'success',
    duration: 5000,
    position: 'bottom-center'
  });
};

const triggerCenter = () => {
  show({
    message: 'A professional alert in the center.',
    type: 'info',
    duration: 4000,
    position: 'top-center'
  });
};
</script>

<template>
  <div class="app-container">
    

    <main class="content">
      <section class="hero">
        <h1>Premium Notifications for Vue 3</h1>
        <p>A lightweight, accessible, and stunning toast system built with Composition API and TypeScript.</p>
      </section>

      <section class="demo-grid">
        <div class="card">
          <h3>Standard Variants</h3>
          <p>The core notification types with unique icons and colors.</p>
          <div class="button-stack">
            <button @click="triggerSuccess" class="btn btn-success">
              <span class="btn-icon">✓</span> Success
            </button>
            <button @click="triggerError" class="btn btn-error">
              <span class="btn-icon">✕</span> Error
            </button>
            <button @click="triggerWarning" class="btn btn-warning">
              <span class="btn-icon">!</span> Warning
            </button>
            <button @click="triggerInfo" class="btn btn-info">
              <span class="btn-icon">i</span> Info
            </button>
          </div>
        </div>

        <div class="card">
          <h3>Viewport Control</h3>
          <p>Display toasts anywhere on the screen with perfect alignment.</p>
          <div class="button-stack">
            <button @click="triggerCenter" class="btn btn-outline">Top Center</button>
            <button @click="triggerCustom" class="btn btn-outline">Bottom Center</button>
            <button @click="success('Right side is standard!')" class="btn btn-outline">Top Right</button>
          </div>
        </div>
      </section>
    </main>

    <ToastContainer />
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --primary: #6366f1;
  --bg-color: #f8fafc;
  --card-bg: #ffffff;
  --text-main: #1e293b;
  --text-muted: #64748b;
  --success: #10b981;
  --error: #ef4444;
  --warning: #f59e0b;
  --info: #3b82f6;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: var(--bg-color);
  color: var(--text-main);
  line-height: 1.5;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  padding: 1.5rem 2rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--primary);
}

.content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 4rem 2rem;
  width: 100%;
}

.hero {
  text-align: center;
  margin-bottom: 4rem;
}

.hero h1 {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero p {
  font-size: 1.25rem;
  color: var(--text-muted);
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.card {
  background: var(--card-bg);
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.card h3 {
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.card p {
  color: var(--text-muted);
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.button-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.btn:active {
  transform: scale(0.98);
}

.btn-success { background: var(--success); color: white; }
.btn-success:hover { background: #059669; }

.btn-error { background: var(--error); color: white; }
.btn-error:hover { background: #dc2626; }

.btn-warning { background: var(--warning); color: white; }
.btn-warning:hover { background: #d97706; }

.btn-info { background: var(--info); color: white; }
.btn-info:hover { background: #2563eb; }

.btn-outline {
  background: transparent;
  border: 1px solid #e2e8f0;
  color: var(--text-main);
}
.btn-outline:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.btn-icon {
  font-size: 1.125rem;
}
</style>
