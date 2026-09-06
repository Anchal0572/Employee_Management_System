const DocumentIndexer = require('./documentIndexer');
const { vectorStore } = require('./vectorStore');

/**
 * Retrieval Engine
 * Manages knowledge base lifecycle, index refreshment, and semantic context retrieval
 * with citation metadata for RAG prompts.
 */
class RetrievalEngine {
  constructor(indexer = new DocumentIndexer(), store = vectorStore) {
    this.indexer = indexer;
    this.store = store;
    this.autoInitialize();
  }

  /**
   * Initializes the vector store index if not already built
   */
  autoInitialize() {
    if (!this.store.isIndexed) {
      this.reindex();
    }
  }

  /**
   * Re-reads all markdown documents and builds vector embeddings
   * @returns {object} index statistics
   */
  reindex() {
    const chunks = this.indexer.indexAll();
    this.store.buildIndex(chunks);
    return this.store.getStats();
  }

  /**
   * Retrieves relevant context for a user query
   * @param {string} query 
   * @param {number} topK 
   * @param {number} minScore 
   * @returns {{ contextText: string, citations: Array<{ document: string, section: string, score: number }>, chunks: Array }}
   */
  retrieve(query, topK = 3, minScore = 0.04) {
    this.autoInitialize();

    const matches = this.store.search(query, topK, minScore);

    if (matches.length === 0) {
      return {
        contextText: '',
        citations: [],
        chunks: [],
        found: false
      };
    }

    // Assemble clean context block for LLM prompt
    const contextText = matches
      .map((m, idx) => `[Source ${idx + 1}: ${m.documentTitle} > ${m.sectionTitle}]\n${m.content}`)
      .join('\n\n---\n\n');

    const citations = matches.map(m => ({
      document: m.documentTitle,
      sourceFile: m.source,
      section: m.sectionTitle,
      score: m.score
    }));

    return {
      contextText,
      citations,
      chunks: matches,
      found: true
    };
  }

  /**
   * Gets list of currently indexed documents
   */
  getIndexedDocuments() {
    this.autoInitialize();
    return this.indexer.readDocuments().map(d => ({
      filename: d.filename,
      title: d.title
    }));
  }
}

const defaultRetrievalEngine = new RetrievalEngine();
module.exports = {
  RetrievalEngine,
  retrievalEngine: defaultRetrievalEngine
};
