import DownloadButton from './DownloadButton.jsx';

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Data indisponível';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
// Component to display a list of documents
export default function DocumentList({ documents, error, isLoading, onDownloadError, onRetry }) {
  if (isLoading) {
    return <p className="list-message" role="status">Carregando documentos...</p>;
  }

  if (error) {
    return (
      <div className="list-message list-error" role="alert">
        <span>{error}</span>
        <button className="text-button" type="button" onClick={onRetry}>Tentar novamente</button>
      </div>
    );
  }

  if (documents.length === 0) {
    return <p className="list-message empty-state">Nenhum documento</p>;
  }

  return (
    <ul className="document-list">
      {documents.map((document, index) => (
        <li className="document-row" key={document.id}>
          <span className="row-number">{String(index + 1).padStart(2, '0')}</span>
          <span className="document-details">
            <span className="document-name" title={document.originalName}>{document.originalName}</span>
            <span className="document-meta">
              {document.size.toLocaleString('pt-BR')} bytes
              <span className="meta-divider" aria-hidden="true">/</span>
              <time dateTime={document.uploadedAt}>{formatDate(document.uploadedAt)}</time>
            </span>
          </span>
          <DownloadButton document={document} onError={onDownloadError} />
        </li>
      ))}
    </ul>
  );
}