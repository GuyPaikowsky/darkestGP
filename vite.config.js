import { defineConfig } from 'vite';

export default defineConfig({
  // keep three out of dep pre-bundling so the addons and core share one instance
  optimizeDeps: { exclude: ['three'] },
});
