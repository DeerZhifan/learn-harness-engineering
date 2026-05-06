import { Chunk } from '../shared/types';
import { PersistenceService } from './persistence-service';
interface IndexStatus {
    status: 'idle' | 'indexing' | 'ready' | 'error';
    currentIndexed: number;
    totalDocuments: number;
    lastIndexed: string | null;
}
export declare class IndexingService {
    private persistence;
    constructor(persistence: PersistenceService);
    /** Start indexing documents. If documentId is provided, index only that document. */
    startIndexing(documentId?: string): Promise<IndexStatus>;
    /** Get current indexing status. */
    getStatus(): IndexStatus;
    /** Get all chunks for a document. */
    getChunksForDocument(documentId: string): Chunk[];
    /** Get all chunks across all documents. */
    getAllChunks(): Chunk[];
    /** Split a document into chunks of ~500 characters at paragraph boundaries. */
    private chunkDocument;
    private createChunk;
}
export {};
//# sourceMappingURL=indexing-service.d.ts.map