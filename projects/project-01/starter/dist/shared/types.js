"use strict";
/** Cross-boundary type definitions shared between main, preload, and renderer. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_CHANNELS = void 0;
/** IPC channel names -- single source of truth. */
exports.IPC_CHANNELS = {
    // Document operations
    LIST_DOCUMENTS: 'documents:list',
    IMPORT_DOCUMENT: 'documents:import',
    GET_DOCUMENT: 'documents:get',
    DELETE_DOCUMENT: 'documents:delete',
    // Indexing
    START_INDEXING: 'indexing:start',
    GET_INDEXING_STATUS: 'indexing:status',
    GET_CHUNKS: 'indexing:chunks',
    // Q&A
    ASK_QUESTION: 'qa:ask',
    GET_HISTORY: 'qa:history',
    // App status
    GET_STATUS: 'app:status',
};
//# sourceMappingURL=types.js.map