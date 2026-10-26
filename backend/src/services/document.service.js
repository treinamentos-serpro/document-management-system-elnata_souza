const { randomUUID } = require('node:crypto');
const { defaultOwner } = require('../config');
const documentRepository = require('../repositories/document.repository');
const fileRepository = require('../repositories/file.repository');
const { toPublicDocument } = require('./document.mapper');

function createDocumentError(code) {
  const error = new Error(code);
  error.dmsCode = code;
  return error;
}

async function removeUploadedFile(file) {
  try {
    await fileRepository.remove(file.filename);
  } catch {
    // A limpeza e best-effort e nao deve substituir o erro original.
  }
}

async function createDocument(file) {
  if (!file) {
    throw createDocumentError('FILE_REQUIRED');
  }

  if (file.size === 0) {
    await removeUploadedFile(file);
    throw createDocumentError('EMPTY_FILE');
  }

  const document = {
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: defaultOwner,
    mimeType: file.mimetype || null,
    storageKey: file.filename,
  };

  try {
    await documentRepository.save(document);
  } catch (error) {
    await removeUploadedFile(file);
    throw createDocumentError('INTERNAL_ERROR');
  }

  return toPublicDocument(document);
}

async function listDocuments() {
  const documents = await documentRepository.findByOwner(defaultOwner);
  return documents
    .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
    .map(toPublicDocument);
}

async function getDocumentForDownload(id) {
  const document = await documentRepository.findById(id);
  if (!document || document.owner !== defaultOwner) {
    throw createDocumentError('DOCUMENT_NOT_FOUND');
  }

  try {
    const filePath = await fileRepository.findFilePath(document.storageKey);
    if (!filePath) {
      throw createDocumentError('DOCUMENT_NOT_FOUND');
    }

    return { document: toPublicDocument(document), filePath };
  } catch (error) {
    if (error.dmsCode === 'DOCUMENT_NOT_FOUND') {
      throw error;
    }

    throw createDocumentError('STORAGE_ERROR');
  }
}

module.exports = {
  createDocument,
  getDocumentForDownload,
  listDocuments,
};