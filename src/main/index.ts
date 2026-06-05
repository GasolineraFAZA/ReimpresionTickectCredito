import 'dotenv/config'
import { app, shell, BrowserWindow } from 'electron'
import { closeAllConnections } from './db/connection'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerHandlers } from './ipc/handlers'
import log from 'electron-log'
import { autoUpdater } from 'electron-updater'

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
    width: 600,
    height: 480,
    show: false,
    resizable: false,
        frame: false,
    autoHideMenuBar: true,
    icon,
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
    autoUpdater.logger = log
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true

    autoUpdater.on('update-available', (info) => {
      log.info(`[Updater] Nueva versión disponible: ${info.version}`)
    })

    autoUpdater.on('update-downloaded', () => {
      log.info('[Updater] Actualización descargada — se instalará al cerrar')
      const { dialog } = require('electron')
      dialog.showMessageBox({
        type:    'info',
        title:   'Actualización disponible',
        message: 'Hay una nueva versión disponible. ¿Deseas instalarla ahora?',
        buttons: ['Instalar ahora', 'Después']
      }).then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall()
      })
    })

    autoUpdater.on('error', (err) => {
      log.error('[Updater] Error:', err)
    })

    // Verificar al iniciar y cada hora
    autoUpdater.checkForUpdates()
    setInterval(() => autoUpdater.checkForUpdates(), 60 * 60 * 1000)
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