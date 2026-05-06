"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIpcHandlers = registerIpcHandlers;
const types_1 = require("../shared/types");
function registerIpcHandlers(ipcMain, services) {
    const { documentService, indexingService, qaService } = services;
    // Document operations
    ipcMain.handle(types_1.IPC_CHANNELS.LIST_DOCUMENTS, async () => {
        return documentService.listDocuments();
    });
    ipcMain.handle(types_1.IPC_CHANNELS.IMPORT_DOCUMENT, async (_event, filePath) => {
        return documentService.importDocument(filePath);
    });
    ipcMain.handle(types_1.IPC_CHANNELS.GET_DOCUMENT, async (_event, id) => {
        return documentService.getDocument(id);
    });
    ipcMain.handle(types_1.IPC_CHANNELS.DELETE_DOCUMENT, async (_event, id) => {
        return documentService.deleteDocument(id);
    });
    // Indexing
    ipcMain.handle(types_1.IPC_CHANNELS.START_INDEXING, async (_event, documentId) => {
        return indexingService.startIndexing(documentId);
    });
    ipcMain.handle(types_1.IPC_CHANNELS.GET_INDEXING_STATUS, async () => {
        return indexingService.getStatus();
    });
    ipcMain.handle(types_1.IPC_CHANNELS.GET_CHUNKS, async (_event, documentId) => {
        return indexingService.getChunksForDocument(documentId);
    });
    // Q&A
    ipcMain.handle(types_1.IPC_CHANNELS.ASK_QUESTION, async (_event, question) => {
        return qaService.ask(question);
    });
    ipcMain.handle(types_1.IPC_CHANNELS.GET_HISTORY, async () => {
        return qaService.getHistory();
    });
}
//# sourceMappingURL=ipc-handlers.js.map