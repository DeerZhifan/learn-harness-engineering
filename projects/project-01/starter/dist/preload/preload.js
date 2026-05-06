"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const types_1 = require("../shared/types");
const api = {
    documents: {
        list: () => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.LIST_DOCUMENTS),
        import: (filePath) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.IMPORT_DOCUMENT, filePath),
        get: (id) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.GET_DOCUMENT, id),
        delete: (id) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.DELETE_DOCUMENT, id),
    },
    indexing: {
        start: (documentId) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.START_INDEXING, documentId),
        status: () => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.GET_INDEXING_STATUS),
        chunks: (documentId) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.GET_CHUNKS, documentId),
    },
    qa: {
        ask: (question) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.ASK_QUESTION, question),
        history: () => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.GET_HISTORY),
    },
    dialog: {
        openFile: () => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.OPEN_FILE_DIALOG),
    },
};
electron_1.contextBridge.exposeInMainWorld('knowledgeBase', api);
//# sourceMappingURL=preload.js.map