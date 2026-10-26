const fs = require('node:fs/promises');
const path = require('node:path');
const { storageDirectory } = require('../config');

function resolveStorageKey(storageKey) {
  if (!storageKey || path.basename(storageKey) !== storageKey) {
    throw new Error('Chave de armazenamento inválida.');
  }

  const filePath = path.resolve(storageDirectory, storageKey);
  if (!filePath.startsWith(`${storageDirectory}${path.sep}`)) {
    throw new Error('Chave de armazenamento inválida.');
  }

  return filePath;
}

async function remove(storageKey) {
  try {
    await fs.unlink(resolveStorageKey(storageKey));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function findFilePath(storageKey) {
  const filePath = resolveStorageKey(storageKey);

  try {
    const fileStats = await fs.stat(filePath);
    return fileStats.isFile() ? filePath : null;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

module.exports = {
  findFilePath,
  remove,
};