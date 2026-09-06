/**
 * Security, RBAC, and Prompt Safety Guardrails
 * Protects employee personal data, enforces RBAC boundaries, and prevents
 * prompt injection or unauthorized PII extraction.
 */

// Patterns indicating unauthorized inquiries into peers' salary or compensation
const SALARY_PII_PATTERNS = [
  /salary\s+(of|for)\s+([a-z\s]+)/i,
  /how\s+much\s+(does|do|is)\s+([a-z\s]+)\s+(make|earn|paid|earning|getting)/i,
  /compensation\s+(of|for)\s+([a-z\s]+)/i,
  /pay\s+(of|for|scale\s+of)\s+([a-z\s]+)/i,
  /highest\s+paid\s+employee/i,
  /reveal\s+.*salary/i,
  /show\s+me\s+.*salary/i,
  /what\s+is\s+([a-z\s]+)['']s\s+salary/i,
  /earning\s+of\s+([a-z\s]+)/i
];

// Patterns indicating inquiries into sensitive private HR records of other people
const PRIVATE_RECORD_PATTERNS = [
  /(home\s+address|personal\s+phone|ssn|social\s+security|bank\s+account)\s+(of|for)/i,
  /phone\s+number\s+of\s+([a-z\s]+)/i,
  /private\s+(record|file|data)\s+(of|for)\s+([a-z\s]+)/i,
  /performance\s+review\s+(of|for)\s+([a-z\s]+)/i,
  /disciplinary\s+record\s+(of|for)\s+([a-z\s]+)/i
];

// Patterns indicating prompt injection or jailbreak attempts
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /disregard\s+(the\s+)?system\s+prompt/i,
  /you\s+are\s+now\s+in\s+developer\s+mode/i,
  /override\s+(all\s+)?security\s+rules/i,
  /reveal\s+(the\s+)?system\s+prompt/i,
  /output\s+admin\s+password/i
];

class Guardrails {
  /**
   * Evaluates prompt safety and RBAC boundaries
   * @param {string} query - The user's input text
   * @param {object} user - Authenticated user object { id, role, email, name }
   * @returns {{ safe: boolean, reason?: string, refusalMessage?: string }}
   */
  checkPromptSafety(query, user = {}) {
    if (!query || typeof query !== 'string') {
      return { safe: false, reason: 'EMPTY_QUERY', refusalMessage: 'Query cannot be empty.' };
    }

    const cleanQuery = query.trim();

    // 1. Check for prompt injection attempts
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(cleanQuery)) {
        return {
          safe: false,
          reason: 'PROMPT_INJECTION',
          refusalMessage: 'Security Notice: System instructions and guardrails cannot be overridden. Please ask a valid question regarding company policies or workplace guidelines.'
        };
      }
    }

    // 2. Check for unauthorized salary inquiries across peers
    for (const pattern of SALARY_PII_PATTERNS) {
      if (pattern.test(cleanQuery)) {
        return {
          safe: false,
          reason: 'RBAC_SALARY_VIOLATION',
          refusalMessage: 'Privacy & RBAC Protection: Under company privacy guidelines and Role-Based Access Control (RBAC), individual employee salary and compensation details are strictly confidential and cannot be disclosed.'
        };
      }
    }

    // 3. Check for private HR record/PII queries
    for (const pattern of PRIVATE_RECORD_PATTERNS) {
      if (pattern.test(cleanQuery)) {
        return {
          safe: false,
          reason: 'RBAC_PII_VIOLATION',
          refusalMessage: 'Privacy & RBAC Protection: Personal contact details, home addresses, and private personnel records of other employees are strictly confidential and cannot be revealed.'
        };
      }
    }

    return { safe: true };
  }

  /**
   * Sanitizes output text from LLM to strip accidental leaks of credentials or private tokens
   * @param {string} text 
   * @returns {string}
   */
  sanitizeOutput(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/(\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53})/g, '[REDACTED_HASH]')
      .replace(/[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, '[REDACTED_JWT]');
  }
}

const defaultGuardrails = new Guardrails();
module.exports = {
  Guardrails,
  guardrails: defaultGuardrails
};
