const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("notchScript", {
  toggle: () => ipcRenderer.invoke("island:toggle"),
  hello: () => ipcRenderer.invoke("island:hello"),
  setInteractive: (interactive) => ipcRenderer.invoke("island:set-interactive", interactive),
  onModeChange: (callback) => {
    ipcRenderer.on("island:mode", (_event, payload) => callback(payload));
  },
  onInteractionChange: (callback) => {
    ipcRenderer.on("island:interaction", (_event, payload) => callback(payload));
  }
});
