function toPublicDocument(document) {
  const { storageKey, ...publicDocument } = document;
  return publicDocument;
}

module.exports = {
  toPublicDocument,
};