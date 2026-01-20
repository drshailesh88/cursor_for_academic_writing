'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PaperSection } from '@/lib/supabase/schema';

interface PaperSectionsProps {
  sections: PaperSection[];
  onCopySection?: (content: string) => void;
}

export function PaperSections({ sections, onCopySection }: PaperSectionsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['abstract']) // Expand abstract by default
  );
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (sectionType: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionType)) {
        next.delete(sectionType);
      } else {
        next.add(sectionType);
      }
      return next;
    });
  };

  const handleCopy = async (content: string, sectionType: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedSection(sectionType);
    setTimeout(() => setCopiedSection(null), 2000);
    onCopySection?.(content);
  };

  const formatSectionTitle = (type: string, title: string) => {
    if (title && title.toLowerCase() !== type.replace('_', ' ')) {
      return title;
    }
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredSections = useMemo(() => {
    if (!searchQuery) return sections;
    const query = searchQuery.toLowerCase();
    return sections.filter(
      (section) =>
        section.title.toLowerCase().includes(query) ||
        section.content.toLowerCase().includes(query) ||
        section.type.toLowerCase().includes(query)
    );
  }, [sections, searchQuery]);

  const getSectionIcon = (type: string) => {
    // Abstract should be highlighted
    if (type === 'abstract') {
      return '✨';
    }
    return '📄';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search sections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Sections */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredSections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No sections found</p>
            </div>
          ) : (
            filteredSections.map((section, index) => {
              const isExpanded = expandedSections.has(section.type);
              const isAbstract = section.type === 'abstract';

              return (
                <Card
                  key={`${section.type}-${index}`}
                  className={isAbstract ? 'border-primary/50 bg-primary/5' : ''}
                >
                  <CardHeader
                    className="cursor-pointer py-3 px-4"
                    onClick={() => toggleSection(section.type)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-lg">{getSectionIcon(section.type)}</span>
                        <CardTitle className="text-sm font-semibold">
                          {formatSectionTitle(section.type, section.title)}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        {section.pageStart && (
                          <span className="text-xs text-muted-foreground">
                            p. {section.pageStart}
                            {section.pageEnd && section.pageEnd !== section.pageStart
                              ? `-${section.pageEnd}`
                              : ''}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(section.content, section.type);
                          }}
                        >
                          {copiedSection === section.type ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="pt-0 px-4 pb-4">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {section.content}
                        </p>
                      </div>
                      {section.subsections && section.subsections.length > 0 && (
                        <div className="mt-4 space-y-2 border-l-2 border-border pl-4">
                          {section.subsections.map((subsection, subIndex) => (
                            <div key={subIndex}>
                              <h4 className="text-sm font-semibold mb-1">
                                {subsection.title}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {subsection.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Section Navigation Sidebar - Floating */}
      {sections.length > 0 && (
        <div className="absolute right-4 top-20 bg-background/95 backdrop-blur-sm border rounded-lg p-2 shadow-lg max-w-[200px] hidden lg:block">
          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
            Quick Nav
          </p>
          <div className="space-y-1">
            {sections.slice(0, 8).map((section, index) => (
              <button
                key={`nav-${section.type}-${index}`}
                onClick={() => {
                  toggleSection(section.type);
                  if (!expandedSections.has(section.type)) {
                    setExpandedSections((prev) => new Set(prev).add(section.type));
                  }
                }}
                className={`w-full text-left px-2 py-1 rounded text-xs hover:bg-muted transition-colors ${
                  expandedSections.has(section.type)
                    ? 'bg-muted font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {formatSectionTitle(section.type, section.title)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
