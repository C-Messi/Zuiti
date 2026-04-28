import * as dotenv from 'dotenv'
import { app, shell, BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerIpc } from './ipc'
import { setupSafeProcessLogging } from './logger'

setupSafeProcessLogging()
dotenv.config()

let mainWindow: BrowserWindow | null = null

function showMainWindowOnce(): void {
  if (!mainWindow || mainWindow.isDestroyed() || mainWindow.isVisible()) return
  mainWindow.show()
  mainWindow.moveTop()
}

function createWindow(): void {
  const { workArea } = screen.getPrimaryDisplay()
  const winW = 360
  const winH = 420

  mainWindow = new BrowserWindow({
    width: winW,
    height: winH,
    x: workArea.x + workArea.width - winW - 24,
    y: workArea.y + workArea.height - winH - 24,
    transparent: true,
    frame: false,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.setAlwaysOnTop(true, 'floating')
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  mainWindow.on('ready-to-show', () => {
    showMainWindowOnce()
  })
  mainWindow.webContents.on('did-finish-load', () => {
    showMainWindowOnce()
  })
  setTimeout(() => {
    showMainWindowOnce()
  }, 1500)
  mainWindow.on('closed', () => {
    mainWindow = null
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

  registerIpc(mainWindow)
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('cn.zuiti.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
