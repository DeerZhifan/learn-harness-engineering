"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexingService = void 0;
const uuid_1 = require("uuid");
const INDEX_META = 'index-meta.json';
const CHUNKS_DIR = 'chunks';
class IndexingService {
    constructor(persistence) {
        this.persistence = persistence;
    }
    /** Start indexing documents. If documentId is provided, index only that document. */
    async startIndexing(documentId) {
        const status = this.getStatus();
        if (documentId) {
            // Index a single document
            const content = this.persistence.readText(`content/${documentId}.txt`);
            if (!content) {
                return { ...status, status: 'error' };
            }
            const chunks = this.chunkDocument(documentId, content);
            this.persistence.writeJson(`${CHUNKS_DIR}/${documentId}.json`, chunks);
            return this.getStatus();
        }
        // Index all documents that haven't been indexed yet
        const docsMeta = this.persistence.readJson('documents-meta.json') ?? [];
        const chunksMeta = this.persistence.readJson(INDEX_META) ?? {};
        for (const doc of docsMeta) {
            if (chunksMeta[doc.id])
                continue;
            const content = this.persistence.readText(`content/${doc.id}.txt`);
            if (!content)
                continue;
            const chunks = this.chunkDocument(doc.id, content);
            this.persistence.writeJson(`${CHUNKS_DIR}/${doc.id}.json`, chunks);
            chunksMeta[doc.id] = chunks.map(c => c.id);
        }
        this.persistence.writeJson(INDEX_META, chunksMeta);
        return this.getStatus();
    }
    /** Get current indexing status. */
    getStatus() {
        const docs = this.persistence.readJson('documents-meta.json') ?? [];
        const chunksMeta = this.persistence.readJson(INDEX_META) ?? {};
        const currentIndexed = Object.keys(chunksMeta).length;
        const totalDocuments = docs.length;
        const isReady = currentIndexed === totalDocuments && totalDocuments > 0;
        return {
            status: isReady ? 'ready' : currentIndexed > 0 ? 'indexing' : 'idle',
            currentIndexed,
            totalDocuments,
            lastIndexed: new Date().toISOString(),
        };
    }
    /** Get all chunks for a document. */
    getChunksForDocument(documentId) {
        return this.persistence.readJson(`${CHUNKS_DIR}/${documentId}.json`) ?? [];
    }
    /** Get all chunks across all documents. */
    getAllChunks() {
        const chunksMeta = this.persistence.readJson(INDEX_META) ?? {};
        const allChunks = [];
        for (const docId of Object.keys(chunksMeta)) {
            const chunks = this.getChunksForDocument(docId);
            allChunks.push(...chunks);
        }
        return allChunks;
    }
    /** Split a document into chunks of ~500 characters at paragraph boundaries. */
    chunkDocument(documentId, content) {
        const CHUNK_SIZE = 500;
        const chunks = [];
        // Split on double newlines (paragraphs)
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        let buffer = '';
        let chunkIndex = 0;
        for (const para of paragraphs) {
            if (buffer.length + para.length > CHUNK_SIZE && buffer.length > 0) {
                chunks.push(this.createChunk(documentId, chunkIndex++, buffer.trim()));
                buffer = para;
            }
            else {
                buffer += (buffer ? '\n\n' : '') + para;
            }
        }
        if (buffer.trim()) {
            chunks.push(this.createChunk(documentId, chunkIndex, buffer.trim()));
        }
        return chunks;
    }
    createChunk(documentId, index, content) {
        return {
            id: (0, uuid_1.v4)(),
            documentId,
            content,
            index,
            metadata: {
                charCount: String(content.length),
                wordCount: String(content.split(/\s+/).length),
            },
        };
    }
}
exports.IndexingService = IndexingService;
//# sourceMappingURL=indexing-service.js.map