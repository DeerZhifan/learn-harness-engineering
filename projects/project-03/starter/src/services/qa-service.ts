import { QAResponse, QAHistory, Citation, Chunk } from '../shared/types';
import { PersistenceService } from './persistence-service';
import { IndexingService } from './indexing-service';

const QA_HISTORY_FILE = 'qa-history.json';

/** Tokenize a question for chunk-keyword matching. Handles Latin words and CJK chars. */
function tokenize(question: string): string[] {
  const lower = question.toLowerCase();
  const tokens: string[] = [];
  // Latin/digit words of length >= 3 (skip stop-word-like short tokens).
  for (const w of lower.match(/[a-z0-9]+/g) ?? []) {
    if (w.length >= 3) tokens.push(w);
  }
  // CJK characters as single-char tokens (no spaces between Han chars).
  for (const c of lower.match(/[一-鿿]/g) ?? []) {
    tokens.push(c);
  }
  return tokens;
}

/** Mock Q&A patterns keyed to document content keywords. */
const MOCK_PATTERNS: Array<{
  keywords: string[];
  answer: string;
  excerpt: string;
}> = [
  {
    keywords: ['design', 'architecture', 'pattern'],
    answer: 'The system uses a layered architecture with clear boundaries between the main process, preload scripts, and renderer. Each layer communicates through typed IPC channels, and the services layer handles business logic independently of the UI.',
    excerpt: 'The system uses a layered architecture with clear boundaries',
  },
  {
    keywords: ['import', 'document', 'file'],
    answer: 'Documents are imported by copying the source file to the local data directory. The system extracts text content and creates metadata including title, filename, size, and import timestamp. After import, documents can be indexed for search.',
    excerpt: 'Documents are imported by copying the source file',
  },
  {
    keywords: ['index', 'chunk', 'search'],
    answer: 'The indexing pipeline splits documents into chunks of approximately 500 characters at paragraph boundaries. Each chunk includes metadata like character count and word count. The index enables grounded Q&A with citations pointing to specific document sections.',
    excerpt: 'The indexing pipeline splits documents into chunks',
  },
  {
    keywords: ['retrieval', 'search', 'query'],
    answer: 'Retrieval works by matching query keywords against indexed chunks. The system ranks chunks by keyword overlap and returns the most relevant excerpts as citations alongside the generated answer.',
    excerpt: 'Retrieval works by matching query keywords against indexed chunks',
  },
  {
    keywords: ['meeting', 'notes', 'summary'],
    answer: 'The meeting summary indicates that the team discussed implementing a retrieval-augmented generation pipeline. Key decisions included using local chunk storage and citation-based verification to ensure answer accuracy.',
    excerpt: 'The team discussed implementing a retrieval-augmented generation pipeline',
  },
  {
    keywords: ['metadata', 'word', 'count', 'line'],
    answer: 'On import, the system extracts metadata including word count, line count, character count, file type, and paragraph count. This metadata is stored on the Document and rendered in DocumentDetail.',
    excerpt: 'On import, the system extracts metadata',
  },
  {
    keywords: ['confidence', 'score', 'citation'],
    answer: 'Answers carry a confidence score: 0.85 when at least one citation is found, 0.30 when none are found. The renderer uses this score to color a badge alongside the answer.',
    excerpt: 'Answers carry a confidence score',
  },
];

export class QaService {
  private persistence: PersistenceService;
  private indexingService: IndexingService;

  constructor(persistence: PersistenceService, indexingService: IndexingService) {
    this.persistence = persistence;
    this.indexingService = indexingService;
  }

  /** Ask a question and get a grounded answer with citations. */
  async ask(question: string): Promise<QAResponse> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));

    const chunks = this.indexingService.getAllChunks();
    const docs = this.persistence.readJson<Array<{ id: string; title: string }>>('documents-meta.json') ?? [];
    const citations: Citation[] = [];
    let matched = false;

    if (chunks.length > 0) {
      const tokens = tokenize(question);

      if (tokens.length > 0) {
        const scored = chunks.map(chunk => {
          const contentLower = chunk.content.toLowerCase();
          const score = tokens.reduce(
            (acc, t) => acc + (contentLower.includes(t) ? 1 : 0),
            0
          );
          return { chunk, score };
        });

        const relevant = scored
          .filter(s => s.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 2);

        if (relevant.length > 0) {
          matched = true;
          for (const { chunk } of relevant) {
            citations.push(this.toCitation(chunk, docs));
          }
        }
      }

      // Soft fallback: question didn't match any chunk by keyword, but chunks exist.
      // Cite the most-recently-imported document's first chunk so the user still
      // gets a grounded reference. Confidence stays low (no real match).
      if (!matched) {
        const lastDoc = docs[docs.length - 1];
        const fallbackChunk = lastDoc
          ? chunks.find(c => c.documentId === lastDoc.id && c.index === 0)
          : chunks[0];
        if (fallbackChunk) {
          citations.push(this.toCitation(fallbackChunk, docs));
        }
      }
    }

    const answer = this.generateAnswer(question, citations, chunks.length, matched);

    const response: QAResponse = {
      answer,
      citations,
      // 0.85 only when keywords actually matched; otherwise 0.30 even if a soft
      // citation is shown, so the badge color signals low reliability.
      confidence: matched ? 0.85 : 0.3,
      timestamp: new Date().toISOString(),
    };

    this.saveToHistory(question, response);

    return response;
  }

  private toCitation(chunk: Chunk, docs: Array<{ id: string; title: string }>): Citation {
    const doc = docs.find(d => d.id === chunk.documentId);
    return {
      documentId: chunk.documentId,
      documentTitle: doc?.title ?? 'Unknown Document',
      chunkIndex: chunk.index,
      excerpt: chunk.content.substring(0, 200),
    };
  }

  /** Get the Q&A history. */
  getHistory(): QAHistory[] {
    return this.persistence.readJson<QAHistory[]>(QA_HISTORY_FILE) ?? [];
  }

  private generateAnswer(
    question: string,
    citations: Citation[],
    chunkCount: number,
    matched: boolean
  ): string {
    const questionLower = question.toLowerCase();
    for (const pattern of MOCK_PATTERNS) {
      if (pattern.keywords.some(kw => questionLower.includes(kw))) {
        if (matched && citations.length > 0) {
          return `${pattern.answer} Based on the document "${citations[0].documentTitle}", ${citations[0].excerpt.substring(0, 100)}.`;
        }
        return pattern.answer;
      }
    }

    if (matched && citations.length > 0) {
      return `Based on the available documents, the most relevant information comes from "${citations[0].documentTitle}": ${citations[0].excerpt.substring(0, 150)}. However, a more specific answer would require additional context.`;
    }

    if (chunkCount > 0 && citations.length > 0) {
      // Chunks exist but no keyword overlap -- show soft citation as a starting point.
      return `No keywords from your question matched the indexed content directly. Showing the most recently imported document "${citations[0].documentTitle}" as a starting point. Try asking with more specific keywords from the document.`;
    }

    return 'No documents have been indexed yet. Please import and index documents before asking questions.';
  }

  private saveToHistory(question: string, response: QAResponse): void {
    const history = this.getHistory();
    history.push({ question, response });
    this.persistence.writeJson(QA_HISTORY_FILE, history);
  }
}
