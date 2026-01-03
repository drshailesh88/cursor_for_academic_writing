import { describe, it, expect } from 'vitest';
import {
  RESEARCH_MODE_CONFIGS,
  type ResearchMode,
  type ResearchConfig,
} from '@/lib/deep-research/types';

describe('Deep Research Types', () => {
  describe('RESEARCH_MODE_CONFIGS', () => {
    const modes: ResearchMode[] = ['quick', 'standard', 'deep', 'exhaustive', 'systematic'];

    it('should have configurations for all research modes', () => {
      modes.forEach((mode) => {
        expect(RESEARCH_MODE_CONFIGS[mode]).toBeDefined();
      });
    });

    it('should have increasing depth as mode intensity increases', () => {
      const depths = modes.map((mode) => RESEARCH_MODE_CONFIGS[mode].depth);
      for (let i = 1; i < depths.length; i++) {
        expect(depths[i]).toBeGreaterThanOrEqual(depths[i - 1]);
      }
    });

    it('should have increasing breadth as mode intensity increases', () => {
      const breadths = modes.map((mode) => RESEARCH_MODE_CONFIGS[mode].breadth);
      for (let i = 1; i < breadths.length; i++) {
        expect(breadths[i]).toBeGreaterThanOrEqual(breadths[i - 1]);
      }
    });

    it('should have increasing maxSources as mode intensity increases', () => {
      const maxSources = modes.map((mode) => RESEARCH_MODE_CONFIGS[mode].maxSources);
      for (let i = 1; i < maxSources.length; i++) {
        expect(maxSources[i]).toBeGreaterThan(maxSources[i - 1]);
      }
    });

    it('quick mode should have minimal configuration', () => {
      const config = RESEARCH_MODE_CONFIGS.quick;
      expect(config.depth).toBe(1);
      expect(config.breadth).toBe(3);
      expect(config.maxSources).toBe(10);
    });

    it('systematic mode should have maximum configuration', () => {
      const config = RESEARCH_MODE_CONFIGS.systematic;
      expect(config.depth).toBe(6);
      expect(config.breadth).toBe(8);
      expect(config.maxSources).toBe(200);
      expect(config.sources).toHaveLength(6);
    });

    it('all modes should have valid date ranges', () => {
      modes.forEach((mode) => {
        const config = RESEARCH_MODE_CONFIGS[mode];
        expect(config.dateRange.start).toBeInstanceOf(Date);
        expect(config.dateRange.end).toBeInstanceOf(Date);
        expect(config.dateRange.start.getTime()).toBeLessThan(config.dateRange.end.getTime());
      });
    });

    it('all modes should have at least one article type', () => {
      modes.forEach((mode) => {
        expect(RESEARCH_MODE_CONFIGS[mode].articleTypes.length).toBeGreaterThan(0);
      });
    });

    it('all modes should include English as a language', () => {
      modes.forEach((mode) => {
        expect(RESEARCH_MODE_CONFIGS[mode].languages).toContain('en');
      });
    });
  });
});
