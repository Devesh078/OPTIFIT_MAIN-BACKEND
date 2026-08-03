const { generateEmbedding } = require("./embeddingService");  // this should be correct

/**
 * Splits a long text into overlapping chunks.
 *
 * @param {string} text - Full document text
 * @param {number} chunkSize - Max characters per chunk
 * @param {number} overlap - Overlap between chunks
 * @returns {string[]} - Array of text chunks
 */
const chunkText = (text, chunkSize = 500, overlap = 50) => {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    start += chunkSize - overlap;
  }

  return chunks.filter((c) => c.length > 0);
};

/**
 * Takes a knowledge document and returns Pinecone-ready vectors.
 * Each vector includes: id, values (embedding), metadata (text + category).
 *
 * @param {Object} doc - { id, text, category }
 * @returns {Promise<Array>} - Array of { id, values, metadata }
 */
const prepareVectors = async (doc) => {
  const { id, text, category } = doc;

  if (!id || !text) {
    throw new Error("[ingestKnowledgeService] Each doc must have id and text.");
  }

  const chunks = chunkText(text);
  console.log(`[ingest] "${id}" → ${chunks.length} chunks`);

  const vectors = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk);

    vectors.push({
      id: `${id}_chunk_${i}`,
      values: embedding,
      metadata: {
        text: chunk,
        category: category || "general",
        sourceId: id,
        chunkIndex: i,
      },
    });
  }

  return vectors;
};

module.exports = { prepareVectors, chunkText };