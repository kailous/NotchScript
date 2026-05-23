const path = require("node:path");
const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require("electron");

let islandWindow;
let isExpanded = false;
let isInteractive = false;

const WINDOW = {
  compact: { width: 260, height: 48 },
  expanded: { width: 420, height: 128 },
  y: 8
};

function getCenteredBounds(size) {
  const display = screen.getPrimaryDisplay();
  const { x, width } = display.workArea;

  return {
    x: Math.round(x + (width - size.width) / 2),
    y: WINDOW.y,
    width: size.width,
    height: size.height
  };
}

function setWindowMode(expanded) {
  if (!islandWindow) return;

  isExpanded = expanded;
  const nextSize = expanded ? WINDOW.expanded : WINDOW.compact;
  islandWindow.setBounds(getCenteredBounds(nextSize), true);
  islandWindow.webContents.send("island:mode", { expanded });

  if (!expanded) {
    setInteractive(false);
  }
}

function setInteractive(interactive) {
  if (!islandWindow) return;

  isInteractive = interactive;
  islandWindow.setIgnoreMouseEvents(!interactive, { forward: true });
  islandWindow.webContents.send("island:interaction", { interactive });
}

function createIslandWindow() {
  islandWindow = new BrowserWindow({
    ...getCenteredBounds(WINDOW.compact),
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    fullscreenable: false,
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    backgroundColor: "#00000000",
    titleBarStyle: "hidden",
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  islandWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  islandWindow.setAlwaysOnTop(true, "screen-saver");
  islandWindow.setIgnoreMouseEvents(true, { forward: true });
  islandWindow.loadFile(path.join(__dirname, "../renderer/index.html"));

  islandWindow.on("closed", () => {
    islandWindow = null;
  });
}

app.whenReady().then(() => {
  createIslandWindow();

  globalShortcut.register("CommandOrControl+Shift+N", () => {
    setWindowMode(!isExpanded);
  });

  globalShortcut.register("CommandOrControl+Shift+I", () => {
    setInteractive(!isInteractive);
  });

  ipcMain.handle("island:toggle", () => {
    setWindowMode(!isExpanded);
    return { expanded: isExpanded };
  });

  ipcMain.handle("island:set-interactive", (_event, interactive) => {
    setInteractive(Boolean(interactive));
    return { interactive: isInteractive };
  });

  ipcMain.handle("island:hello", () => {
    setWindowMode(true);
    return { message: "Hello from NotchScript" };
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});
