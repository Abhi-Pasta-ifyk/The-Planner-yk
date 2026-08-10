import React, { useState } from 'react';
import { FileDown, Loader } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const ExportPDFButton = ({ targetId, filename }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    const element = document.getElementById(targetId);
    if (!element) {
      alert("Could not find the content to export.");
      return;
    }

    setIsExporting(true);

    // PDF Configuration Options
    const opt = {
      margin:       0.5,
      filename:     filename || 'upsc-planner-export.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF Export failed:", error);
      alert("Failed to generate PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button 
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-colors shadow-sm"
    >
      {isExporting ? <Loader size={18} className="animate-spin" /> : <FileDown size={18} />}
      {isExporting ? 'Generating...' : 'Export PDF'}
    </button>
  );
};

export default ExportPDFButton;