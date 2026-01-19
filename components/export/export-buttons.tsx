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
    console.log('[Export] handleExport called with format:', format);
    console.log('[Export] content length:', content?.length || 0);
    console.log('[Export] title:', title);

    if (!content) {
      console.log('[Export] No content, returning early');
      toast.error('No content to export');
      return;
    }

    setExportingFormat(format);
    console.log('[Export] Starting export...');

    try {
      if (format === 'docx') {
        console.log('[Export] Calling exportDocumentToDocx...');
        await exportDocumentToDocx({ title, content });
        console.log('[Export] DOCX export completed successfully');
        toast.success('Exported to DOCX');
      } else {
        console.log('[Export] Calling exportDocumentToPdf...');
        exportDocumentToPdf({ title, content });
        console.log('[Export] PDF export completed successfully');
        toast.success('Exported to PDF');
      }
    } catch (error) {
      console.error('[Export] Export failed:', error);
      toast.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExportingFormat(null);
      console.log('[Export] Export process finished');
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
