const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('petAPI', {
  hide: () => ipcRenderer.send('hide-pet'),
  onKeyboard: (callback) => ipcRenderer.on('keyboard-activity', callback),
  onIdle: (callback) => ipcRenderer.on('idle-seconds', (_event, seconds) => callback(seconds)),
  dragStart: () => ipcRenderer.send('drag-start'),
  dragMove: () => ipcRenderer.invoke('drag-move'),
  dragEnd: () => ipcRenderer.send('drag-end'),
  setScale: (scale) => ipcRenderer.send('pet-scale', scale),
  onScale: (callback) => ipcRenderer.on('scale-applied', (_event, scale) => callback(scale))
  ,wanderStart: () => ipcRenderer.send('wander-start')
  ,wanderStop: () => ipcRenderer.send('wander-stop')
  ,onWanderDirection: (callback) => ipcRenderer.on('wander-direction', (_event, direction) => callback(direction))
  ,getSettings: () => ipcRenderer.invoke('settings-get')
  ,saveSettings: (settings) => ipcRenderer.invoke('settings-save', settings)
  ,saveShortcuts: (shortcuts) => ipcRenderer.invoke('shortcuts-save', shortcuts)
  ,resetShortcuts: () => ipcRenderer.invoke('shortcuts-reset')
  ,onSettings: (callback) => ipcRenderer.on('settings-updated', (_event, settings) => callback(settings))
  ,feed: (food, portion = 1) => ipcRenderer.invoke('feed-pet', food, portion)
  ,onFed: (callback) => ipcRenderer.on('fed', (_event, payload) => callback(payload))
  ,togglePet: () => ipcRenderer.send('pet-toggle')
  ,hideControl: () => ipcRenderer.send('control-hide')
  ,reportStatus: (status) => ipcRenderer.send('pet-status', status)
  ,onStatus: (callback) => ipcRenderer.on('pet-status', (_event, status) => callback(status))
  ,recordActivity: (type) => ipcRenderer.send('pet-activity', type)
  ,getDiary: (date) => ipcRenderer.invoke('diary-get', date)
  ,getDiaryList: () => ipcRenderer.invoke('diary-list')
  ,getOverview: () => ipcRenderer.invoke('home-overview')
  ,importAction: (name) => ipcRenderer.invoke('action-import', name)
  ,deleteAction: (id) => ipcRenderer.invoke('action-delete', id)
  ,renameAction: (id, name) => ipcRenderer.invoke('action-rename', id, name)
  ,petCommand: (command) => ipcRenderer.send('pet-command', command)
  ,onPetCommand: (callback) => ipcRenderer.on('pet-command', (_event, command) => callback(command))
  ,chat: (message) => ipcRenderer.invoke('ai-chat', message)
  ,clearChat: () => ipcRenderer.invoke('ai-chat-clear')
  ,chooseFeedbackFiles: () => ipcRenderer.invoke('feedback-choose-files')
  ,submitFeedback: (payload) => ipcRenderer.invoke('feedback-submit', payload)
  ,openFeedbackIssues: () => ipcRenderer.invoke('feedback-open-list')
  ,setMousePassthrough: (passthrough) => ipcRenderer.send('mouse-passthrough', !!passthrough)
});
