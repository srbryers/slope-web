import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://slope.dev',
  trailingSlash: 'never',
  vite: {
    plugins: [tailwindcss()],
  },
});
