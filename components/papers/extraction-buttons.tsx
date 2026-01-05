'use client';

import { useState } from 'react';
import { Lightbulb, FlaskConical, AlertTriangle, Quote, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ExtractionResult {
  type: 'findings' | 'methods' | 'limitations' | 'citation';
  content: string;
}

interface ExtractionButtonsProps {
  paperId: string;
  paperTitle: string;
  onInsertToEditor?: (content: string) => void;
}

export function ExtractionButtons({
  paperId,
  paperTitle,
  onInsertToEditor,
}: ExtractionButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<ExtractionResult[]>([]);
  const [insertedId, setInsertedId] = useState<string | null>(null);

  const handleExtraction = async (
    type: 'findings' | 'methods' | 'limitations' | 'citation'
  ) => {
    setLoading(type);

    try {
      // TODO: Implement actual API call to /api/papers/extract
      // For now, simulate a response
      await new Promise((resolve) => setTimeout(resolve, 1500));

      let content = '';
      switch (type) {
        case 'findings':
          content = `**Key Findings from "${paperTitle}":**\n\n1. First major finding\n2. Second important result\n3. Third key discovery`;
          break;
        case 'methods':
          content = `**Methods Summary:**\n\nThis study employed a quantitative approach using...`;
          break;
        case 'limitations':
          content = `**Study Limitations:**\n\n- Sample size constraint\n- Temporal limitations\n- Methodological considerations`;
          break;
        case 'citation':
          content = `Author et al. (2024). ${paperTitle}. *Journal Name*, 10(2), 123-145.`;
          break;
      }

      const newResult: ExtractionResult = { type, content };
      setResults((prev) => [newResult, ...prev]);
    } catch (error) {
      console.error('Extraction error:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleInsert = (content: string, index: number) => {
    if (onInsertToEditor) {
      onInsertToEditor(content);
      setInsertedId(`result-${index}`);
      setTimeout(() => setInsertedId(null), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Extraction Buttons */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold mb-3">Quick Extractions</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-auto py-3 flex-col gap-1"
            onClick={() => handleExtraction('findings')}
            disabled={loading !== null}
          >
            {loading === 'findings' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Lightbulb className="w-5 h-5" />
            )}
            <span className="text-xs">Key Findings</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-3 flex-col gap-1"
            onClick={() => handleExtraction('methods')}
            disabled={loading !== null}
          >
            {loading === 'methods' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <FlaskConical className="w-5 h-5" />
            )}
            <span className="text-xs">Methods</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-3 flex-col gap-1"
            onClick={() => handleExtraction('limitations')}
            disabled={loading !== null}
          >
            {loading === 'limitations' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span className="text-xs">Limitations</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-3 flex-col gap-1"
            onClick={() => handleExtraction('citation')}
            disabled={loading !== null}
          >
            {loading === 'citation' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Quote className="w-5 h-5" />
            )}
            <span className="text-xs">Citation</span>
          </Button>
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">
                Click a button above to extract specific information from the paper
              </p>
            </div>
          ) : (
            results.map((result, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {result.type === 'findings' && <Lightbulb className="w-4 h-4" />}
                      {result.type === 'methods' && <FlaskConical className="w-4 h-4" />}
                      {result.type === 'limitations' && <AlertTriangle className="w-4 h-4" />}
                      {result.type === 'citation' && <Quote className="w-4 h-4" />}
                      {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                    </span>
                    {onInsertToEditor && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInsert(result.content, index)}
                      >
                        {insertedId === `result-${index}` ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Inserted
                          </>
                        ) : (
                          'Insert'
                        )}
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-sm whitespace-pre-wrap">{result.content}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Info */}
      {results.length === 0 && (
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            AI-powered extraction using {paperTitle}
          </p>
        </div>
      )}
    </div>
  );
}
