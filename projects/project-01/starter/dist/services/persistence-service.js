"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistenceService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class PersistenceService {
    constructor(dataDir) {
        this.dataDir = dataDir;
        this.documentsDir = path.join(dataDir, 'documents');
        this.indexDir = path.join(dataDir, 'index');
        this.ensureDirectories();
    }
    ensureDirectories() {
        fs.mkdirSync(this.dataDir, { recursive: true });
        fs.mkdirSync(this.documentsDir, { recursive: true });
        fs.mkdirSync(this.indexDir, { recursive: true });
    }
    /** Read a JSON file, returning null if it doesn't exist. */
    readJson(relativePath) {
        const fullPath = path.join(this.dataDir, relativePath);
        if (!fs.existsSync(fullPath))
            return null;
        return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    }
    /** Write a JSON file atomically. */
    writeJson(relativePath, data) {
        const fullPath = path.join(this.dataDir, relativePath);
        const dir = path.dirname(fullPath);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf-8');
    }
    /** Read a text file. */
    readText(relativePath) {
        const fullPath = path.join(this.dataDir, relativePath);
        if (!fs.existsSync(fullPath))
            return null;
        return fs.readFileSync(fullPath, 'utf-8');
    }
    /** Write a text file. */
    writeText(relativePath, content) {
        const fullPath = path.join(this.dataDir, relativePath);
        const dir = path.dirname(fullPath);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(fullPath, content, 'utf-8');
    }
    /** Copy a file into the documents directory. */
    copyFileToDocuments(sourcePath, filename) {
        const destPath = path.join(this.documentsDir, filename);
        fs.mkdirSync(this.documentsDir, { recursive: true });
        fs.copyFileSync(sourcePath, destPath);
        return destPath;
    }
    /** Delete a file from the documents directory. */
    deleteFromDocuments(filename) {
        const filePath = path.join(this.documentsDir, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
    /** List all files in a directory. */
    listFiles(relativePath) {
        const fullPath = path.join(this.dataDir, relativePath);
        if (!fs.existsSync(fullPath))
            return [];
        return fs.readdirSync(fullPath);
    }
    /** Check if a file exists. */
    exists(relativePath) {
        return fs.existsSync(path.join(this.dataDir, relativePath));
    }
    /** Get the data directory path. */
    getDataDir() {
        return this.dataDir;
    }
    /** Get the documents directory path. */
    getDocumentsDir() {
        return this.documentsDir;
    }
    /** Get the index directory path. */
    getIndexDir() {
        return this.indexDir;
    }
}
exports.PersistenceService = PersistenceService;
//# sourceMappingURL=persistence-service.js.map