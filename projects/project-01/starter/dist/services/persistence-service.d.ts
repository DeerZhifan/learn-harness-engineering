export declare class PersistenceService {
    private dataDir;
    private documentsDir;
    private indexDir;
    constructor(dataDir: string);
    private ensureDirectories;
    /** Read a JSON file, returning null if it doesn't exist. */
    readJson<T>(relativePath: string): T | null;
    /** Write a JSON file atomically. */
    writeJson<T>(relativePath: string, data: T): void;
    /** Read a text file. */
    readText(relativePath: string): string | null;
    /** Write a text file. */
    writeText(relativePath: string, content: string): void;
    /** Copy a file into the documents directory. */
    copyFileToDocuments(sourcePath: string, filename: string): string;
    /** Delete a file from the documents directory. */
    deleteFromDocuments(filename: string): void;
    /** List all files in a directory. */
    listFiles(relativePath: string): string[];
    /** Check if a file exists. */
    exists(relativePath: string): boolean;
    /** Get the data directory path. */
    getDataDir(): string;
    /** Get the documents directory path. */
    getDocumentsDir(): string;
    /** Get the index directory path. */
    getIndexDir(): string;
}
//# sourceMappingURL=persistence-service.d.ts.map