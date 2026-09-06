/**
 * Text Embedding and Vector Mathematics Engine
 * 
 * Provides deterministic vector representations and cosine similarity calculations.
 * Features an internal TF-IDF + n-gram vectorizer guaranteeing 100% offline,
 * resilient, zero-cost operation without requiring external API keys.
 */

// Stop words list for English policy text cleaning
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'let', 'me', 'more',
  'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought',
  'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what',
  'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours'
]);

class EmbeddingEngine {
  constructor() {
    this.vocabulary = new Map(); // token -> index
    this.idf = new Map();        // token -> idf weight
    this.docCount = 0;
  }

  /**
   * Tokenizes text into normalized unigram and bigram tokens
   * @param {string} text 
   * @returns {string[]}
   */
  tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    
    // Normalize case and strip markdown / punctuation
    const clean = text
      .toLowerCase()
      .replace(/[#*`_~[\]()<>:;.,!?/'"\\{}-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const rawTokens = clean.split(' ').filter(t => t.length > 2 && !STOP_WORDS.has(t));
    const tokens = [...rawTokens];

    // Generate bigrams for key phrase capture (e.g. "leave policy", "grace period", "earned leave")
    for (let i = 0; i < rawTokens.length - 1; i++) {
      tokens.push(`${rawTokens[i]}_${rawTokens[i + 1]}`);
    }

    return tokens;
  }

  /**
   * Builds the global vocabulary and IDF table from an array of document chunks
   * @param {Array<{ content: string }>} chunks 
   */
  fit(chunks) {
    this.vocabulary.clear();
    this.idf.clear();
    this.docCount = chunks.length;

    const docFreq = new Map();

    chunks.forEach(chunk => {
      const tokens = new Set(this.tokenize(chunk.content));
      tokens.forEach(token => {
        docFreq.set(token, (docFreq.get(token) || 0) + 1);
      });
    });

    let index = 0;
    docFreq.forEach((df, token) => {
      this.vocabulary.set(token, index++);
      // Standard smoothed IDF: ln((1 + N) / (1 + df)) + 1
      const idfScore = Math.log((1 + this.docCount) / (1 + df)) + 1.0;
      this.idf.set(token, idfScore);
    });
  }

  /**
   * Vectorizes input text into a normalized TF-IDF vector
   * @param {string} text 
   * @returns {Float32Array}
   */
  embed(text) {
    const vector = new Float32Array(this.vocabulary.size || 1);
    if (!this.vocabulary.size) return vector;

    const tokens = this.tokenize(text);
    if (!tokens.length) return vector;

    const termFreq = new Map();
    tokens.forEach(t => {
      termFreq.set(t, (termFreq.get(t) || 0) + 1);
    });

    let normSq = 0;
    termFreq.forEach((count, token) => {
      const idx = this.vocabulary.get(token);
      if (idx !== undefined) {
        // TF-IDF weight: (count / total_tokens) * IDF
        const tf = count / tokens.length;
        const idf = this.idf.get(token) || 1.0;
        const weight = tf * idf;
        vector[idx] = weight;
        normSq += weight * weight;
      }
    });

    // L2-Normalize vector
    const norm = Math.sqrt(normSq);
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  /**
   * Computes Cosine Similarity between two L2-normalized vectors
   * @param {Float32Array} vecA 
   * @param {Float32Array} vecB 
   * @returns {number} score between 0.0 and 1.0
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
    }
    return Math.max(0, Math.min(1, dot));
  }
}

// Export singleton instance and class
const defaultEmbeddingEngine = new EmbeddingEngine();
module.exports = {
  EmbeddingEngine,
  embeddingEngine: defaultEmbeddingEngine
};
