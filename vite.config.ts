import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // supabase/functions runs on Deno (`deno test`), not Vitest.
    exclude: ['node_modules', 'supabase/**'],
  },
})
