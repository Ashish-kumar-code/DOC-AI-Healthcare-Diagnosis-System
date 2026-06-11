import { useState, useCallback, useEffect } from 'react';
import { validateFile } from '../utils/validators';

/**
 * File upload state management with drag-and-drop support
 */
export function useFileUpload(options = {}) {
  const { maxSize, acceptedTypes, multiple = false } = options;
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);

  // Generate previews
  useEffect(() => {
    const urls = files.map((file) => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return null;
    });
    setPreviews(urls);
    return () => urls.forEach((url) => url && URL.revokeObjectURL(url));
  }, [files]);

  const processFiles = useCallback((fileList) => {
    setError(null);
    const newFiles = Array.from(fileList);
    for (const file of newFiles) {
      const result = validateFile(file, { maxSize, acceptedTypes });
      if (!result.valid) {
        setError(result.message);
        return;
      }
    }
    setFiles(multiple ? (prev) => [...prev, ...newFiles] : newFiles.slice(0, 1));
  }, [maxSize, acceptedTypes, multiple]);

  const handleFileSelect = useCallback((e) => {
    if (e.target.files?.length) processFiles(e.target.files);
  }, [processFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const removeFile = useCallback((index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setError(null);
  }, []);

  return {
    files,
    previews,
    isDragging,
    error,
    handleFileSelect,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    removeFile,
    clearFiles,
  };
}
