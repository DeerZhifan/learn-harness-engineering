import { QAResponse, QAHistory } from '../shared/types';
import { PersistenceService } from './persistence-service';
import { IndexingService } from './indexing-service';
export declare class QaService {
    private persistence;
    private indexingService;
    constructor(persistence: PersistenceService, indexingService?: IndexingService);
    /** Ask a question and get a grounded answer with citations. */
    ask(question: string): Promise<QAResponse>;
    /** Get the Q&A history. */
    getHistory(): QAHistory[];
    private generateAnswer;
    private saveToHistory;
}
//# sourceMappingURL=qa-service.d.ts.map