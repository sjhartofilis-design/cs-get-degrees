/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    // Claude Code worktrees live under .claude/; without this their copies of the tests run too.
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
  },
})
