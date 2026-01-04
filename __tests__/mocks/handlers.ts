/**
 * MSW Request Handlers
 *
 * Mock API responses for all external services:
 * - PubMed (NCBI E-utilities)
 * - arXiv
 * - Semantic Scholar
 * - OpenAlex
 * - OpenRouter (AI)
 */

import { http, HttpResponse } from 'msw';

// ============================================================
// PubMed API Mocks
// ============================================================

const pubmedSearchResponse = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE eSearchResult PUBLIC "-//NLM//DTD esearch 20060628//EN" "https://eutils.ncbi.nlm.nih.gov/eutils/dtd/20060628/esearch.dtd">
<eSearchResult>
  <Count>3</Count>
  <RetMax>3</RetMax>
  <RetStart>0</RetStart>
  <IdList>
    <Id>12345678</Id>
    <Id>23456789</Id>
    <Id>34567890</Id>
  </IdList>
</eSearchResult>`;

const pubmedFetchResponse = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE PubmedArticleSet PUBLIC "-//NLM//DTD PubMedArticle, 1st January 2019//EN" "https://dtd.nlm.nih.gov/ncbi/pubmed/out/pubmed_190101.dtd">
<PubmedArticleSet>
  <PubmedArticle>
    <MedlineCitation Status="MEDLINE" Owner="NLM">
      <PMID Version="1">12345678</PMID>
      <Article PubModel="Print">
        <Journal>
          <Title>Nature Medicine</Title>
          <JournalIssue CitedMedium="Internet">
            <Volume>30</Volume>
            <Issue>1</Issue>
            <PubDate><Year>2024</Year><Month>Jan</Month></PubDate>
          </JournalIssue>
        </Journal>
        <ArticleTitle>AI in Healthcare: A Systematic Review</ArticleTitle>
        <Abstract>
          <AbstractText>This systematic review examines the application of artificial intelligence in healthcare settings. We analyzed 150 studies published between 2020 and 2024...</AbstractText>
        </Abstract>
        <AuthorList>
          <Author>
            <LastName>Smith</LastName>
            <ForeName>John</ForeName>
            <Initials>J</Initials>
          </Author>
          <Author>
            <LastName>Jones</LastName>
            <ForeName>Mary</ForeName>
            <Initials>M</Initials>
          </Author>
        </AuthorList>
      </Article>
      <MedlineJournalInfo>
        <Country>United States</Country>
        <MedlineTA>Nat Med</MedlineTA>
        <NlmUniqueID>9502015</NlmUniqueID>
      </MedlineJournalInfo>
    </MedlineCitation>
    <PubmedData>
      <ArticleIdList>
        <ArticleId IdType="pubmed">12345678</ArticleId>
        <ArticleId IdType="doi">10.1038/s41591-024-01234-5</ArticleId>
      </ArticleIdList>
    </PubmedData>
  </PubmedArticle>
</PubmedArticleSet>`;

// ============================================================
// arXiv API Mocks
// ============================================================

const arxivSearchResponse = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>ArXiv Query: search_query=all:machine learning</title>
  <id>http://arxiv.org/api/query?search_query=all:machine+learning</id>
  <opensearch:totalResults>1</opensearch:totalResults>
  <opensearch:startIndex>0</opensearch:startIndex>
  <opensearch:itemsPerPage>10</opensearch:itemsPerPage>
  <entry>
    <id>http://arxiv.org/abs/2401.12345v1</id>
    <updated>2024-01-15T18:00:00Z</updated>
    <published>2024-01-15T18:00:00Z</published>
    <title>Deep Learning for Medical Image Analysis</title>
    <summary>We present a novel deep learning approach for analyzing medical images...</summary>
    <author><name>Alice Johnson</name></author>
    <author><name>Bob Williams</name></author>
    <arxiv:primary_category xmlns:arxiv="http://arxiv.org/schemas/atom" term="cs.CV"/>
    <category term="cs.CV"/>
    <category term="cs.LG"/>
    <link href="http://arxiv.org/abs/2401.12345v1" rel="alternate" type="text/html"/>
    <link href="http://arxiv.org/pdf/2401.12345v1.pdf" title="pdf" rel="related" type="application/pdf"/>
  </entry>
</feed>`;

// ============================================================
// Semantic Scholar API Mocks
// ============================================================

const semanticScholarSearchResponse = {
  total: 100,
  offset: 0,
  data: [
    {
      paperId: 'abc123def456',
      title: 'Machine Learning in Clinical Practice',
      abstract: 'This paper reviews the use of machine learning algorithms in clinical settings...',
      year: 2024,
      citationCount: 45,
      influentialCitationCount: 12,
      authors: [
        { authorId: 'a1', name: 'David Chen' },
        { authorId: 'a2', name: 'Sarah Lee' },
      ],
      externalIds: {
        DOI: '10.1016/j.jbi.2024.104567',
        PubMed: '38765432',
      },
    },
    {
      paperId: 'xyz789abc012',
      title: 'Neural Networks for Drug Discovery',
      abstract: 'We present a comprehensive analysis of neural network architectures...',
      year: 2023,
      citationCount: 123,
      influentialCitationCount: 34,
      authors: [
        { authorId: 'a3', name: 'Emily Brown' },
      ],
      externalIds: {
        DOI: '10.1038/s41587-023-01876-4',
      },
    },
  ],
};

// ============================================================
// OpenAlex API Mocks
// ============================================================

const openAlexSearchResponse = {
  meta: {
    count: 50,
    db_response_time_ms: 23,
    page: 1,
    per_page: 10,
  },
  results: [
    {
      id: 'https://openalex.org/W4390123456',
      doi: 'https://doi.org/10.1016/j.cell.2024.01.001',
      title: 'CRISPR Applications in Cancer Research',
      publication_year: 2024,
      authorships: [
        {
          author: {
            id: 'https://openalex.org/A5012345678',
            display_name: 'Michael Zhang',
          },
          author_position: 'first',
        },
        {
          author: {
            id: 'https://openalex.org/A5023456789',
            display_name: 'Lisa Wang',
          },
          author_position: 'last',
        },
      ],
      abstract_inverted_index: {
        'This': [0],
        'study': [1],
        'explores': [2],
        'CRISPR': [3],
        'applications': [4],
        'in': [5],
        'cancer': [6],
        'research': [7],
      },
      cited_by_count: 89,
      is_oa: true,
      primary_location: {
        source: {
          display_name: 'Cell',
        },
      },
    },
  ],
};

// ============================================================
// OpenRouter (AI) API Mocks
// ============================================================

const aiChatResponse = {
  id: 'gen-abc123',
  choices: [
    {
      message: {
        role: 'assistant',
        content: 'Based on my analysis of recent literature, AI in healthcare has shown promising results in diagnostic accuracy, particularly in medical imaging. A 2024 meta-analysis found that AI systems achieved 94% accuracy in detecting lung nodules on CT scans (Smith et al., 2024).',
      },
      finish_reason: 'stop',
    },
  ],
  model: 'anthropic/claude-3.5-sonnet',
  usage: {
    prompt_tokens: 150,
    completion_tokens: 80,
    total_tokens: 230,
  },
};

// ============================================================
// Handler Definitions
// ============================================================

export const handlers = [
  // PubMed Search
  http.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', () => {
    return HttpResponse.json({
      esearchresult: {
        count: '3',
        retmax: '3',
        retstart: '0',
        idlist: ['12345678', '23456789', '34567890'],
      },
    });
  }),

  // PubMed Fetch
  http.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi', () => {
    return HttpResponse.xml(pubmedFetchResponse);
  }),

  // arXiv Search
  http.get('http://export.arxiv.org/api/query', () => {
    return HttpResponse.xml(arxivSearchResponse);
  }),

  // Semantic Scholar Paper Search
  http.get('https://api.semanticscholar.org/graph/v1/paper/search', () => {
    return HttpResponse.json(semanticScholarSearchResponse);
  }),

  // Semantic Scholar Paper Details (handles regular IDs and DOI/ArXiv/PMID lookups)
  // Using wildcard pattern to match DOIs with slashes
  http.get('https://api.semanticscholar.org/graph/v1/paper/*', ({ request }) => {
    // Extract the paper ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    // Get everything after '/paper/' by joining the remaining segments
    const paperId = pathParts.slice(5).map(decodeURIComponent).join('/');

    // Handle external ID lookups (DOI:, ARXIV:, PMID:)
    if (paperId.startsWith('DOI:') || paperId.startsWith('ARXIV:') || paperId.startsWith('PMID:')) {
      // Return complete paper data for external ID lookups
      return HttpResponse.json({
        paperId: 'abc123def456',
        title: 'Machine Learning in Clinical Practice',
        abstract: 'This paper reviews the use of machine learning algorithms in clinical settings...',
        year: 2024,
        citationCount: 45,
        influentialCitationCount: 12,
        authors: [
          { authorId: 'a1', name: 'David Chen' },
          { authorId: 'a2', name: 'Sarah Lee' },
        ],
        externalIds: {
          DOI: '10.1016/j.jbi.2024.104567',
          PubMed: '38765432',
        },
        isOpenAccess: false,
        url: 'https://www.semanticscholar.org/paper/abc123def456',
      });
    }

    // Regular paper ID lookup
    return HttpResponse.json(semanticScholarSearchResponse.data[0]);
  }),

  // OpenAlex Works Search
  http.get('https://api.openalex.org/works', () => {
    return HttpResponse.json(openAlexSearchResponse);
  }),

  // OpenAlex Work by ID (including DOI lookups like doi:10.1234/abc)
  // Using wildcard pattern to match DOIs with slashes
  http.get('https://api.openalex.org/works/*', ({ request }) => {
    // Extract the work ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    // Get everything after '/works/' by joining the remaining segments
    const workId = pathParts.slice(3).map(decodeURIComponent).join('/');

    // Handle DOI lookups
    if (workId.startsWith('doi:') || workId.startsWith('DOI:')) {
      return HttpResponse.json({
        id: 'https://openalex.org/W4390123456',
        doi: 'https://doi.org/10.1016/j.cell.2024.01.001',
        display_name: 'CRISPR Applications in Cancer Research',
        publication_year: 2024,
        authorships: [
          {
            author: {
              id: 'https://openalex.org/A5012345678',
              display_name: 'Michael Zhang',
            },
            author_position: 'first',
          },
        ],
        abstract_inverted_index: {
          'This': [0],
          'study': [1],
          'explores': [2],
          'CRISPR': [3],
        },
        cited_by_count: 89,
        is_oa: true,
        primary_location: {
          source: {
            display_name: 'Cell',
          },
        },
      });
    }

    // Return the first result from the search response for regular IDs
    return HttpResponse.json(openAlexSearchResponse.results[0]);
  }),

  // OpenRouter Chat Completion
  http.post('https://openrouter.ai/api/v1/chat/completions', async () => {
    return HttpResponse.json(aiChatResponse);
  }),

  // Anthropic API (direct)
  http.post('https://api.anthropic.com/v1/messages', async () => {
    return HttpResponse.json({
      content: [{ type: 'text', text: aiChatResponse.choices[0].message.content }],
      stop_reason: 'end_turn',
    });
  }),

  // OpenAI API
  http.post('https://api.openai.com/v1/chat/completions', async () => {
    return HttpResponse.json(aiChatResponse);
  }),
];

// Error handlers for testing error scenarios
export const errorHandlers = {
  pubmedRateLimit: http.get(
    'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
    () => {
      return new HttpResponse(null, { status: 429 });
    }
  ),

  pubmedServerError: http.get(
    'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
    () => {
      return new HttpResponse(null, { status: 500 });
    }
  ),

  semanticScholarRateLimit: http.get(
    'https://api.semanticscholar.org/graph/v1/paper/search',
    () => {
      return new HttpResponse(null, { status: 429 });
    }
  ),

  networkError: http.get(
    'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
    () => {
      return HttpResponse.error();
    }
  ),

  aiTimeout: http.post(
    'https://openrouter.ai/api/v1/chat/completions',
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 60000));
      return HttpResponse.json(aiChatResponse);
    }
  ),
};
