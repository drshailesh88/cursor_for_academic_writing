'use client';

import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportDocumentToDocx } from '@/lib/export/docx';
import { exportDocumentToPdf } from '@/lib/export/pdf';
import { toast } from 'sonner';

interface ExportButtonsProps {
  title?: string;
  content?: string;
}

export function ExportButtons({ title, content }: ExportButtonsProps) {
  const [exportingFormat, setExportingFormat] = useState<'docx' | 'pdf' | null>(null);

  const handleExport = async (format: 'docx' | 'pdf') => {
    if (!content) return;
    setExportingFormat(format);
    try {
      if (format === 'docx') {
        await exportDocumentToDocx({ title, content });
        toast.success('Exported to DOCX');
      } else {
        exportDocumentToPdf({ title, content });
        toast.success('Exported to PDF');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setExportingFormat(null);
    }
  };

  const disabled = !content || exportingFormat !== null;

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleExport('docx')}
        disabled={disabled}
        className="min-w-[90px]"
      >
        {exportingFormat === 'docx' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        DOCX
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={() => handleExport('pdf')}
        disabled={disabled}
        className="min-w-[90px]"
      >
        {exportingFormat === 'pdf' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        PDF
      </Button>
    </div>
  );
}
