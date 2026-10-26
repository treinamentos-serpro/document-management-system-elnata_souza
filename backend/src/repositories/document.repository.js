const documents = new Map();

async function save(document) {
  documents.set(document.id, { ...document });
}

async function findById(id) {
  const document = documents.get(id);
  return document ? { ...document } : null;
}

async function findByOwner(owner) {
  return [...documents.values()]
    .filter((document) => document.owner === owner)
    .map((document) => ({ ...document }));
}

module.exports = {
  findById,
  findByOwner,
  save,
};