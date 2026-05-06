/** Cross-boundary type definitions shared between main, preload, and renderer. */
export interface Document {
    id: string;
    title: string;
    filename: string;
    importedAt: string;
    size: number;
    status: 'imported' | 'indexing' | 'indexed' | 'error';
    chunks?: number;
}
export interface Chunk {
    id: string;
    documentId: string;
    content: string;
    index: number;
    metadata: Record<string, string>;
}
export interface Citation {
    documentId: string;
    documentTitle: string;
    chunkIndex: number;
    excerpt: string;
}
export interface QAResponse {
    answer: string;
    citations: Citation[];
    confidence: number;
    timestamp: string;
}
export interface QAHistory {
    question: string;
    response: QAResponse;
}
export interface AppStatus {
    documentsLoaded: number;
    indexStatus: 'idle' | 'indexing' | 'ready' | 'error';
    lastActivity: string;
}
/** IPC channel names -- single source of truth. */
export declare const IPC_CHANNELS: {
    readonly LIST_DOCUMENTS: "documents:list";
    readonly IMPORT_DOCUMENT: "documents:import";
    readonly GET_DOCUMENT: "documents:get";
    readonly DELETE_DOCUMENT: "documents:delete";
    readonly START_INDEXING: "indexing:start";
    readonly GET_INDEXING_STATUS: "indexing:status";
    readonly GET_CHUNKS: "indexing:chunks";
    readonly ASK_QUESTION: "qa:ask";
    readonly GET_HISTORY: "qa:history";
    readonly GET_STATUS: "app:status";
};
//# sourceMappingURL=types.d.ts.map