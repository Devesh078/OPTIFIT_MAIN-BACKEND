const { generateEmbedding } = require("./embeddingService");
const pineconeIndex = require("./pineconeService");

/**
 * Performs semantic search against the Pinecone index.
 * Embeds the question, queries Pinecone, returns top K text chunks.
 *
 * @param {string} question - The user's question
 * @param {number} topK - Number of results to return (default: 5)
 * @param {Object} filter - Optional Pinecone metadata filter e.g. { category: "nutrition" }
 * @returns {Promise<string[]>} - Array of relevant text chunks
 */
const vectorSearch = async (question, topK = 5, filter = {}) => {
  if (!question || question.trim().length === 0) {
    return [];
  }

  // 1. Embed the question
  const queryVector = await generateEmbedding(question);

  // 2. Build query params
  const queryParams = {
    vector: queryVector,
    topK,
    includeMetadata: true,
  };

  if (Object.keys(filter).length > 0) {
    queryParams.filter = filter;
  }

  // 3. Query Pinecone
  const result = await pineconeIndex.query({
  vector: queryVector,
  topK,
  includeMetadata: true,
});

  // 4. Extract and return text chunks
  const chunks = (result.matches || [])
    .filter((match) => match.score > 0.5) // relevance threshold
    .map((match) => match.metadata?.text || "")
    .filter(Boolean);

  console.log(`[vectorSearch] "${question}" → ${chunks.length} relevant chunks`);

  return chunks;
};

module.exports = { vectorSearch };