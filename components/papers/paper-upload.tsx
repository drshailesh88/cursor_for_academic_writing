// Paper Upload Component
// Drag-and-drop PDF upload with progress

'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface PaperUploadProps {
  userId: string;
  onUploadComplete?: (paperId: string) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  className?: string;
}

interface UploadingFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'uploading' | 'processing' | 'complete' | 'error' | 'warning';
  progress: number;
  paperId?: string;
  error?: string;
  errorType?: 'password_protected' | 'corrupted' | 'too_large' | 'scanned' | 'unknown';
  suggestion?: string;
  warnings?: string[];
}

export function PaperUpload({
  userId,
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  className = '',
}: PaperUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const uploadFile = async (file: File): Promise<void> => {
    const fileId = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Check file size before upload (100MB limit)
    const MAX_UPLOAD_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_UPLOAD_SIZE) {
      setUploadingFiles((prev) => [
        ...prev,
        {
          id: fileId,
          file,
          name: file.name,
          size: file.size,
          status: 'error',
          progress: 0,
          error: 'File too large',
          errorType: 'too_large',
          suggestion: 'Please upload a file smaller than 100MB.',
        },
      ]);
      onUploadError?.('File too large. Maximum size is 100MB.');
      return;
    }

    // Add to uploading files
    setUploadingFiles((prev) => [
      ...prev,
      {
        id: fileId,
        file,
        name: file.name,
        size: file.size,
        status: 'uploading',
        progress: 0,
      },
    ]);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      // Upload
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: 'uploading', progress: 50 } : f
        )
      );

      const response = await fetch('/api/papers/upload', {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Upload failed');
      }

      const { paperId, warnings } = responseData;

      // Check for warnings
      if (warnings && warnings.length > 0) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: 'warning',
                  progress: 100,
                  paperId,
                  warnings: warnings.map((w: { message: string }) => w.message),
                }
              : f
          )
        );
      } else {
        // Mark as complete (processing happens in background)
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, status: 'processing', progress: 100, paperId }
              : f
          )
        );
      }

      onUploadComplete?.(paperId);

      // Remove from list after a delay
      setTimeout(() => {
        setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
      }, 5000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Upload failed';

      // Determine error type
      let errorType: UploadingFile['errorType'] = 'unknown';
      let suggestion: string | undefined;

      if (errorMessage.toLowerCase().includes('password')) {
        errorType = 'password_protected';
        suggestion = 'Please provide an unlocked version of this PDF.';
      } else if (errorMessage.toLowerCase().includes('corrupt')) {
        errorType = 'corrupted';
        suggestion = 'Try re-downloading the PDF from the original source.';
      } else if (errorMessage.toLowerCase().includes('scanned')) {
        errorType = 'scanned';
        suggestion = 'Consider using a version with embedded text or OCR.';
      }

      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, status: 'error', error: errorMessage, errorType, suggestion }
            : f
        )
      );

      onUploadError?.(errorMessage);
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter(
        (file) => file.type === 'application/pdf'
      );

      if (files.length === 0) {
        onUploadError?.('Please drop PDF files only');
        return;
      }

      if (files.length > maxFiles) {
        onUploadError?.(`Maximum ${maxFiles} files allowed at once`);
        return;
      }

      // Upload all files
      for (const file of files) {
        await uploadFile(file);
      }
    },
    [userId, maxFiles, onUploadError, onUploadComplete]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);

      for (const file of files.slice(0, maxFiles)) {
        await uploadFile(file);
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [userId, maxFiles, onUploadComplete]
  );

  const removeFile = (fileId: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const retryUpload = async (fileId: string) => {
    const uploadingFile = uploadingFiles.find((f) => f.id === fileId);
    if (!uploadingFile) return;

    // Remove the failed upload
    removeFile(fileId);

    // Retry with the same file
    await uploadFile(uploadingFile.file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={className}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer
          ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4 text-center">
          <motion.div
            animate={{ scale: isDragging ? 1.1 : 1 }}
            className={`
              p-4 rounded-full transition-colors
              ${isDragging ? 'bg-primary/20' : 'bg-muted'}
            `}
          >
            <Upload
              className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}
            />
          </motion.div>

          <div>
            <p className="font-medium text-foreground">
              {isDragging ? 'Drop your papers here' : 'Upload research papers'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Drag & drop PDFs or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Up to {maxFiles} files, 100MB each
            </p>
          </div>
        </div>
      </div>

      {/* Uploading Files */}
      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            {uploadingFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
              >
                <div
                  className={`
                    p-2 rounded-lg
                    ${file.status === 'complete' ? 'bg-green-100 dark:bg-green-900/20' : ''}
                    ${file.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20' : ''}
                    ${file.status === 'error' ? 'bg-red-100 dark:bg-red-900/20' : ''}
                    ${file.status === 'uploading' || file.status === 'processing' ? 'bg-primary/10' : ''}
                  `}
                >
                  {file.status === 'complete' && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  {file.status === 'warning' && (
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  {(file.status === 'uploading' || file.status === 'processing') && (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      {file.status === 'uploading' && <span>Uploading...</span>}
                      {file.status === 'processing' && <span>Processing...</span>}
                      {file.status === 'complete' && (
                        <span className="text-green-600">Complete</span>
                      )}
                    </div>
                    {file.status === 'error' && (
                      <div className="space-y-1">
                        <span className="text-red-600 font-medium">{file.error}</span>
                        {file.suggestion && (
                          <p className="text-muted-foreground">{file.suggestion}</p>
                        )}
                      </div>
                    )}
                    {file.status === 'warning' && file.warnings && (
                      <div className="space-y-1">
                        {file.warnings.map((warning, i) => (
                          <p key={i} className="text-yellow-600">
                            {warning}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-1">
                  {file.status === 'error' && (
                    <button
                      onClick={() => retryUpload(file.id)}
                      className="p-1 hover:bg-muted rounded-lg transition-colors"
                      title="Retry upload"
                    >
                      <RefreshCw className="w-4 h-4 text-primary" />
                    </button>
                  )}
                  {(file.status === 'error' || file.status === 'complete' || file.status === 'warning') && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 hover:bg-muted rounded-lg transition-colors"
                      title="Remove"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
