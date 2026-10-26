const API_BASE_URL = '/api';

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    let message = 'Não foi possível concluir a solicitação.';
    try {
      const payload = await response.json();
      message = payload.error?.message || message;
    } catch {
      // A resposta pode não conter JSON, por exemplo em uma falha do proxy.
    }
    throw new Error(message);
  }

  return response;
}

export async function listDocuments() {
  const response = await request('/documents');
  const payload = await response.json();
  return payload.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    body: formData,
  });
  const payload = await response.json();
  return payload.document;
}

function getFilename(contentDisposition, fallback) {
  const encodedFilename = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encodedFilename) {
    try {
      return decodeURIComponent(encodedFilename.replace(/^"|"$/g, ''));
    } catch {
      return fallback;
    }
  }

  const plainFilename = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
  return plainFilename || fallback;
}

export async function downloadDocument(id) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`);
  return {
    blob: await response.blob(),
    filename: getFilename(response.headers.get('content-disposition'), `document-${id}`),
  };
}