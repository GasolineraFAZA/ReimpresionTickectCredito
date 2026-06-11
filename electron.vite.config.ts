import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { config } from 'dotenv'

// Carga el .env antes del build para que los valores
// queden COMPILADOS dentro del ejecutable
config()

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: {
      // Estos valores se hornean dentro del .exe al compilar
      'process.env.API_BASE_URL':        JSON.stringify(process.env.API_BASE_URL        ?? ''),
      'process.env.API_KEY_HEADER_NAME':  JSON.stringify(process.env.API_KEY_HEADER_NAME  ?? 'ApiKey'),
      'process.env.API_KEY_HEADER_VALUE': JSON.stringify(process.env.API_KEY_HEADER_VALUE ?? ''),
      'process.env.ERPFAZA_SERVER':       JSON.stringify(process.env.ERPFAZA_SERVER       ?? ''),
      'process.env.ERPFAZA_DATABASE':     JSON.stringify(process.env.ERPFAZA_DATABASE     ?? 'ERPFaza'),
      'process.env.ERPFAZA_USER':         JSON.stringify(process.env.ERPFAZA_USER         ?? ''),
      'process.env.ERPFAZA_PASSWORD':     JSON.stringify(process.env.ERPFAZA_PASSWORD     ?? ''),
      'process.env.CRYPTO_SALT':          JSON.stringify(process.env.CRYPTO_SALT          ?? ''),
      'process.env.CRYPTO_IV':            JSON.stringify(process.env.CRYPTO_IV            ?? ''),
      'process.env.CRYPTO_PASSWORD':      JSON.stringify(process.env.CRYPTO_PASSWORD      ?? ''),
      'process.env.AUTH_USUARIO':         JSON.stringify(process.env.AUTH_USUARIO         ?? ''),
      'process.env.AUTH_PASSWORD':        JSON.stringify(process.env.AUTH_PASSWORD        ?? ''),
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [
      react(),
      tailwindcss()
    ]
  }
})
