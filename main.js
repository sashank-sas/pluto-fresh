const { app, BrowserWindow, screen, ipcMain } = require('electron')
const screenshot = require('screenshot-desktop')

let mainWin, tabWin
let isOpen = false
let screenWidth, screenHeight

function createWindows() {
  const display = screen.getPrimaryDisplay()
  screenWidth = display.workAreaSize.width
  screenHeight = display.workAreaSize.height

  tabWin = new BrowserWindow({
    width: 50,
    height: 120,
    x: screenWidth - 50,
    y: Math.floor(screenHeight / 2) - 60,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  tabWin.loadURL('data:text/html,' + encodeURIComponent(`
    <html>
    <head>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        width: 50px; height: 120px;
        background: linear-gradient(135deg, #d97706, #f59e0b);
        border-radius: 12px 0 0 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        gap: 6px;
      }
      .dog { font-size: 28px; }
      .label {
        font-size: 8px;
        font-weight: 700;
        color: white;
        letter-spacing: 0.1em;
        writing-mode: vertical-rl;
        transform: rotate(180deg);
      }
    </style>
    </head>
    <body onclick="require('electron').ipcRenderer.send('open-pluto')">
      <div class="dog">🐕</div>
      <div class="label">PLUTO</div>
    </body>
    </html>
  `))

  mainWin = new BrowserWindow({
    width: 380,
    height: screenHeight,
    x: screenWidth + 380,
    y: 0,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  mainWin.loadFile('index.html')
  mainWin.once('ready-to-show', () => {
    // don't show — wait for tab click
  })
}

ipcMain.on('open-pluto', () => {
  mainWin.show()
  mainWin.focus()
  tabWin.hide()
  isOpen = true
})

ipcMain.on('toggle-window', () => {
  mainWin.hide()
  tabWin.show()
  isOpen = false
})

ipcMain.handle('take-screenshot', async () => {
  try {
    mainWin.hide()
    tabWin.hide()
    await new Promise(r => setTimeout(r, 300))
    const imgBuffer = await screenshot({ format: 'png' })
    mainWin.show()
    const base64 = 'data:image/png;base64,' + imgBuffer.toString('base64')
    return { success: true, data: base64 }
  } catch (err) {
    mainWin.show()
    return { success: false, error: err.message }
  }
})

app.whenReady().then(createWindows)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})