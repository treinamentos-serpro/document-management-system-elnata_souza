const documentService = require('../services/document.service');

function safeDownloadName(originalName) {
  const normalizedName = originalName.replace(/\\/g, '/').split('/').pop();
  return normalizedName || 'document';
}

function createDocumentController(service = documentService) {
  return {
    upload: async (request, response) => {
      const document = await service.createDocument(request.file);
      response.status(201).json({ document });
    },

    list: async (request, response) => {
      const documents = await service.listDocuments();
      response.status(200).json({ documents });
    },

    download: async (request, response, next) => {
      const { document, filePath } = await service.getDocumentForDownload(request.params.id);
      response.download(
        filePath,
        safeDownloadName(document.originalName),
        {
          headers: {
            'Content-Type': document.mimeType || 'application/octet-stream',
          },
        },
        (error) => {
          if (error && !response.headersSent) {
            next(error);
          }
        },
      );
    },
  };
}

module.exports = createDocumentController();
module.exports.createDocumentController = createDocumentController;