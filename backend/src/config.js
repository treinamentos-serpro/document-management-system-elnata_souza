const path = require('node:path');

const applicationRoot = path.resolve(__dirname, '../..');
const defaultOwner = process.env.DMS_DEFAULT_OWNER;

if (!defaultOwner || !defaultOwner.trim()) {
  throw new Error('DMS_DEFAULT_OWNER deve ser configurado.');
}

function positiveIntegerFromEnv(name, defaultValue) {
  const value = process.env[name];

  if (value === undefined || value === '') {
    return defaultValue;
  }

  const parsedValue = Number(value);
  if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${name} deve ser um inteiro positivo.`);
  }

  return parsedValue;
}

const configuredStorageDirectory = process.env.DMS_STORAGE_DIR || 'backend/storage';

module.exports = {
  defaultOwner: defaultOwner.trim(),
  maxFileSizeBytes: positiveIntegerFromEnv('DMS_MAX_FILE_SIZE_BYTES', 10 * 1024 * 1024),
  storageDirectory: path.resolve(applicationRoot, configuredStorageDirectory),
};