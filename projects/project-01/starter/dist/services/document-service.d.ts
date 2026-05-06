import { Document } from '../shared/types';
import { PersistenceService } from './persistence-service';
export declare class DocumentService {
    private persistence;
    constructor(persistence: PersistenceService);
    /** List all imported documents. */
    listDocuments(): Document[];
    /** Import a file from the given path. */
    importDocument(filePath: string): Document;
    /** Get a single document by ID. */
    getDocument(id: string): Document | null;
    /** Get the text content of a document. */
    getDocumentContent(id: string): string | null;
    /** Update a document's metadata. */
    updateDocument(id: string, updates: Partial<Document>): Document | null;
    /** Delete a document by ID. */
    deleteDocument(id: string): boolean;
}
//# sourceMappingURL=document-service.d.ts.map