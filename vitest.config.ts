import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // Vitest stubs CSS imports (also `?raw`) unless included; the token test reads the real file.
    css: { include: [/tokens\.css/] },
  },
})
