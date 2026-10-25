export interface AppStrings {
  appName: string;
  appSubtitle: string;
  home: string;
  newProject: string;
  myProjects: string;
  untitledProject: string;
  blocks: string;
  python: string;
  pythonWarningTitle: string;
  pythonWarningDesc: string;
  pythonEditAnyway: string;
  pythonCancel: string;
  pythonReadOnlyBadge: string;
  pythonEditButton: string;
  connect: string;
  disconnect: string;
  connecting: string;
  connectedTo: string;
  flash: string;
  flashing: string;
  flashSuccess: string;
  flashError: string;
  pairingHelp: string;
  pairingHelpTitle: string;
  pairingStep1: string;
  pairingStep2: string;
  pairingStep3: string;
  pairingStep4: string;
  pairingPrototypeNote: string;
  pairingUsbHelp: string;
  connectUsb: string;
  disconnectUsb: string;
  connectedToUsb: string;
  bluetoothNotSupportedTitle: string;
  bluetoothNotSupportedDesc1: string;
  bluetoothNotSupportedDesc2: string;
  extensions: string;
  settings: string;
  help: string;
  exportProject: string;
  importProject: string;
  deleteProject: string;
  renameProject: string;
  duplicateProject: string;
  confirmDelete: string;
  cancel: string;
  save: string;
  serialConsole: string;
  serialClear: string;
  serialPlaceholder: string;
  simulator: string;
  simulatorReset: string;
  simulatorPlay: string;
  simulatorPause: string;
  buttonA: string;
  buttonB: string;
  buttonX: string;
  buttonY: string;
  buttonAB: string;
  resetButton: string;
  pins: string;
  zoomIn: string;
  zoomOut: string;
  zoomReset: string;
  undo: string;
  redo: string;
  chunkSizeSetting: string;
  chunkSizeDesc: string;
  languageSetting: string;
  close: string;
  addExtension: string;
  installed: string;
  searchExtensions: string;
  githubUrlPlaceholder: string;
  importFromGithub: string;
  builtIn: string;
  lastEdited: string;
  boardIdSetting: string;
  boardIdDesc: string;
  boardIdPlaceholder: string;
  boardIdBadge: string;
  boardIdAllBoards: string;
  uploadSuccess: string;
  uploadBluetooth: string;
  uploadUsb: string;
  boardIdLabel: string;
  boardIdTooltip: string;
  boardIdHint: string;
  notConnected: string;
  pairingInstructions: string;
  batteryPowerNote: string;
}

export const stringsEn: AppStrings = {
  appName: "PIXL Code Studio",
  appSubtitle: "Block & Python Editor for PIXL (ESP32-S3)",
  home: "Home",
  newProject: "New Project",
  myProjects: "My Projects",
  untitledProject: "Untitled Project",
  blocks: "Blocks",
  python: "Python",
  pythonWarningTitle: "Switch to Python Editing?",
  pythonWarningDesc: "If you edit the Python code directly, changes will NOT be reflected back in the Blocks editor. The project will become Python-only.",
  pythonEditAnyway: "Convert to Python & Edit",
  pythonCancel: "Stay in Blocks",
  pythonReadOnlyBadge: "Read-only generated code",
  pythonEditButton: "Edit in Python",
  connect: "Connect",
  disconnect: "Disconnect",
  connecting: "Connecting...",
  connectedTo: "Connected to",
  flash: "Download to Board",
  flashing: "Flashing PIXL...",
  flashSuccess: "Code successfully uploaded to PIXL!",
  flashError: "Flashing failed",
  pairingHelp: "Pairing Guide",
  pairingHelpTitle: "How to connect your PIXL board",
  pairingStep1: "Switch the board on using its power switch. (The board runs from its battery; USB alone only charges it).",
  pairingStep2: "Put the board in Bluetooth mode: hold button A while switching the board on. Or switch it on and press A while the screen says 'Press A'.",
  pairingStep3: "The screen then shows your Board ID in big letters (e.g. A96E08).",
  pairingStep4: "Type this ID in the Board ID box and click 'Upload via Bluetooth'.",
  pairingPrototypeNote: "On the ESP32-S3 DevKit prototype, BOOT (GPIO0) also works during the 1.5 s startup window. Don't hold BOOT while pressing RESET.",
  pairingUsbHelp: "USB: plug in the board, ensure it is switched on, click Upload via USB and choose the port. No buttons needed.",
  connectUsb: "Connect USB",
  disconnectUsb: "Disconnect USB",
  connectedToUsb: "Connected via USB",
  bluetoothNotSupportedTitle: "Web Bluetooth Required",
  bluetoothNotSupportedDesc1: "Your current browser does not support Web Bluetooth.",
  bluetoothNotSupportedDesc2: "On iPad / iPhone: Open this app in the free 'Bluefy' browser app. On Mac, Windows, Chromebook, or Android: Use Google Chrome or Microsoft Edge.",
  extensions: "Extensions",
  settings: "Settings",
  help: "Help & Guide",
  exportProject: "Export (.pixl)",
  importProject: "Import Project",
  deleteProject: "Delete",
  renameProject: "Rename",
  duplicateProject: "Duplicate",
  confirmDelete: "Are you sure you want to delete this project?",
  cancel: "Cancel",
  save: "Save",
  serialConsole: "Serial Console",
  serialClear: "Clear Console",
  serialPlaceholder: "Listening for PIXL serial data...",
  simulator: "Simulator",
  simulatorReset: "Restart Simulator",
  simulatorPlay: "Run Simulator",
  simulatorPause: "Pause Simulator",
  buttonA: "A",
  buttonB: "B",
  buttonX: "X",
  buttonY: "Y",
  buttonAB: "A + B",
  resetButton: "RST",
  pins: "GPIO Pins",
  zoomIn: "Zoom In",
  zoomOut: "Zoom Out",
  zoomReset: "Center",
  undo: "Undo",
  redo: "Redo",
  chunkSizeSetting: "Bluetooth BLE Packet Chunk Size",
  chunkSizeDesc: "Bytes per write packet (default 180, range 20 - 240)",
  languageSetting: "Language / 語言",
  close: "Close",
  addExtension: "Add Extension",
  installed: "Installed",
  searchExtensions: "Search extensions...",
  githubUrlPlaceholder: "https://github.com/username/pixl-extension",
  importFromGithub: "Add from GitHub",
  builtIn: "Built-in",
  lastEdited: "Last edited",
  boardIdSetting: "Target Board ID (OLED suffix)",
  boardIdDesc: "Filter to your specific board in a classroom (e.g. A96E08).",
  boardIdPlaceholder: "e.g. A96E08",
  boardIdBadge: "Board ID:",
  boardIdAllBoards: "Any board",
  uploadSuccess: "Uploaded! The board restarted with your program.",
  uploadBluetooth: "Upload via Bluetooth",
  uploadUsb: "Upload via USB",
  boardIdLabel: "Board ID",
  boardIdTooltip: "The 6 letters/numbers on your board's screen in Bluetooth mode",
  boardIdHint: "6 characters, 0-9 and A-F",
  notConnected: "Not connected",
  pairingInstructions: "Put the board in Bluetooth mode: hold button A while switching the board on. Or switch it on and press A while the screen says 'Press A'. The screen then shows your Board ID in big letters.",
  batteryPowerNote: "The board runs from its battery: USB alone only charges it. Is the board switched on?",
};

export const stringsZh: AppStrings = {
  appName: "PIXL 積木編程",
  appSubtitle: "PIXL (ESP32-S3) 圖形化與 Python 編輯器",
  home: "首頁",
  newProject: "新建項目",
  myProjects: "我的項目",
  untitledProject: "未命名項目",
  blocks: "積木",
  python: "Python",
  pythonWarningTitle: "切換為 Python 編輯模式？",
  pythonWarningDesc: "若直接修改 Python 代碼，修改將無法同步回積木編輯器。項目將轉為 Python 代碼項目。",
  pythonEditAnyway: "轉為 Python 並編輯",
  pythonCancel: "保留在積木模式",
  pythonReadOnlyBadge: "由積木生成的只讀代碼",
  pythonEditButton: "直接編輯 Python",
  connect: "連接設備",
  disconnect: "斷開連接",
  connecting: "正在連接...",
  connectedTo: "已連接至",
  flash: "下載到板子",
  flashing: "正在燒錄 PIXL...",
  flashSuccess: "代碼已成功下載到 PIXL 板！",
  flashError: "燒錄失敗",
  pairingHelp: "配對指南",
  pairingHelpTitle: "如何配對 PIXL 板",
  pairingStep1: "打開板子的電源開關。（板子依靠內建鋰電池供電運行，USB 僅提供充電）。",
  pairingStep2: "進入藍牙模式：開機時按住 A 按鍵；或開機後在螢幕顯示「Press A」時按下 A 鍵。",
  pairingStep3: "螢幕上將以大字顯示 6 個字元的板子 ID（例如 A96E08）。",
  pairingStep4: "在板子 ID 欄位輸入此 ID，並點擊「透過藍牙上傳」。",
  pairingPrototypeNote: "在 ESP32-S3 開發板原型機上，BOOT (GPIO0) 按鍵也可在開機 1.5 秒內觸發。按下 RESET 時請勿按住 BOOT。",
  pairingUsbHelp: "USB 燒錄：插入板子並確認電源開關已開啟，點擊「透過 USB 上傳」並選擇串口，無需按下任何按鍵。",
  connectUsb: "連接 USB",
  disconnectUsb: "斷開 USB",
  connectedToUsb: "已通過 USB 連接",
  bluetoothNotSupportedTitle: "需要 Web Bluetooth 支援",
  bluetoothNotSupportedDesc1: "您當前的瀏覽器不支援 Web 藍牙功能。",
  bluetoothNotSupportedDesc2: "在 iPad / iPhone 上：請在免費的「Bluefy」瀏覽器中打開。在 電腦/安卓 上：請使用 Google Chrome 或 Edge 瀏覽器。",
  extensions: "擴充套件",
  settings: "設置",
  help: "幫助與手冊",
  exportProject: "導出項目 (.pixl)",
  importProject: "導入項目",
  deleteProject: "刪除",
  renameProject: "重新命名",
  duplicateProject: "複製項目",
  confirmDelete: "確定要刪除此項目嗎？",
  cancel: "取消",
  save: "保存",
  serialConsole: "串口控制台",
  serialClear: "清空控制台",
  serialPlaceholder: "等待接收 PIXL 串口數據...",
  simulator: "仿真模擬器",
  simulatorReset: "重置模擬器",
  simulatorPlay: "運行模擬",
  simulatorPause: "暫停模擬",
  buttonA: "A",
  buttonB: "B",
  buttonX: "X",
  buttonY: "Y",
  buttonAB: "A + B",
  resetButton: "復位",
  pins: "引腳狀態",
  zoomIn: "放大",
  zoomOut: "縮小",
  zoomReset: "居中",
  undo: "撤銷",
  redo: "重做",
  chunkSizeSetting: "藍牙傳輸分包大小",
  chunkSizeDesc: "每次發送字節數（預設 180，範圍 20 - 240）",
  languageSetting: "Language / 語言",
  close: "關閉",
  addExtension: "添加擴展",
  installed: "已安裝",
  searchExtensions: "搜尋擴展...",
  githubUrlPlaceholder: "https://github.com/用戶名/pixl-擴展名",
  importFromGithub: "從 GitHub 添加",
  builtIn: "內建",
  lastEdited: "上次編輯",
  boardIdSetting: "目標板子 ID（OLED 後綴）",
  boardIdDesc: "在有多塊板子的教室中鎖定你的板子（例如 A96E08）。",
  boardIdPlaceholder: "例如 A96E08",
  boardIdBadge: "板子 ID：",
  boardIdAllBoards: "任意板子",
  uploadSuccess: "已完成下載！板子已重啟並運行您的程式。",
  uploadBluetooth: "透過藍牙上傳",
  uploadUsb: "透過 USB 上傳",
  boardIdLabel: "板子 ID",
  boardIdTooltip: "板子處於藍牙模式時螢幕顯示的 6 個英數字",
  boardIdHint: "6 個字元，0-9 與 A-F",
  notConnected: "未連接",
  pairingInstructions: "進入藍牙模式：開機時按住 A 按鍵；或開機後在螢幕顯示「Press A」時按下 A 鍵。螢幕隨後會以大字顯示板子 ID。",
  batteryPowerNote: "板子依靠電池運行，USB 僅充電。板子電源是否已開啟？",
};

export type Language = 'en' | 'zh';

export function getStrings(lang: Language = 'en'): AppStrings {
  return lang === 'zh' ? stringsZh : stringsEn;
}
