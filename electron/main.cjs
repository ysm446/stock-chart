const { app, BrowserWindow, Menu } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKEND_PORT = process.env.BACKEND_PORT || '8000';
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5173';

let mainWindow = null;
let backendProcess = null;
let loadRetryCount = 0;
const MAX_LOAD_RETRY = 20;
let devToolsOpenedForError = false;

function getBackendRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'backend');
  }
  return path.join(__dirname, '..', 'backend');
}

function getPythonCommands(backendRoot) {
  const commands = [];

  if (process.env.BACKEND_PYTHON) {
    commands.push(process.env.BACKEND_PYTHON);
  }

  if (process.platform === 'win32') {
    const venvPython = path.join(backendRoot, 'venv', 'Scripts', 'python.exe');
    if (fs.existsSync(venvPython)) {
      commands.push(venvPython);
    }
    commands.push('py', 'python');
  } else {
    const venvPython = path.join(backendRoot, 'venv', 'bin', 'python');
    if (fs.existsSync(venvPython)) {
      commands.push(venvPython);
    }
    commands.push('python3', 'python');
  }

  return [...new Set(commands)];
}

function startBackend() {
  const backendRoot = getBackendRoot();
  const args = ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', BACKEND_PORT];
  const pythonCommands = getPythonCommands(backendRoot);
  let commandIndex = 0;

  const tryStart = () => {
    if (commandIndex >= pythonCommands.length) {
      process.stderr.write('[backend] failed to launch: no usable Python command was found.\n');
      backendProcess = null;
      return;
    }

    const pythonCommand = pythonCommands[commandIndex];
    process.stdout.write(`[backend] launching with: ${pythonCommand}\n`);

    backendProcess = spawn(pythonCommand, args, {
      cwd: backendRoot,
      windowsHide: true,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    });

    backendProcess.stdout?.on('data', (data) => {
      process.stdout.write(`[backend] ${data}`);
    });
    backendProcess.stderr?.on('data', (data) => {
      process.stderr.write(`[backend] ${data}`);
    });
    backendProcess.on('error', (error) => {
      if (error?.code === 'ENOENT') {
        process.stderr.write(`[backend] Python command not found: ${pythonCommand}\n`);
        commandIndex += 1;
        tryStart();
        return;
      }
      process.stderr.write(`[backend] failed to spawn process: ${error}\n`);
      backendProcess = null;
    });
    backendProcess.on('exit', (code, signal) => {
      const message = `[backend] exited code=${code ?? 'null'} signal=${signal ?? 'null'}\n`;
      process.stdout.write(message);
      backendProcess = null;
    });
  };

  tryStart();
}

function stopBackend() {
  if (!backendProcess) {
    return;
  }

  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(backendProcess.pid), '/f', '/t'], { windowsHide: true });
  } else {
    backendProcess.kill('SIGTERM');
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    await mainWindow.loadFile(path.join(process.resourcesPath, 'frontend-dist', 'index.html'));
  } else {
    mainWindow.webContents.on('did-finish-load', () => {
      loadRetryCount = 0;
      devToolsOpenedForError = false;
    });

    mainWindow.webContents.on('did-fail-load', async (_event, errorCode, errorDescription) => {
      if (!devToolsOpenedForError && !mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
        devToolsOpenedForError = true;
      }
      if (loadRetryCount >= MAX_LOAD_RETRY) {
        process.stderr.write(`[electron] renderer load failed: ${errorCode} ${errorDescription}\n`);
        return;
      }

      loadRetryCount += 1;
      setTimeout(async () => {
        if (!mainWindow || mainWindow.isDestroyed()) {
          return;
        }
        try {
          await mainWindow.loadURL(DEV_SERVER_URL);
        } catch (error) {
          process.stderr.write(`[electron] retry ${loadRetryCount} failed: ${error}\n`);
        }
      }, 500);
    });

    await mainWindow.loadURL(DEV_SERVER_URL);
  }
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  startBackend();
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
});
