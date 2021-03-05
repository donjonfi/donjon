const { app, shell, BrowserWindow, Menu } = require('electron')

const path = require('path')
const isDev = require('electron-is-dev')

//const ipcRoute = require('./core/ipc-route')
//ipcRoute.initialize()

let mainWindow

const createWindow = () => {

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      devTools: isDev,
      nodeIntegration: true,
      enableRemoteModule: true
    }
  })
  mainWindow.setMenuBarVisibility(false)

  mainWindow.loadURL(isDev ? 'http://localhost:4200' : `file://${path.join(__dirname, '../dist/donjon-creer/index.html')}`)
  if (isDev) {
    // Open the DevTools.
    setTimeout(() => {
      mainWindow.webContents.openDevTools({mode: 'detach'})
    }, 1000)
  }
  mainWindow.on('closed', () => mainWindow = null)

  if (!isDev) {
    Menu.setApplicationMenu(null)
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools()
    })
  }

  mainWindow.webContents.on('new-window', (event, url) => {
    if (!url.match(/http:\/\/localhost.*/gi) && url.startsWith('http')) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })
}

app.on('ready', async () => {
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
