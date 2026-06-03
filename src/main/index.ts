import { app, shell, BrowserWindow } from 'electron'
import { closeAllConnections } from './db/connection'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerHandlers } from './ipc/handlers'
import log from 'electron-log'
import { updateElectronApp } from 'update-electron-app'

log.initialize()
log.info('[Main] Iniciando aplicación')

// En desarrollo, el API local usa certificado autofirmado de .NET.
// NODE_TLS_REJECT_UNAUTHORIZED=0 evita el error "self-signed certificate".
// En producción esto NO se aplica (is.dev es false).
if (is.dev) {
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
  log.warn('[Main] TLS verification desactivada (solo desarrollo)')
}

function createWindow(): BrowserWindow {
 const mainWindow = new BrowserWindow({
    width: 560,
    height: 310,
    show: false,
    resizable: false,
        frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    log.info('[Main] Ventana lista')
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.reimpresion.tickets')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Registrar todos los handlers IPC
  registerHandlers()

  createWindow()

  // Auto-updater
  if (!is.dev) {
    updateElectronApp({
      updateInterval: '1 hour',
      logger: log
    })
    log.info('[Main] Auto-updater iniciado')
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', async () => {
  await closeAllConnections()
})