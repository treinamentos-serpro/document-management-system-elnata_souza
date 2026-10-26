const express = require('express');
const multer = require('multer');
const documentRoutes = require('./routes/document.routes');

const app = express();
const PORT = process.env.PORT || 3000;

const ERROR_RESPONSES = {
  FILE_REQUIRED: { status: 400, message: 'Envie um arquivo no campo file.' },
  EMPTY_FILE: { status: 400, message: 'O arquivo enviado está vazio.' },
  DOCUMENT_NOT_FOUND: { status: 404, message: 'Documento não encontrado.' },
  STORAGE_ERROR: { status: 500, message: 'Não foi possível acessar o armazenamento local.' },
  INTERNAL_ERROR: { status: 500, message: 'Ocorreu um erro interno.' },
};

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/', documentRoutes);

app.use((error, request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  let errorCode = error.dmsCode;
  if (error instanceof multer.MulterError) {
    errorCode = error.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD';
  }

  if (errorCode === 'FILE_TOO_LARGE') {
    response.status(413).json({
      error: { code: errorCode, message: 'O arquivo excede o tamanho máximo permitido.' },
    });
    return;
  }

  if (errorCode === 'INVALID_UPLOAD') {
    response.status(400).json({
      error: { code: errorCode, message: 'A requisição de upload é inválida.' },
    });
    return;
  }

  const errorResponse = ERROR_RESPONSES[errorCode] || ERROR_RESPONSES.INTERNAL_ERROR;
  const responseCode = ERROR_RESPONSES[errorCode] ? errorCode : 'INTERNAL_ERROR';
  response.status(errorResponse.status).json({
    error: { code: responseCode, message: errorResponse.message },
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
