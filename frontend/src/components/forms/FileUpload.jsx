import { useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { formatFileSize } from '../../utils/formatters';

export function FileUpload({ onFilesSelected, accept = 'image/*', maxSize, multiple, label, description, error, preview, currentFile, onRemove }) {
  const inputRef = useRef(null);

  const handleDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add('active'); };
  const handleDragLeave = (e) => { e.preventDefault(); e.currentTarget.classList.remove('active'); };
  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('active');
    if (e.dataTransfer.files?.length) onFilesSelected?.(e.dataTransfer.files);
  };
  const handleChange = (e) => {
    if (e.target.files?.length) onFilesSelected?.(e.target.files);
  };

  return (
    <div>
      {label && <label className="label">{label}</label>}

      {/* Preview mode */}
      {currentFile && preview ? (
        <div className="relative rounded-2xl overflow-hidden border border-border bg-white">
          {preview.startsWith('data:image') || preview.startsWith('blob:') ? (
            <img src={preview} alt="Preview" className="w-full h-48 object-contain bg-black/20" />
          ) : (
            <div className="w-full h-48 flex items-center justify-center bg-black/10">
              <FileText className="w-12 h-12 text-text-tertiary" />
            </div>
          )}
          <div className="flex items-center justify-between p-3 bg-white/80">
            <div className="flex items-center gap-2 min-w-0">
              <ImageIcon className="w-4 h-4 text-text-tertiary shrink-0" />
              <span className="text-sm text-text-primary truncate">{currentFile.name}</span>
              <span className="text-xs text-text-tertiary shrink-0">{formatFileSize(currentFile.size)}</span>
            </div>
            <button onClick={onRemove} className="p-1.5 rounded-lg hover:bg-danger/10 text-text-tertiary hover:text-danger transition-colors" aria-label="Remove file">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Upload zone */
        <div
          className="upload-zone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          aria-label="Upload file"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <Upload className="w-6 h-6 text-primary-400" />
          </div>
          <p className="text-sm font-medium text-text-primary mb-1">
            Drop files here or <span className="text-primary-400">browse</span>
          </p>
          <p className="text-xs text-text-tertiary">
            {description || `${accept === 'image/*' ? 'PNG, JPG' : 'Supported files'} up to ${maxSize ? formatFileSize(maxSize) : '5MB'}`}
          </p>
        </div>
      )}

      <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={handleChange} className="hidden" />
      {error && <p className="text-danger text-sm mt-1.5">{error}</p>}
    </div>
  );
}
