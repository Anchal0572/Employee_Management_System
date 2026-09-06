const { retrievalEngine } = require('../retrieval/retrievalEngine');
const { guardrails } = require('../prompts/guardrails');
const { HR_ASSISTANT_SYSTEM_PROMPT } = require('../prompts/systemPrompts');
const { formatRAGPrompt } = require('../prompts/templates');
const { llmProvider } = require('./llmProvider');

/**
 * RAG Service (Retrieval-Augmented Generation)
 * 
 * Provides policy-grounded Q&A with strict RBAC boundary checks,
 * prompt safety guardrails, and citation tracking.
 */
class RAGService {
  constructor(retriever = retrievalEngine, provider = llmProvider, safety = guardrails) {
    this.retriever = retriever;
    this.provider = provider;
    this.safety = safety;
  }

  /**
   * Processes a user chat message against the company knowledge base
   * @param {object} params
   * @param {string} params.query - User question
   * @param {object} params.user - Authenticated user details { id, role, name, email }
   * @param {Array<{ role: string, content: string }>} params.history
   * @returns {Promise<{ answer: string, citations: Array, providerUsed: string, isRefusal: boolean }>}
   */
  async answerQuery({ query, user = { role: 'employee', name: 'User' }, history = [] }) {
    // 1. Prompt Safety & RBAC Evaluation
    const safetyCheck = this.safety.checkPromptSafety(query, user);
    if (!safetyCheck.safe) {
      return {
        answer: safetyCheck.refusalMessage,
        citations: [],
        providerUsed: 'guardrails-safety-filter',
        isRefusal: true,
        reason: safetyCheck.reason
      };
    }

    // 2. Retrieve relevant context from Knowledge Base
    const retrievalResult = this.retriever.retrieve(query, 3, 0.04);
    const { contextText, citations, found } = retrievalResult;

    // 3. Format RAG Prompt with Context
    const userPrompt = formatRAGPrompt({
      query,
      contextText,
      userRole: user.role,
      userName: user.name || user.email || 'Employee'
    });

    // 4. Generate grounded completion via LLM Provider
    const response = await this.provider.generate({
      systemPrompt: HR_ASSISTANT_SYSTEM_PROMPT,
      userPrompt,
      history,
      citations
    });

    // 5. Sanitize output text
    const sanitizedAnswer = this.safety.sanitizeOutput(response.text);

    return {
      answer: sanitizedAnswer,
      citations: found ? citations : [],
      providerUsed: response.providerUsed,
      latencyMs: response.latencyMs,
      isRefusal: false,
      grounded: found
    };
  }

  /**
   * Re-indexes knowledge base documents
   */
  reindexDocuments() {
    return this.retriever.reindex();
  }

  /**
   * Lists all indexed documents
   */
  getIndexedDocuments() {
    return this.retriever.getIndexedDocuments();
  }
}

const defaultRAGService = new RAGService();
module.exports = {
  RAGService,
  ragService: defaultRAGService
};
