/// <reference types="react" />
/// <reference types="react-dom" />

declare global {
  interface Window {
    knowledgeBase: {
      documents: {
        list: () => Promise<import('../shared/types').Document[]>;
        import: (filePath: string) => Promise<import('../shared/types').Document>;
        get: (id: string) => Promise<import('../shared/types').Document | null>;
        delete: (id: string) => Promise<boolean>;
      };
      indexing: {
        start: (documentId?: string) => Promise<{
          status: 'idle' | 'indexing' | 'ready' | 'error';
          currentIndexed: number;
          totalDocuments: number;
          lastIndexed: string | null;
        }>;
        status: () => Promise<{
          status: 'idle' | 'indexing' | 'ready' | 'error';
          currentIndexed: number;
          totalDocuments: number;
          lastIndexed: string | null;
        }>;
        chunks: (documentId: string) => Promise<import('../shared/types').Chunk[]>;
      };
      qa: {
        ask: (question: string) => Promise<import('../shared/types').QAResponse>;
        history: () => Promise<import('../shared/types').QAHistory[]>;
      };
      dialog: {
        openFile: () => Promise<string | null>;
      };
    };
  }
}

export {};
