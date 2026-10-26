import { useRef, useState } from 'react';

export default function UploadComponent({ onUpload, isUploading, error }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  function selectFile(file) {
    if (file) {
      setSelectedFile(file);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile || isUploading) {
      return;
    }

    const wasUploaded = await onUpload(selectedFile);
    if (wasUploaded) {
      setSelectedFile(null);
      inputRef.current.value = '';
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label
        className={`file-picker${isDragging ? ' is-dragging' : ''}`}
        htmlFor="document-file"
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <span className="picker-symbol" aria-hidden="true">+</span>
        <span className="picker-copy">
          <span className="picker-title">{selectedFile ? 'Arquivo selecionado' : 'Escolher arquivo'}</span>
          <span className="picker-meta">
            {selectedFile
              ? `${selectedFile.name} · ${selectedFile.size.toLocaleString('pt-BR')} bytes`
              : 'Selecionar do dispositivo'}
          </span>
        </span>
        <input
          ref={inputRef}
          id="document-file"
          className="visually-hidden"
          type="file"
          onChange={(event) => selectFile(event.target.files[0])}
        />
      </label>

      {error && <p className="notice notice-error" role="alert">{error}</p>}

      <button className="button button-primary upload-submit" type="submit" disabled={!selectedFile || isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar documento'}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}