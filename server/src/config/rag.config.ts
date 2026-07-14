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
  }
};