import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://getslope.dev',
  trailingSlash: 'never',
  vite: {
    plugins: [tailwindcss()],
  },
});
