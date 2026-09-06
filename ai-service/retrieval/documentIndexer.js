const fs = require('fs');
const path = require('path');

/**
 * Document Indexer
 * Scans markdown policy documents, splits them into contextual semantic chunks,
 * and extracts metadata for vector store indexing and citation generation.
 */
class DocumentIndexer {
  constructor(documentsPath) {
    this.documentsPath = documentsPath || path.join(__dirname, '../documents');
  }

  /**
   * Reads all documents from the knowledge base directory
   * @returns {Array<{ filename: string, content: string, title: string }>}
   */
  readDocuments() {
    if (!fs.existsSync(this.documentsPath)) {
      return [];
    }

    const files = fs.readdirSync(this.documentsPath).filter(f => f.endsWith('.md') || f.endsWith('.txt'));
    return files.map(file => {
      const fullPath = path.join(this.documentsPath, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Extract first H1 header as title or fallback to filename
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : file.replace(/\.md$/, '').replace(/-/g, ' ');

      return {
        filename: file,
        title,
        content
      };
    });
  }

  /**
   * Splits a document into semantic chunks by section headers (## or ###)
   * @param {{ filename: string, title: string, content: string }} doc 
   * @returns {Array<{ id: string, source: string, documentTitle: string, sectionTitle: string, content: string }>}
   */
  chunkDocument(doc) {
    const lines = doc.content.split('\n');
    const chunks = [];
    let currentSection = doc.title;
    let currentLines = [];
    let chunkIndex = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);

      if (headerMatch && currentLines.length > 0) {
        const textBlock = currentLines.join('\n').trim();
        if (textBlock.length > 30) {
          chunks.push({
            id: `${doc.filename}#chunk-${chunkIndex++}`,
            source: doc.filename,
            documentTitle: doc.title,
            sectionTitle: currentSection,
            content: `${doc.title} - ${currentSection}:\n${textBlock}`
          });
        }
        currentSection = headerMatch[2].trim();
        currentLines = [];
      } else if (headerMatch) {
        currentSection = headerMatch[2].trim();
      } else {
        currentLines.push(line);
      }
    }

    // Push remaining buffer
    if (currentLines.length > 0) {
      const textBlock = currentLines.join('\n').trim();
      if (textBlock.length > 30) {
        chunks.push({
          id: `${doc.filename}#chunk-${chunkIndex++}`,
          source: doc.filename,
          documentTitle: doc.title,
          sectionTitle: currentSection,
          content: `${doc.title} - ${currentSection}:\n${textBlock}`
        });
      }
    }

    return chunks;
  }

  /**
   * Indexes all knowledge base documents into a flat list of semantic chunks
   * @returns {Array<{ id: string, source: string, documentTitle: string, sectionTitle: string, content: string }>}
   */
  indexAll() {
    const docs = this.readDocuments();
    const allChunks = [];

    docs.forEach(doc => {
      const chunks = this.chunkDocument(doc);
      allChunks.push(...chunks);
    });

    return allChunks;
  }
}

module.exports = DocumentIndexer;
