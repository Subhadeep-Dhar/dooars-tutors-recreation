export const ragConfig = {
  embedding: {
    model: 'gemini-embedding-2',
    dimensions: 3072,
    schemaVersion: 1,
  },
  atlas: {
    indexName: 'profile_semantic_index',
    vectorField: 'embedding',
    similarityMetric: 'cosine'
  },
  parser: {
    model: 'gemini-2.5-flash',
    timeoutMs: 15000,
    maxRetries: 2,
    parserVersion: 1
  }
};