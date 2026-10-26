import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments, uploadDocument } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [listError, setListError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setListError('');

    listDocuments()
      .then((loadedDocuments) => {
        if (isCurrent) {
          setDocuments(loadedDocuments);
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setListError(error.message);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [reloadVersion]);

  async function handleUpload(file) {
    setIsUploading(true);
    setUploadError('');

    try {
      await uploadDocument(file);
      setReloadVersion((version) => version + 1);
      return true;
    } catch (error) {
      setUploadError(error.message);
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span className="brand-name">DMS<span>/</span>ARQUIVO</span>
        </a>
        <div className="system-status">
          <span className="status-dot" aria-hidden="true" />
          <span>ARMAZENAMENTO LOCAL</span>
        </div>
      </header>

      <main className="workspace">
        <div className="page-heading">
          <div>
            <p className="eyebrow">GESTÃO DE DOCUMENTOS</p>
            <h1>Documentos</h1>
          </div>
          <div className="document-counter" aria-live="polite">
            <span className="counter-value">{documents.length.toString().padStart(2, '0')}</span>
            <span className="counter-label">ARQUIVOS</span>
          </div>
        </div>

        <div className="workspace-grid">
          <section className="upload-section" aria-labelledby="upload-heading">
            <div className="section-heading">
              <span className="section-index">01</span>
              <h2 id="upload-heading">Novo documento</h2>
            </div>
            <UploadComponent
              error={uploadError}
              isUploading={isUploading}
              onUpload={handleUpload}
            />
          </section>

          <section className="library-section" aria-labelledby="library-heading">
            <div className="section-heading library-heading">
              <div className="section-title-group">
                <span className="section-index">02</span>
                <h2 id="library-heading">Biblioteca</h2>
              </div>
              <span className="library-count">{documents.length} {documents.length === 1 ? 'ITEM' : 'ITENS'}</span>
            </div>

            {downloadError && (
              <p className="notice notice-error" role="alert">
                {downloadError}
                <button type="button" onClick={() => setDownloadError('')} aria-label="Fechar erro">
                  Fechar
                </button>
              </p>
            )}

            <DocumentList
              documents={documents}
              error={listError}
              isLoading={isLoading}
              onDownloadError={setDownloadError}
              onRetry={() => setReloadVersion((version) => version + 1)}
            />
          </section>
        </div>

        <footer className="workspace-footer">
          <span>DOCUMENT MANAGEMENT SYSTEM</span>
          <span>LOCAL / V1</span>
        </footer>
      </main>
    </div>
  );
}