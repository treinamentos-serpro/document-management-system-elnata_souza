const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');

const storageDirectory = path.join(os.tmpdir(), `dms-backend-test-${randomUUID()}`);
process.env.DMS_DEFAULT_OWNER = 'test-owner';
process.env.DMS_STORAGE_DIR = storageDirectory;
process.env.DMS_MAX_FILE_SIZE_BYTES = '64';

const app = require('../src/app');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('rotas permitem upload, listagem e download e rejeitam arquivos inválidos', async () => {
  const server = app.listen(0);
  await once(server, 'listening');

  try {
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const missingFile = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: new FormData(),
    });
    assert.equal(missingFile.status, 400);
    assert.equal((await missingFile.json()).error.code, 'FILE_REQUIRED');

    const emptyForm = new FormData();
    emptyForm.append('file', new Blob([]), 'empty.txt');
    const emptyFile = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: emptyForm,
    });
    assert.equal(emptyFile.status, 400);
    assert.equal((await emptyFile.json()).error.code, 'EMPTY_FILE');

    const oversizedForm = new FormData();
    oversizedForm.append('file', new Blob(['x'.repeat(65)]), 'large.txt');
    const oversizedFile = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: oversizedForm,
    });
    assert.equal(oversizedFile.status, 413);
    assert.equal((await oversizedFile.json()).error.code, 'FILE_TOO_LARGE');

    const uploadForm = new FormData();
    uploadForm.append('file', new Blob(['document body'], { type: 'text/plain' }), 'notes.txt');
    const upload = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: uploadForm,
    });
    assert.equal(upload.status, 201);

    const { document } = await upload.json();
    assert.equal(document.originalName, 'notes.txt');
    assert.equal(document.size, Buffer.byteLength('document body'));
    assert.equal(document.owner, 'test-owner');
    assert.equal(document.mimeType, 'text/plain');
    assert.ok(document.id);
    assert.ok(document.uploadedAt);
    assert.equal(Object.hasOwn(document, 'storageKey'), false);

    const list = await fetch(`${baseUrl}/documents`);
    assert.equal(list.status, 200);
    assert.deepEqual((await list.json()).documents, [document]);

    const download = await fetch(`${baseUrl}/documents/${document.id}/download`);
    assert.equal(download.status, 200);
    assert.equal(await download.text(), 'document body');
    assert.match(download.headers.get('content-disposition'), /attachment/);

    const missingDocument = await fetch(`${baseUrl}/documents/unknown/download`);
    assert.equal(missingDocument.status, 404);
    assert.equal((await missingDocument.json()).error.code, 'DOCUMENT_NOT_FOUND');

    assert.equal((await fs.readdir(storageDirectory)).length, 1);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await fs.rm(storageDirectory, { recursive: true, force: true });
  }
});
