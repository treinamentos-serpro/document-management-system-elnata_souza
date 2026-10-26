const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const express = require('express');
const multer = require('multer');
const { maxFileSizeBytes, storageDirectory } = require('../config');
const documentController = require('../controllers/document.controller');

const router = express.Router();
const storage = multer.diskStorage({
  destination: (request, file, callback) => {
    fs.mkdir(storageDirectory, { recursive: true })
      .then(() => callback(null, storageDirectory))
      .catch(callback);
  },
  filename: (request, file, callback) => callback(null, randomUUID()),
});
const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSizeBytes,
    files: 1,
  },
});

function handleUpload(request, response, next) {
  upload.single('file')(request, response, (error) => {
    if (!error) {
      next();
      return;
    }

    if (!(error instanceof multer.MulterError)) {
      error.dmsCode = 'STORAGE_ERROR';
    }

    next(error);
  });
}

router.post('/upload', handleUpload, documentController.upload);
router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

module.exports = router;