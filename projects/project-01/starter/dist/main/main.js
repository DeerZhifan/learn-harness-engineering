"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const ipc_handlers_1 = require("./ipc-handlers");
const document_service_1 = require("../services/document-service");
const qa_service_1 = require("../services/qa-service");
const indexing_service_1 = require("../services/indexing-service");
const persistence_service_1 = require("../services/persistence-service");
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, '..', 'preload', 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        title: 'Knowledge Base',
    });
    // In development, load from Vite dev server or built renderer
    const isDev = !electron_1.app.isPackaged;
    if (isDev) {
        mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
function initializeServices() {
    const dataDir = path.join(electron_1.app.getPath('userData'), 'knowledge-base-data');
    const persistence = new persistence_service_1.PersistenceService(dataDir);
    const documentService = new document_service_1.DocumentService(persistence);
    const indexingService = new indexing_service_1.IndexingService(persistence);
    const qaService = new qa_service_1.QaService(persistence);
    (0, ipc_handlers_1.registerIpcHandlers)(electron_1.ipcMain, {
        documentService,
        indexingService,
        qaService,
    });
}
electron_1.app.whenReady().then(() => {
    initializeServices();
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
//# sourceMappingURL=main.js.map