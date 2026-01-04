// Academic Document Templates

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Document',
    description: 'Start with a clean slate',
    content: '',
  },
  {
    id: 'research-article',
    name: 'Research Article',
    description: 'Standard structure for original research',
    content: `<h1>Title of Your Research Article</h1>

<h2>Abstract</h2>
<p><strong>Background:</strong> Provide context for the study.</p>
<p><strong>Methods:</strong> Briefly describe the methodology.</p>
<p><strong>Results:</strong> Summarize key findings.</p>
<p><strong>Conclusions:</strong> State the main conclusions.</p>

<h2>Introduction</h2>
<p>Introduce the research problem and its significance. Review relevant literature and identify gaps. State your research objectives and hypotheses.</p>

<h2>Methods</h2>
<h3>Study Design</h3>
<p>Describe the study design and setting.</p>

<h3>Participants</h3>
<p>Define inclusion/exclusion criteria and recruitment.</p>

<h3>Data Collection</h3>
<p>Describe data collection procedures and instruments.</p>

<h3>Statistical Analysis</h3>
<p>Describe statistical methods used.</p>

<h2>Results</h2>
<p>Present findings objectively with tables and figures as needed.</p>

<h2>Discussion</h2>
<p>Interpret results in context of existing literature. Discuss strengths and limitations. Suggest implications and future directions.</p>

<h2>Conclusion</h2>
<p>Summarize key findings and their significance.</p>

<h2>References</h2>
<p>Add your references here.</p>`,
  },
  {
    id: 'systematic-review',
    name: 'Systematic Review',
    description: 'PRISMA-aligned structure for systematic reviews',
    content: `<h1>Systematic Review Title</h1>

<h2>Abstract</h2>
<p><strong>Background:</strong> State the review question.</p>
<p><strong>Methods:</strong> Summarize search strategy and selection criteria.</p>
<p><strong>Results:</strong> Report number of studies and key findings.</p>
<p><strong>Conclusions:</strong> State implications of findings.</p>

<h2>Introduction</h2>
<p>Provide rationale for the review. State the research question using PICO format.</p>

<h2>Methods</h2>
<h3>Eligibility Criteria</h3>
<p>Define inclusion and exclusion criteria.</p>

<h3>Information Sources</h3>
<p>List databases searched with date ranges.</p>

<h3>Search Strategy</h3>
<p>Provide complete search strategy for at least one database.</p>

<h3>Selection Process</h3>
<p>Describe screening and selection procedures.</p>

<h3>Data Collection</h3>
<p>Describe data extraction process.</p>

<h3>Risk of Bias Assessment</h3>
<p>Describe quality assessment tools used.</p>

<h3>Synthesis Methods</h3>
<p>Describe methods for synthesizing results.</p>

<h2>Results</h2>
<h3>Study Selection</h3>
<p>Report PRISMA flow diagram results.</p>

<h3>Study Characteristics</h3>
<p>Describe included studies.</p>

<h3>Risk of Bias</h3>
<p>Report quality assessment results.</p>

<h3>Synthesis of Results</h3>
<p>Present main findings with meta-analysis if applicable.</p>

<h2>Discussion</h2>
<p>Summarize evidence. Discuss limitations. Compare with other reviews.</p>

<h2>Conclusion</h2>
<p>Provide a summary of findings and implications.</p>

<h2>References</h2>
<p>Add your references here.</p>`,
  },
  {
    id: 'case-report',
    name: 'Case Report',
    description: 'Template for clinical case presentations',
    content: `<h1>Case Report: [Title]</h1>

<h2>Abstract</h2>
<p><strong>Background:</strong> Why is this case worth reporting?</p>
<p><strong>Case Presentation:</strong> Brief summary of the case.</p>
<p><strong>Conclusions:</strong> Key learning points.</p>

<h2>Introduction</h2>
<p>Provide background on the condition. Explain why this case is unique or educational.</p>

<h2>Case Presentation</h2>
<h3>Patient Information</h3>
<p>Age, sex, relevant medical history.</p>

<h3>Clinical Findings</h3>
<p>Presenting symptoms and physical examination.</p>

<h3>Diagnostic Assessment</h3>
<p>Laboratory findings, imaging, and other tests.</p>

<h3>Therapeutic Intervention</h3>
<p>Treatment administered.</p>

<h3>Follow-up and Outcomes</h3>
<p>Clinical outcomes and any adverse events.</p>

<h2>Discussion</h2>
<p>Compare with similar cases in literature. Discuss diagnostic challenges. Highlight learning points.</p>

<h2>Conclusion</h2>
<p>Summarize the main take-home message.</p>

<h2>References</h2>
<p>Add your references here.</p>`,
  },
  {
    id: 'literature-review',
    name: 'Literature Review',
    description: 'Narrative review of existing literature',
    content: `<h1>Literature Review: [Topic]</h1>

<h2>Abstract</h2>
<p>Summarize the scope and main findings of the review.</p>

<h2>Introduction</h2>
<p>Define the topic and scope of the review. Explain the significance and objectives.</p>

<h2>Methods</h2>
<p>Describe search strategy and selection criteria (if applicable).</p>

<h2>Main Body</h2>
<h3>Theme 1</h3>
<p>Discuss first major theme with supporting evidence.</p>

<h3>Theme 2</h3>
<p>Discuss second major theme with supporting evidence.</p>

<h3>Theme 3</h3>
<p>Discuss third major theme with supporting evidence.</p>

<h3>Gaps in the Literature</h3>
<p>Identify areas needing further research.</p>

<h2>Discussion</h2>
<p>Synthesize findings across themes. Discuss implications.</p>

<h2>Conclusion</h2>
<p>Summarize key insights and future directions.</p>

<h2>References</h2>
<p>Add your references here.</p>`,
  },
  {
    id: 'grant-proposal',
    name: 'Grant Proposal',
    description: 'Structure for research funding applications',
    content: `<h1>Research Grant Proposal</h1>
<p><strong>Project Title:</strong> [Your Project Title]</p>
<p><strong>Principal Investigator:</strong> [Your Name]</p>

<h2>Specific Aims</h2>
<p>State the overall goal and 2-3 specific aims.</p>
<ul>
<li><strong>Aim 1:</strong> [Description]</li>
<li><strong>Aim 2:</strong> [Description]</li>
<li><strong>Aim 3:</strong> [Description]</li>
</ul>

<h2>Significance</h2>
<p>Explain the importance of the problem. Describe the expected impact.</p>

<h2>Innovation</h2>
<p>Highlight novel aspects of the proposed approach.</p>

<h2>Approach</h2>
<h3>Preliminary Data</h3>
<p>Present any existing data supporting feasibility.</p>

<h3>Research Design</h3>
<p>Describe the overall design and methodology.</p>

<h3>Timeline</h3>
<p>Provide a project timeline with milestones.</p>

<h3>Potential Pitfalls</h3>
<p>Acknowledge challenges and alternative approaches.</p>

<h2>Budget Justification</h2>
<p>Explain the resources needed and their justification.</p>

<h2>References</h2>
<p>Add your references here.</p>`,
  },
];

export function getTemplateById(id: string): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find((t) => t.id === id);
}
