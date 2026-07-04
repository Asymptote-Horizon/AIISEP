'use client';

import { useState, useRef } from 'react';
import { Paperclip, X, Image, FileText, File } from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function getFileType(file) {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf') return 'pdf';
  return 'file';
}

function getFileIcon(type) {
  switch (type) {
    case 'image': return <Image size={20} />;
    case 'pdf': return <FileText size={20} />;
    default: return <File size={20} />;
  }
}

export default function AttachmentUploader({ attachments, onChange, maxFiles = 5 }) {
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setError('');

    if (attachments.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" exceeds 5 MB limit`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const newAttachment = {
          name: file.name,
          type: getFileType(file),
          mimeType: file.type,
          data: reader.result,
        };
        onChange(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = null;
  };

  const removeAttachment = (index) => {
    onChange(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="attachment-uploader">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      
      <button
        type="button"
        className="btn btn-sm btn-secondary attachment-btn"
        onClick={() => fileInputRef.current?.click()}
        disabled={attachments.length >= maxFiles}
      >
        <Paperclip size={14} className="inline-icon" /> Attach Files
      </button>

      {error && <p className="attachment-error">{error}</p>}

      {attachments.length > 0 && (
        <div className="attachment-preview-grid">
          {attachments.map((att, idx) => (
            <div key={idx} className="attachment-preview-item">
              {att.type === 'image' ? (
                <img src={att.data} alt={att.name} className="attachment-preview-img" />
              ) : (
                <div className="attachment-preview-icon">
                  {getFileIcon(att.type)}
                </div>
              )}
              <span className="attachment-preview-name" title={att.name}>
                {att.name.length > 20 ? att.name.slice(0, 17) + '...' : att.name}
              </span>
              <button
                type="button"
                className="attachment-remove-btn"
                onClick={() => removeAttachment(idx)}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
