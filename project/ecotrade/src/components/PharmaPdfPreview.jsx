import React from 'react';

/** Inline PDF preview from a blob URL or same-origin URL (e.g. just-uploaded file). */
const PharmaPdfPreview = ({ src, title = 'PDF preview', height = '280px' }) => {
  if (!src) return null;

  const pdfSrc = `${src}${src.includes('#') ? '' : '#toolbar=0&navpanes=0&view=FitH'}`;

  return (
    <div className="mt-3 rounded-xl border border-gray-200 overflow-hidden bg-gray-50" style={{ height }}>
      <embed
        src={pdfSrc}
        type="application/pdf"
        title={title}
        className="w-full h-full block"
      />
    </div>
  );
};

export default PharmaPdfPreview;
