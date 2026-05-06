import { IpcMain } from 'electron';
import { DocumentService } from '../services/document-service';
import { IndexingService } from '../services/indexing-service';
import { QaService } from '../services/qa-service';
export interface Services {
    documentService: DocumentService;
    indexingService: IndexingService;
    qaService: QaService;
}
export declare function registerIpcHandlers(ipcMain: IpcMain, services: Services): void;
//# sourceMappingURL=ipc-handlers.d.ts.map