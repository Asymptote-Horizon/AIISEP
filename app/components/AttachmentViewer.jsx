'use client';

import { useState } from 'react';
import { FileText, File, Download, X } from 'lucide-react';

export default function AttachmentViewer({ attachments }) {
  const [lightboxSrc, setLightboxSrc] = useState(null);

  if (!attachments || attachments.length === 0) return null;

  const handleDownload = (att) => {
    const link = document.createElement('a');
    link.href = att.data;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="attachment-viewer-grid">
        {attachments.map((att, idx) => (
          <div key={idx} className="attachment-viewer-item">
            {att.type === 'image' ? (
              <img
                src={att.data}
                alt={att.name}
                className="attachment-viewer-img"
                onClick={() => setLightboxSrc(att.data)}
              />
            ) : (
              <div className="attachment-viewer-file" onClick={() => handleDownload(att)}>
                <div className="attachment-viewer-file-icon">
                  {att.type === 'pdf' ? <FileText size={28} /> : <File size={28} />}
                </div>
                <span className="attachment-viewer-file-name">{att.name}</span>
                <Download size={16} className="attachment-viewer-download" />
              </div>
            )}
          </div>
        ))}
      </div>

      {lightboxSrc && (
        <div className="attachment-lightbox" onClick={() => setLightboxSrc(null)}>
          <button className="attachment-lightbox-close" onClick={() => setLightboxSrc(null)}>
            <X size={24} />
          </button>
          <img src={lightboxSrc} alt="Full size" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
