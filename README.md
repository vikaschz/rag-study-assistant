# rag-study-assistant
AI-powered study assistant using RAG with page-level citations, document summarization, quiz generation, and cloud/local LLM support.

The frontend keeps the access token in `localStorage` for this Phase 1 implementation. This is vulnerable to token theft if a cross-site scripting (XSS) flaw is introduced; production deployments should use a security-reviewed authentication design, such as secure, HTTP-only cookies.
