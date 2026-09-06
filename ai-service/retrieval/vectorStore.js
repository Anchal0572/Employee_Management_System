const { embeddingEngine } = require('../embeddings/embeddingEngine');

/**
 * In-Memory Vector Store
 * Stores embedded document chunks and performs cosine distance nearest-neighbor queries.
 */
class VectorStore {
  constructor(engine = embeddingEngine) {
    this.engine = engine;
    this.chunks = [];         // Array<{ id, source, documentTitle, sectionTitle, content, vector }>
    this.isIndexed = false;
  }

  /**
   * Loads chunks, builds vocabulary in embedding engine, and vectors every chunk
   * @param {Array<{ id: string, source: string, documentTitle: string, sectionTitle: string, content: string }>} chunks 
   */
  buildIndex(chunks) {
    if (!chunks || chunks.length === 0) {
      this.chunks = [];
      this.isIndexed = true;
      return;
    }

    // Fit embedding vocabulary on all chunks
    this.engine.fit(chunks);

    // Vectorize each chunk
    this.chunks = chunks.map(chunk => {
      const vector = this.engine.embed(chunk.content);
      return {
        ...chunk,
        vector
      };
    });

    this.isIndexed = true;
  }

  /**
   * Searches for top-K matching chunks using cosine similarity
   * @param {string} queryText 
   * @param {number} topK 
   * @param {number} minScore 
   * @returns {Array<{ id, source, documentTitle, sectionTitle, content, score }>}
   */
  search(queryText, topK = 3, minScore = 0.05) {
    if (!this.isIndexed || this.chunks.length === 0) {
      return [];
    }

    const queryVector = this.engine.embed(queryText);
    const scoredChunks = [];

    for (const chunk of this.chunks) {
      const score = this.engine.cosineSimilarity(queryVector, chunk.vector);
      if (score >= minScore) {
        scoredChunks.push({
          id: chunk.id,
          source: chunk.source,
          documentTitle: chunk.documentTitle,
          sectionTitle: chunk.sectionTitle,
          content: chunk.content,
          score: Math.round(score * 1000) / 1000
        });
      }
    }

    // Sort descending by cosine similarity score
    scoredChunks.sort((a, b) => b.score - a.score);

    return scoredChunks.slice(0, topK);
  }

  getStats() {
    const sources = new Set(this.chunks.map(c => c.source));
    return {
      totalChunks: this.chunks.length,
      totalDocuments: sources.size,
      documents: Array.from(sources),
      isIndexed: this.isIndexed
    };
  }

  clear() {
    this.chunks = [];
    this.isIndexed = false;
  }
}

// Export singleton instance and class
const defaultVectorStore = new VectorStore();
module.exports = {
  VectorStore,
  vectorStore: defaultVectorStore
};
