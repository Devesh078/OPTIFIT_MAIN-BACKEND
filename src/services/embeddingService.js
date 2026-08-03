const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Generates a 768-dimensional embedding vector for a given text.
 * Used by both ingestion (knowledge chunks) and search (user questions).
 *
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} - 768-dimensional float array
 */
const generateEmbedding = async (text) => {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new Error("[embeddingService] Input text must be a non-empty string.");
  }

  const response = await ai.models.embedContent({
  model: "models/gemini-embedding-2",  // ✅
  contents: text.trim(),
});

  const values = response?.embeddings?.[0]?.values;

  if (!values || !Array.isArray(values)) {
    throw new Error("[embeddingService] Gemini returned no embedding values.");
  }

  return values;
};

module.exports = { generateEmbedding };