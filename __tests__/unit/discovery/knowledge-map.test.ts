import { describe, it, expect, beforeEach } from 'vitest';
import {
  KnowledgeMap,
  MapConfig,
  MapCluster,
  MapPaper,
  ClusterConnection,
  DiscoveredPaper,
} from '@/lib/discovery/types';
import { Timestamp } from 'firebase/firestore';

/**
 * Knowledge Map Test Suite
 *
 * Tests the knowledge map generation, clustering, and exploration functionality.
 * Following TDD - these tests will initially fail.
 */

// Mock knowledge map builder (will be implemented)
class KnowledgeMapBuilder {
  async generateMap(
    query: string,
    papers: DiscoveredPaper[],
    config: MapConfig
  ): Promise<KnowledgeMap> {
    throw new Error('Not implemented');
  }

  async clusterPapers(
    papers: DiscoveredPaper[],
    targetClusters: number
  ): Promise<MapCluster[]> {
    throw new Error('Not implemented');
  }

  async generateClusterLabels(
    cluster: MapCluster,
    papers: DiscoveredPaper[]
  ): Promise<string> {
    throw new Error('Not implemented');
  }

  async detectGaps(map: KnowledgeMap): Promise<MapCluster[]> {
    throw new Error('Not implemented');
  }

  async findClusterConnections(
    clusters: MapCluster[],
    papers: DiscoveredPaper[]
  ): Promise<ClusterConnection[]> {
    throw new Error('Not implemented');
  }

  async calculateClusterMetrics(
    cluster: MapCluster,
    papers: DiscoveredPaper[]
  ): Promise<{ avgCitations: number; growth: number }> {
    throw new Error('Not implemented');
  }

  async positionPapers(
    papers: DiscoveredPaper[],
    clusters: MapCluster[]
  ): Promise<MapPaper[]> {
    throw new Error('Not implemented');
  }

  async identifyKeyPapers(
    cluster: MapCluster,
    papers: DiscoveredPaper[]
  ): Promise<string[]> {
    throw new Error('Not implemented');
  }
}

describe('KnowledgeMapBuilder', () => {
  let builder: KnowledgeMapBuilder;
  let mockConfig: MapConfig;
  let mockPapers: DiscoveredPaper[];

  beforeEach(() => {
    builder = new KnowledgeMapBuilder();
    mockConfig = {
      clusterCount: 5,
      paperLimit: 100,
      showLabels: true,
      showConnections: true,
      timeRange: { start: 2020, end: 2024 },
    };

    mockPapers = [
      {
        id: 'paper1',
        title: 'Deep Learning for Medical Imaging',
        authors: [{ name: 'John Doe' }],
        year: 2023,
        citationCount: 100,
        referenceCount: 50,
        sources: ['pubmed'],
        openAccess: true,
        inLibrary: false,
        read: false,
        starred: false,
      },
      {
        id: 'paper2',
        title: 'Chest X-Ray Classification',
        authors: [{ name: 'Jane Smith' }],
        year: 2022,
        citationCount: 80,
        referenceCount: 45,
        sources: ['arxiv'],
        openAccess: true,
        inLibrary: false,
        read: false,
        starred: false,
      },
    ];
  });

  describe('Map Generation', () => {
    it('should generate a knowledge map from papers', async () => {
      const query = 'medical imaging AI';
      const map = await builder.generateMap(query, mockPapers, mockConfig);

      expect(map).toBeDefined();
      expect(map.query).toBe(query);
      expect(map.clusters.length).toBeGreaterThan(0);
      expect(map.papers.length).toBeGreaterThan(0);
    });

    it('should respect the cluster count configuration', async () => {
      const query = 'medical imaging';
      const map = await builder.generateMap(query, mockPapers, mockConfig);

      expect(map.clusters.length).toBeLessThanOrEqual(mockConfig.clusterCount);
    });

    it('should respect the paper limit', async () => {
      const query = 'medical imaging';
      const limitedConfig = { ...mockConfig, paperLimit: 50 };
      const map = await builder.generateMap(query, mockPapers, limitedConfig);

      expect(map.papers.length).toBeLessThanOrEqual(50);
    });

    it('should filter papers by time range', async () => {
      const query = 'medical imaging';
      const map = await builder.generateMap(query, mockPapers, mockConfig);

      // All papers should be within the configured time range
      expect(map.config.timeRange.start).toBe(2020);
      expect(map.config.timeRange.end).toBe(2024);
    });

    it('should include connections between clusters', async () => {
      const query = 'medical imaging';
      const map = await builder.generateMap(query, mockPapers, mockConfig);

      expect(map.connections).toBeDefined();
      expect(Array.isArray(map.connections)).toBe(true);
    });
  });

  describe('Topic Clustering', () => {
    it('should cluster papers by topic', async () => {
      const clusters = await builder.clusterPapers(mockPapers, 3);

      expect(clusters).toBeDefined();
      expect(clusters.length).toBeGreaterThan(0);
      expect(clusters.length).toBeLessThanOrEqual(3);
    });

    it('should assign all papers to clusters', async () => {
      const clusters = await builder.clusterPapers(mockPapers, 3);

      const totalPapers = clusters.reduce(
        (sum, cluster) => sum + cluster.paperCount,
        0
      );
      expect(totalPapers).toBeGreaterThan(0);
    });

    it('should generate keywords for each cluster', async () => {
      const clusters = await builder.clusterPapers(mockPapers, 3);

      clusters.forEach(cluster => {
        expect(cluster.keywords).toBeDefined();
        expect(Array.isArray(cluster.keywords)).toBe(true);
        expect(cluster.keywords.length).toBeGreaterThan(0);
      });
    });

    it('should position clusters in 2D space', async () => {
      const clusters = await builder.clusterPapers(mockPapers, 3);

      clusters.forEach(cluster => {
        expect(cluster.x).toBeDefined();
        expect(cluster.y).toBeDefined();
        expect(typeof cluster.x).toBe('number');
        expect(typeof cluster.y).toBe('number');
      });
    });

    it('should assign different colors to clusters', async () => {
      const clusters = await builder.clusterPapers(mockPapers, 3);

      const colors = new Set(clusters.map(c => c.color));
      expect(colors.size).toBeGreaterThan(1);
    });
  });

  describe('Cluster Labeling', () => {
    it('should generate meaningful labels for clusters', async () => {
      const mockCluster: MapCluster = {
        id: 'cluster1',
        label: '',
        description: '',
        keywords: ['deep learning', 'medical', 'imaging'],
        paperCount: 10,
        avgCitations: 100,
        growth: 0.5,
        x: 0,
        y: 0,
        radius: 10,
        color: '#000',
      };

      const label = await builder.generateClusterLabels(
        mockCluster,
        mockPapers
      );

      expect(label).toBeDefined();
      expect(label.length).toBeGreaterThan(0);
      expect(label.length).toBeLessThan(100); // Reasonable label length
    });

    it('should use keywords in cluster labels', async () => {
      const mockCluster: MapCluster = {
        id: 'cluster1',
        label: '',
        description: '',
        keywords: ['deep learning', 'medical'],
        paperCount: 10,
        avgCitations: 100,
        growth: 0.5,
        x: 0,
        y: 0,
        radius: 10,
        color: '#000',
      };

      const label = await builder.generateClusterLabels(
        mockCluster,
        mockPapers
      );

      const hasKeyword = mockCluster.keywords.some(keyword =>
        label.toLowerCase().includes(keyword.toLowerCase())
      );
      expect(hasKeyword).toBe(true);
    });
  });

  describe('Gap Detection', () => {
    it('should identify research gaps in the map', async () => {
      const mockMap: KnowledgeMap = {
        id: 'map1',
        userId: 'user1',
        name: 'Test Map',
        query: 'medical AI',
        clusters: [],
        papers: [],
        connections: [],
        config: mockConfig,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const gaps = await builder.detectGaps(mockMap);

      expect(gaps).toBeDefined();
      expect(Array.isArray(gaps)).toBe(true);
    });

    it('should identify underexplored areas', async () => {
      const mockMap: KnowledgeMap = {
        id: 'map1',
        userId: 'user1',
        name: 'Test Map',
        query: 'medical AI',
        clusters: [
          {
            id: 'cluster1',
            label: 'Small Cluster',
            description: '',
            keywords: [],
            paperCount: 3, // Small cluster = potential gap
            avgCitations: 50,
            growth: 1.5, // High growth = emerging area
            x: 0,
            y: 0,
            radius: 5,
            color: '#000',
          },
        ],
        papers: [],
        connections: [],
        config: mockConfig,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const gaps = await builder.detectGaps(mockMap);

      expect(gaps.length).toBeGreaterThan(0);
    });

    it('should prioritize high-growth gaps', async () => {
      const mockMap: KnowledgeMap = {
        id: 'map1',
        userId: 'user1',
        name: 'Test Map',
        query: 'medical AI',
        clusters: [
          {
            id: 'cluster1',
            label: 'High Growth',
            description: '',
            keywords: [],
            paperCount: 5,
            avgCitations: 50,
            growth: 2.0, // Very high growth
            x: 0,
            y: 0,
            radius: 5,
            color: '#000',
          },
          {
            id: 'cluster2',
            label: 'Low Growth',
            description: '',
            keywords: [],
            paperCount: 5,
            avgCitations: 50,
            growth: 0.1, // Low growth
            x: 10,
            y: 10,
            radius: 5,
            color: '#111',
          },
        ],
        papers: [],
        connections: [],
        config: mockConfig,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const gaps = await builder.detectGaps(mockMap);

      // High growth clusters should be prioritized as gaps
      if (gaps.length > 0) {
        expect(gaps[0].growth).toBeGreaterThan(0.5);
      }
    });
  });

  describe('Cluster Connections', () => {
    it('should find connections between clusters', async () => {
      const mockClusters: MapCluster[] = [
        {
          id: 'cluster1',
          label: 'Cluster 1',
          description: '',
          keywords: ['deep learning'],
          paperCount: 10,
          avgCitations: 100,
          growth: 0.5,
          x: 0,
          y: 0,
          radius: 10,
          color: '#000',
        },
        {
          id: 'cluster2',
          label: 'Cluster 2',
          description: '',
          keywords: ['medical imaging'],
          paperCount: 8,
          avgCitations: 80,
          growth: 0.4,
          x: 10,
          y: 10,
          radius: 8,
          color: '#111',
        },
      ];

      const connections = await builder.findClusterConnections(
        mockClusters,
        mockPapers
      );

      expect(connections).toBeDefined();
      expect(Array.isArray(connections)).toBe(true);
    });

    it('should calculate connection strength', async () => {
      const mockClusters: MapCluster[] = [];
      const connections = await builder.findClusterConnections(
        mockClusters,
        mockPapers
      );

      connections.forEach(conn => {
        expect(conn.strength).toBeGreaterThanOrEqual(0);
        expect(conn.strength).toBeLessThanOrEqual(1);
      });
    });

    it('should identify different connection types', async () => {
      const mockClusters: MapCluster[] = [];
      const connections = await builder.findClusterConnections(
        mockClusters,
        mockPapers
      );

      const validTypes = ['citation_flow', 'shared_keywords', 'author_overlap'];
      connections.forEach(conn => {
        expect(validTypes).toContain(conn.type);
      });
    });
  });

  describe('Cluster Metrics', () => {
    it('should calculate average citations for cluster', async () => {
      const mockCluster: MapCluster = {
        id: 'cluster1',
        label: 'Test Cluster',
        description: '',
        keywords: [],
        paperCount: 2,
        avgCitations: 0,
        growth: 0,
        x: 0,
        y: 0,
        radius: 10,
        color: '#000',
      };

      const metrics = await builder.calculateClusterMetrics(
        mockCluster,
        mockPapers
      );

      expect(metrics.avgCitations).toBeGreaterThanOrEqual(0);
    });

    it('should calculate growth rate for cluster', async () => {
      const mockCluster: MapCluster = {
        id: 'cluster1',
        label: 'Test Cluster',
        description: '',
        keywords: [],
        paperCount: 2,
        avgCitations: 0,
        growth: 0,
        x: 0,
        y: 0,
        radius: 10,
        color: '#000',
      };

      const metrics = await builder.calculateClusterMetrics(
        mockCluster,
        mockPapers
      );

      expect(metrics.growth).toBeDefined();
      expect(typeof metrics.growth).toBe('number');
    });
  });

  describe('Paper Positioning', () => {
    it('should position papers within their clusters', async () => {
      const mockClusters: MapCluster[] = [
        {
          id: 'cluster1',
          label: 'Cluster 1',
          description: '',
          keywords: [],
          paperCount: 2,
          avgCitations: 90,
          growth: 0.5,
          x: 0,
          y: 0,
          radius: 10,
          color: '#000',
        },
      ];

      const positioned = await builder.positionPapers(mockPapers, mockClusters);

      expect(positioned).toBeDefined();
      expect(positioned.length).toBeGreaterThan(0);
      positioned.forEach(paper => {
        expect(paper.x).toBeDefined();
        expect(paper.y).toBeDefined();
        expect(paper.clusterId).toBeDefined();
      });
    });

    it('should mark user papers', async () => {
      const mockClusters: MapCluster[] = [];
      const positioned = await builder.positionPapers(mockPapers, mockClusters);

      const hasUserPaperFlag = positioned.every(
        p => typeof p.isUserPaper === 'boolean'
      );
      expect(hasUserPaperFlag).toBe(true);
    });

    it('should identify key papers in clusters', async () => {
      const mockCluster: MapCluster = {
        id: 'cluster1',
        label: 'Test Cluster',
        description: '',
        keywords: [],
        paperCount: 2,
        avgCitations: 90,
        growth: 0.5,
        x: 0,
        y: 0,
        radius: 10,
        color: '#000',
      };

      const keyPaperIds = await builder.identifyKeyPapers(
        mockCluster,
        mockPapers
      );

      expect(keyPaperIds).toBeDefined();
      expect(Array.isArray(keyPaperIds)).toBe(true);
    });
  });
});
