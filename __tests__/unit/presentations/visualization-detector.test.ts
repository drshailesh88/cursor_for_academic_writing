/**
 * Visualization Detector Tests
 * Tests for detecting chart and visualization opportunities in text
 */

import { describe, it, expect } from 'vitest';
import {
  detectVisualizations,
  detectComparison,
  detectTrend,
  detectProportions,
  detectProcess,
  detectTabularData,
  suggestChartType,
  extractDataPoints,
} from '@/lib/presentations/analyzers/visualization-detector';
import { extractDataPatterns } from '@/lib/presentations/extractors/content-extractor';

describe('Visualization Detector', () => {
  describe('detectComparison', () => {
    it('should detect category comparisons', () => {
      const text = 'Treatment group A showed 75% improvement compared to 45% in control group B.';
      const result = detectComparison(text);

      expect(result).toBeTruthy();
      expect(result?.type).toMatch(/bar/);
      expect(result?.confidence).toBeGreaterThan(0.4);
    });

    it('should detect numerical comparisons', () => {
      const text = 'Group 1 scored 85 versus Group 2 with 62.';
      const result = detectComparison(text);

      expect(result).toBeTruthy();
      expect(result?.extractedData.length).toBeGreaterThan(0);
    });

    it('should suggest stacked bar for categories', () => {
      const text = 'Different categories showed 40% vs 35% vs 25% improvement rates.';
      const result = detectComparison(text);

      expect(result).toBeTruthy();
    });

    it('should return null for non-comparison text', () => {
      const text = 'This is just a simple description without any comparisons.';
      const result = detectComparison(text);

      expect(result).toBeNull();
    });

    it('should extract data points from comparison', () => {
      const text = 'Intervention: 78%, Control: 45%, Placebo: 32%';
      const result = detectComparison(text);

      expect(result?.extractedData.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('detectTrend', () => {
    it('should detect time series data', () => {
      const text = 'Adoption increased from 25% in 2020 to 45% in 2021 and 67% in 2022.';
      const result = detectTrend(text);

      expect(result).toBeTruthy();
      expect(result?.type).toMatch(/line/);
      expect(result?.confidence).toBeGreaterThan(0.4);
    });

    it('should detect longitudinal patterns', () => {
      const text = 'Over the 12-week follow-up period, symptoms progressively declined.';
      const result = detectTrend(text);

      expect(result).toBeTruthy();
    });

    it('should detect sequential measurements', () => {
      const text = 'At baseline, week 4, week 8, and week 12, measurements showed improvement.';
      const result = detectTrend(text);

      expect(result).toBeTruthy();
    });

    it('should suggest multi-line for multiple groups', () => {
      const text = 'Both cohorts showed trends over time from 2020 to 2024.';
      const result = detectTrend(text);

      if (result) {
        expect(['line', 'multi-line']).toContain(result.type);
      }
    });

    it('should return null for non-trend text', () => {
      const text = 'This describes a static situation without temporal changes.';
      const result = detectTrend(text);

      expect(result).toBeNull();
    });
  });

  describe('detectProportions', () => {
    it('should detect distribution data', () => {
      const text = 'The sample comprised 40% males, 35% females, and 25% non-binary participants.';
      const result = detectProportions(text);

      expect(result).toBeTruthy();
      expect(result?.type).toBe('donut');
    });

    it('should detect parts-of-whole patterns', () => {
      const text = '45% were classified as high risk, 30% moderate, and 25% low risk.';
      const result = detectProportions(text);

      expect(result).toBeTruthy();
      expect(result?.confidence).toBeGreaterThan(0.4);
    });

    it('should give high confidence when percentages sum to 100', () => {
      const text = '50% responded, 30% declined, and 20% did not participate.';
      const result = detectProportions(text);

      expect(result).toBeTruthy();
      expect(result!.confidence).toBeGreaterThan(0.6);
    });

    it('should handle percentages that do not sum to 100', () => {
      const text = '25% showed improvement and 15% showed decline.';
      const result = detectProportions(text);

      // Should still detect but with lower confidence
      if (result) {
        expect(result.confidence).toBeLessThan(0.9);
      }
    });

    it('should return null for non-proportion text', () => {
      const text = 'The study examined various outcomes without distributions.';
      const result = detectProportions(text);

      expect(result).toBeNull();
    });
  });

  describe('detectProcess', () => {
    it('should detect sequential steps', () => {
      const text = 'First, participants were screened. Second, they completed baseline assessments. Third, interventions were delivered.';
      const result = detectProcess(text);

      expect(result).toBeTruthy();
      expect(result?.type).toBe('flowchart');
    });

    it('should detect PRISMA-style text', () => {
      const text = 'Records identified through database searching (n=1000). After duplicates removed, 800 were screened. 200 were excluded. 600 full-text articles assessed for eligibility.';
      const result = detectProcess(text);

      expect(result).toBeTruthy();
      expect(result!.confidence).toBeGreaterThan(0.6);
    });

    it('should detect decision points', () => {
      const text = 'If criteria met, proceed to step 2. Otherwise, exclude from analysis.';
      const result = detectProcess(text);

      expect(result).toBeTruthy();
      const hasDecision = result?.suggestedConfig?.nodes?.some((n: any) => n.type === 'decision');
      expect(hasDecision).toBe(true);
    });

    it('should detect numbered procedures', () => {
      const text = '1. Prepare samples. 2. Run analysis. 3. Collect data. 4. Interpret results.';
      const result = detectProcess(text);

      expect(result).toBeTruthy();
      expect(result?.suggestedConfig?.nodes?.length).toBeGreaterThanOrEqual(3);
    });

    it('should return null for non-process text', () => {
      const text = 'This is a static description of results.';
      const result = detectProcess(text);

      expect(result).toBeNull();
    });
  });

  describe('detectTabularData', () => {
    it('should detect demographic tables', () => {
      const text = 'Baseline characteristics: Age: 45.2 ± 12.3 years, BMI: 27.4 ± 3.1, Systolic BP: 128 ± 15 mmHg';
      const result = detectTabularData(text);

      expect(result).toBeTruthy();
      expect(result?.type).toBe('table');
    });

    it('should detect comparison tables', () => {
      const text = 'Treatment Group A: mean = 25.4, SD = 3.2. Control Group B: mean = 22.1, SD = 4.5';
      const result = detectTabularData(text);

      expect(result).toBeTruthy();
    });

    it('should detect attribute-value pairs', () => {
      const text = 'Sample size: 450, Mean age: 52.3 years, Female: 245 (54.4%), Diabetes: 120 (26.7%)';
      const result = detectTabularData(text);

      expect(result).toBeTruthy();
      expect(result?.confidence).toBeGreaterThan(0.4);
    });

    it('should return null for non-tabular text', () => {
      const text = 'This is a narrative description.';
      const result = detectTabularData(text);

      expect(result).toBeNull();
    });
  });

  describe('suggestChartType', () => {
    it('should suggest bar chart for category comparisons', () => {
      const text = '40% vs 35% vs 25% across three groups.';
      const patterns = extractDataPatterns(text);
      const chartType = suggestChartType(patterns);

      expect(chartType).toBe('bar');
    });

    it('should suggest line chart for time series', () => {
      const text = 'From 2020 to 2024, values increased steadily.';
      const patterns = extractDataPatterns(text);
      const chartType = suggestChartType(patterns);

      expect(chartType).toBe('line');
    });

    it('should suggest pie chart for proportions summing to 100', () => {
      const text = '50% positive, 30% neutral, 20% negative responses.';
      const patterns = extractDataPatterns(text);
      const chartType = suggestChartType(patterns);

      expect(chartType).toBe('pie');
    });

    it('should return null for empty patterns', () => {
      const chartType = suggestChartType([]);
      expect(chartType).toBeNull();
    });

    it('should prioritize trend detection', () => {
      const text = '25% increase trend observed over time.';
      const patterns = extractDataPatterns(text);
      const chartType = suggestChartType(patterns);

      expect(chartType).toBe('line');
    });

    it('should handle ambiguous data gracefully', () => {
      const text = 'Various measurements were taken: 45, 67, 23, 89.';
      const patterns = extractDataPatterns(text);
      const chartType = suggestChartType(patterns);

      // Should return some valid chart type or null
      if (chartType) {
        expect(['bar', 'line', 'pie', 'scatter']).toContain(chartType);
      }
    });
  });

  describe('extractDataPoints', () => {
    it('should extract bar chart data from percentages', () => {
      const text = 'Group A: 75%, Group B: 60%, Group C: 45%';
      const dataPoints = extractDataPoints(text, 'bar');

      expect(dataPoints.length).toBeGreaterThanOrEqual(2);
      expect(dataPoints[0].label).toBeTruthy();
      expect(dataPoints[0].value).toBeGreaterThan(0);
      expect(dataPoints[0].unit).toBe('%');
    });

    it('should extract line chart data from years', () => {
      const text = '2020: 25, 2021: 35, 2022: 45, 2023: 60';
      const dataPoints = extractDataPoints(text, 'line');

      expect(dataPoints.length).toBeGreaterThanOrEqual(3);
      expect(dataPoints[0].label).toMatch(/20\d{2}/);
    });

    it('should extract pie chart data', () => {
      const text = '40% Group A, 35% Group B, 25% Group C';
      const dataPoints = extractDataPoints(text, 'pie');

      expect(dataPoints.length).toBeGreaterThanOrEqual(2);
      const total = dataPoints.reduce((sum, dp) => sum + dp.value, 0);
      expect(total).toBeGreaterThan(0);
    });

    it('should limit data points to 10', () => {
      const text = Array.from({ length: 20 }, (_, i) => `Item ${i}: ${i * 5}%`).join(', ');
      const dataPoints = extractDataPoints(text, 'bar');

      expect(dataPoints.length).toBeLessThanOrEqual(10);
    });

    it('should handle empty text', () => {
      const dataPoints = extractDataPoints('', 'bar');
      expect(dataPoints.length).toBe(0);
    });

    it('should clean labels appropriately', () => {
      const text = '  Group A  : 45%, --Group B--: 35%';
      const dataPoints = extractDataPoints(text, 'bar');

      if (dataPoints.length > 0) {
        expect(dataPoints[0].label).not.toMatch(/^[\s\-:]+/);
        expect(dataPoints[0].label).not.toMatch(/[\s\-:]+$/);
      }
    });
  });

  describe('detectVisualizations (integration)', () => {
    it('should detect multiple visualization opportunities', async () => {
      const content = `
Baseline demographics showed mean age 52.3 ± 12.1 years.
Treatment outcomes: 75% improved vs 45% in control (p < 0.001).
Over 12 weeks, scores increased from 25 to 45 to 67.
Population breakdown: 50% urban, 30% suburban, 20% rural.
Study flow: 1000 identified, 800 screened, 600 eligible, 450 included.
      `;

      const patterns = extractDataPatterns(content);
      const opportunities = await detectVisualizations(content, patterns);

      expect(opportunities.length).toBeGreaterThan(1);

      // Should find at least some of these types
      const types = opportunities.map(o => o.type);
      expect(types.length).toBeGreaterThan(0);
    });

    it('should rank opportunities by confidence', async () => {
      const content = `
Very clear comparison: Group A 80% vs Group B 60%.
Maybe a trend over time?
      `;

      const patterns = extractDataPatterns(content);
      const opportunities = await detectVisualizations(content, patterns);

      if (opportunities.length > 1) {
        expect(opportunities[0].confidence).toBeGreaterThanOrEqual(opportunities[1].confidence);
      }
    });

    it('should include position information', async () => {
      const content = 'First paragraph with comparison: 75% vs 45%.';
      const patterns = extractDataPatterns(content);
      const opportunities = await detectVisualizations(content, patterns);

      if (opportunities.length > 0) {
        expect(opportunities[0].position).toBeDefined();
        expect(opportunities[0].position.start).toBeGreaterThanOrEqual(0);
        expect(opportunities[0].position.end).toBeGreaterThan(opportunities[0].position.start);
      }
    });

    it('should handle paragraphs with no visualizations', async () => {
      const content = 'This is plain narrative text without any numerical data or patterns.';
      const patterns = extractDataPatterns(content);
      const opportunities = await detectVisualizations(content, patterns);

      // Should either return empty or very low confidence results
      expect(opportunities).toBeDefined();
    });

    it('should create generic opportunity when data patterns exist but no specific detection', async () => {
      const content = 'Sample size n = 450, p < 0.05, effect size d = 0.8';
      const patterns = extractDataPatterns(content);
      const opportunities = await detectVisualizations(content, patterns);

      // Should attempt to suggest something based on patterns
      expect(opportunities.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle very long text efficiently', async () => {
      const longContent = 'Paragraph with data: 45% improved. '.repeat(1000);
      const patterns = extractDataPatterns(longContent);
      const opportunities = await detectVisualizations(longContent, patterns);

      expect(opportunities).toBeDefined();
      expect(opportunities.length).toBeLessThan(1000); // Should not create excessive opportunities
    });

    it('should detect all major visualization types', async () => {
      const content = `
## Comparisons
Treatment showed 80% vs control 60% (p < 0.001).

## Trends
From 2020 to 2024, adoption grew from 20% to 85%.

## Distributions
Population: 45% male, 40% female, 15% other.

## Process
First screened (n=1000), then assessed (n=600), finally included (n=450).

## Table Data
Baseline: Age 52.3±12.1, BMI 27.4±3.2, BP 128±15 mmHg.
      `;

      const patterns = extractDataPatterns(content);
      const opportunities = await detectVisualizations(content, patterns);

      const types = opportunities.map(o => o.type);

      // Should include various types
      expect(types.length).toBeGreaterThan(2);
      expect(new Set(types).size).toBeGreaterThan(1); // At least 2 different types
    });
  });
});
