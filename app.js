import app from 'app';
import BrowserWindow from 'browser-window';

import path from 'path';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // We're a single pane app for the moment, so we'll just close
  // instead of conditional closure on process.platform !== 'darwin'
  app.quit();
});

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 1000,
    // frame: false,
    darkTheme: true,
    title: 'Composition',
  });

  mainWindow.loadURL('file://' + path.join(__dirname, '/index.html'));
  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});
