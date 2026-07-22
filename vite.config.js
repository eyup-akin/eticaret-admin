import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    // host: true → Vite'ı sadece localhost'ta değil, ağdaki TÜM
    // adreslerde dinlet (0.0.0.0). Backend'de de aynısını yapmıştın.
    // Böylece telefon http://192.168.1.103:5173 ile panele ulaşabilir.
    host: true,
  },
})