'use client';

/**
 * Presentation Generator - Chart Renderer
 * Phase 7D: SVG-based chart visualization component
 *
 * Provides professional, theme-aware charts for presentation slides
 * using pure SVG (no external charting libraries required)
 *
 * Supported chart types:
 * - Bar charts (vertical, horizontal, stacked)
 * - Line charts (single, multi-line)
 * - Area charts (with gradient fills)
 * - Scatter plots (with optional trend line and R² calculation)
 * - Bubble charts (scatter with size variation)
 * - Pie/Donut charts
 * - Box plots (statistical distributions with quartiles and outliers)
 *
 * Features:
 * - Interactive hover states with value tooltips
 * - Statistical annotations (p-values, significance markers, confidence intervals)
 * - Linear regression trend lines with R² display
 * - Responsive sizing and theme integration
 * - Academic-quality styling suitable for scientific presentations
 */

import { useState, useEffect, useMemo } from 'react';
import { ChartConfig, ChartType, ChartData, Theme } from '../types';
import { getChartColor } from '../themes';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface SlideChartProps {
  config: ChartConfig;
  theme: Theme;
  width?: number;
  height?: number;
  className?: string;
}

interface ChartComponentProps {
  data: ChartData;
  options: ChartConfig['options'];
  colors: string[];
  width: number;
  height: number;
  theme: Theme;
}

interface Point {
  x: number;
  y: number;
}

interface ScatterPoint {
  x: number;
  y: number;
  label?: string;
  size?: number;
}

interface BoxPlotData {
  label: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers?: number[];
}

interface BarLayout {
  bars: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    value: number;
    color: string;
  }>;
  maxValue: number;
  xScale: (index: number) => number;
  yScale: (value: number) => number;
}

interface PieSlice {
  path: string;
  color: string;
  label: string;
  value: number;
  percentage: number;
  startAngle: number;
  endAngle: number;
  midAngle: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate contrasting text color for a background
 */
function getContrastColor(bgColor: string): string {
  // Simple luminance calculation
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Format axis labels with appropriate precision
 */
function formatAxisLabel(value: number): string {
  if (value === 0) return '0';
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`;
  if (Math.abs(value) < 0.01) return value.toExponential(1);
  if (Math.abs(value) < 1) return value.toFixed(2);
  if (Math.abs(value) < 10) return value.toFixed(1);
  return Math.round(value).toString();
}

/**
 * Calculate bar chart layout with positions and dimensions
 */
function calculateBarLayout(
  data: ChartData,
  width: number,
  height: number,
  colors: string[],
  stacked: boolean = false
): BarLayout {
  const padding = { top: 20, right: 20, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Get all values to determine max
  const allValues = data.datasets.flatMap(ds => ds.data);
  const maxValue = Math.max(...allValues, 0);
  const yMax = maxValue * 1.1; // Add 10% padding

  // Calculate bar positioning
  const barGroupWidth = chartWidth / data.labels.length;
  const barWidth = stacked
    ? barGroupWidth * 0.7
    : (barGroupWidth * 0.7) / data.datasets.length;
  const barGap = stacked ? 0 : 4;

  const bars: BarLayout['bars'] = [];

  data.labels.forEach((label, labelIndex) => {
    if (stacked) {
      // Stacked bars
      let stackY = padding.top + chartHeight;
      data.datasets.forEach((dataset, datasetIndex) => {
        const value = dataset.data[labelIndex] || 0;
        const barHeight = (value / yMax) * chartHeight;
        stackY -= barHeight;

        bars.push({
          x: padding.left + labelIndex * barGroupWidth + (barGroupWidth - barWidth) / 2,
          y: stackY,
          width: barWidth,
          height: barHeight,
          label: dataset.label,
          value,
          color: Array.isArray(dataset.backgroundColor)
            ? dataset.backgroundColor[labelIndex] || colors[datasetIndex % colors.length]
            : dataset.backgroundColor || colors[datasetIndex % colors.length],
        });
      });
    } else {
      // Grouped bars
      data.datasets.forEach((dataset, datasetIndex) => {
        const value = dataset.data[labelIndex] || 0;
        const barHeight = (value / yMax) * chartHeight;
        const x = padding.left +
                  labelIndex * barGroupWidth +
                  (barGroupWidth - (barWidth * data.datasets.length + barGap * (data.datasets.length - 1))) / 2 +
                  datasetIndex * (barWidth + barGap);

        bars.push({
          x,
          y: padding.top + chartHeight - barHeight,
          width: barWidth,
          height: barHeight,
          label: dataset.label,
          value,
          color: Array.isArray(dataset.backgroundColor)
            ? dataset.backgroundColor[labelIndex] || colors[datasetIndex % colors.length]
            : dataset.backgroundColor || colors[datasetIndex % colors.length],
        });
      });
    }
  });

  return {
    bars,
    maxValue: yMax,
    xScale: (index: number) => padding.left + index * barGroupWidth + barGroupWidth / 2,
    yScale: (value: number) => padding.top + chartHeight - (value / yMax) * chartHeight,
  };
}

/**
 * Calculate pie/donut chart slices with SVG paths
 */
function calculatePieSlices(
  data: ChartData,
  radius: number,
  centerX: number,
  centerY: number,
  innerRadius: number = 0,
  colors: string[]
): PieSlice[] {
  const dataset = data.datasets[0];
  if (!dataset) return [];

  const total = dataset.data.reduce((sum, val) => sum + val, 0);
  if (total === 0) return [];

  let currentAngle = -Math.PI / 2; // Start at top
  const slices: PieSlice[] = [];

  dataset.data.forEach((value, index) => {
    const percentage = (value / total) * 100;
    const angle = (value / total) * 2 * Math.PI;
    const endAngle = currentAngle + angle;
    const midAngle = currentAngle + angle / 2;

    // Calculate arc path
    const startX = centerX + Math.cos(currentAngle) * radius;
    const startY = centerY + Math.sin(currentAngle) * radius;
    const endX = centerX + Math.cos(endAngle) * radius;
    const endY = centerY + Math.sin(endAngle) * radius;

    const largeArcFlag = angle > Math.PI ? 1 : 0;

    let path: string;
    if (innerRadius > 0) {
      // Donut chart
      const innerStartX = centerX + Math.cos(currentAngle) * innerRadius;
      const innerStartY = centerY + Math.sin(currentAngle) * innerRadius;
      const innerEndX = centerX + Math.cos(endAngle) * innerRadius;
      const innerEndY = centerY + Math.sin(endAngle) * innerRadius;

      path = [
        `M ${startX} ${startY}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        `L ${innerEndX} ${innerEndY}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}`,
        'Z',
      ].join(' ');
    } else {
      // Pie chart
      path = [
        `M ${centerX} ${centerY}`,
        `L ${startX} ${startY}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        'Z',
      ].join(' ');
    }

    slices.push({
      path,
      color: Array.isArray(dataset.backgroundColor)
        ? dataset.backgroundColor[index] || colors[index % colors.length]
        : colors[index % colors.length],
      label: data.labels[index] || '',
      value,
      percentage,
      startAngle: currentAngle,
      endAngle,
      midAngle,
    });

    currentAngle = endAngle;
  });

  return slices;
}

/**
 * Generate SVG path for a line chart
 */
function generateLinePath(points: Point[]): string {
  if (points.length === 0) return '';

  const pathCommands = points.map((point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${command} ${point.x} ${point.y}`;
  });

  return pathCommands.join(' ');
}

/**
 * Generate smooth curve path using quadratic bezier
 */
function generateSmoothPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;

    if (i === 0) {
      path += ` L ${midX} ${midY}`;
    } else {
      path += ` Q ${current.x} ${current.y} ${midX} ${midY}`;
    }
  }

  const last = points[points.length - 1];
  const secondLast = points[points.length - 2];
  path += ` Q ${secondLast.x} ${secondLast.y} ${last.x} ${last.y}`;

  return path;
}

/**
 * Calculate linear regression trend line
 */
function calculateTrendLine(points: { x: number; y: number }[]): {
  slope: number;
  intercept: number;
  r2: number;
} {
  if (points.length < 2) {
    return { slope: 0, intercept: 0, r2: 0 };
  }

  const n = points.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;

  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumXX += point.x * point.x;
    sumYY += point.y * point.y;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const meanY = sumY / n;
  let ssTotal = 0;
  let ssResidual = 0;

  for (const point of points) {
    const predicted = slope * point.x + intercept;
    ssTotal += Math.pow(point.y - meanY, 2);
    ssResidual += Math.pow(point.y - predicted, 2);
  }

  const r2 = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;

  return { slope, intercept, r2 };
}

// ============================================================================
// CHART COMPONENTS
// ============================================================================

/**
 * Bar Chart Component
 */
function BarChart({ data, options, colors, width, height, theme }: ChartComponentProps) {
  const layout = useMemo(
    () => calculateBarLayout(data, width, height, colors, options.stacked),
    [data, width, height, colors, options.stacked]
  );

  const padding = { top: 20, right: 20, bottom: 60, left: 60 };
  const chartHeight = height - padding.top - padding.bottom;

  // Generate Y-axis ticks
  const yTicks = useMemo(() => {
    const tickCount = 5;
    const ticks: number[] = [];
    for (let i = 0; i <= tickCount; i++) {
      ticks.push((layout.maxValue / tickCount) * i);
    }
    return ticks;
  }, [layout.maxValue]);

  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  return (
    <svg width={width} height={height} className="chart-svg">
      {/* Grid lines */}
      {options.showGrid !== false && (
        <g className="grid">
          {yTicks.map((tick, i) => (
            <line
              key={i}
              x1={padding.left}
              y1={layout.yScale(tick)}
              x2={width - padding.right}
              y2={layout.yScale(tick)}
              stroke={theme.colors.border}
              strokeOpacity={0.5}
              strokeWidth={1}
            />
          ))}
        </g>
      )}

      {/* Y-axis */}
      <g className="y-axis">
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke={theme.colors.text}
          strokeWidth={2}
        />
        {yTicks.map((tick, i) => (
          <text
            key={i}
            x={padding.left - 10}
            y={layout.yScale(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            fill={theme.colors.textMuted}
            fontSize={12}
            fontFamily={theme.fonts.body}
          >
            {formatAxisLabel(tick)}
          </text>
        ))}
      </g>

      {/* X-axis */}
      <g className="x-axis">
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke={theme.colors.text}
          strokeWidth={2}
        />
        {data.labels.map((label, i) => (
          <text
            key={i}
            x={layout.xScale(i)}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            fill={theme.colors.textMuted}
            fontSize={12}
            fontFamily={theme.fonts.body}
          >
            {label}
          </text>
        ))}
      </g>

      {/* Bars */}
      <g className="bars">
        {layout.bars.map((bar, i) => (
          <g key={i}>
            <rect
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              fill={bar.color}
              opacity={hoveredBar === i ? 0.8 : 1}
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
              style={{ transition: 'opacity 0.2s', cursor: 'pointer' }}
            />
            {hoveredBar === i && (
              <text
                x={bar.x + bar.width / 2}
                y={bar.y - 5}
                textAnchor="middle"
                fill={theme.colors.text}
                fontSize={11}
                fontWeight={600}
                fontFamily={theme.fonts.body}
              >
                {formatAxisLabel(bar.value)}
              </text>
            )}
          </g>
        ))}
      </g>

      {/* Title */}
      {options.title && (
        <text
          x={width / 2}
          y={15}
          textAnchor="middle"
          fill={theme.colors.text}
          fontSize={16}
          fontWeight={theme.styles.headingWeight}
          fontFamily={theme.fonts.heading}
        >
          {options.title}
        </text>
      )}
    </svg>
  );
}

/**
 * Horizontal Bar Chart Component
 */
function HorizontalBarChart({ data, options, colors, width, height, theme }: ChartComponentProps) {
  const padding = { top: 20, right: 60, bottom: 40, left: 120 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const allValues = data.datasets.flatMap(ds => ds.data);
  const maxValue = Math.max(...allValues, 0) * 1.1;

  const barHeight = (chartHeight / data.labels.length) * 0.7;
  const barGap = (chartHeight / data.labels.length) * 0.3;

  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  return (
    <svg width={width} height={height} className="chart-svg">
      {/* Grid lines */}
      {options.showGrid !== false && (
        <g className="grid">
          {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => (
            <line
              key={i}
              x1={padding.left + chartWidth * fraction}
              y1={padding.top}
              x2={padding.left + chartWidth * fraction}
              y2={height - padding.bottom}
              stroke={theme.colors.border}
              strokeOpacity={0.5}
              strokeWidth={1}
            />
          ))}
        </g>
      )}

      {/* Y-axis labels */}
      <g className="y-axis">
        {data.labels.map((label, i) => (
          <text
            key={i}
            x={padding.left - 10}
            y={padding.top + i * (barHeight + barGap) + barHeight / 2}
            textAnchor="end"
            dominantBaseline="middle"
            fill={theme.colors.textMuted}
            fontSize={12}
            fontFamily={theme.fonts.body}
          >
            {label}
          </text>
        ))}
      </g>

      {/* X-axis */}
      <g className="x-axis">
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke={theme.colors.text}
          strokeWidth={2}
        />
        {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => (
          <text
            key={i}
            x={padding.left + chartWidth * fraction}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            fill={theme.colors.textMuted}
            fontSize={12}
            fontFamily={theme.fonts.body}
          >
            {formatAxisLabel(maxValue * fraction)}
          </text>
        ))}
      </g>

      {/* Bars */}
      <g className="bars">
        {data.datasets[0]?.data.map((value, i) => {
          const barWidth = (value / maxValue) * chartWidth;
          const y = padding.top + i * (barHeight + barGap);
          const color = Array.isArray(data.datasets[0].backgroundColor)
            ? data.datasets[0].backgroundColor[i] || colors[i % colors.length]
            : colors[i % colors.length];

          return (
            <g key={i}>
              <rect
                x={padding.left}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                opacity={hoveredBar === i ? 0.8 : 1}
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
                style={{ transition: 'opacity 0.2s', cursor: 'pointer' }}
              />
              {hoveredBar === i && (
                <text
                  x={padding.left + barWidth + 5}
                  y={y + barHeight / 2}
                  dominantBaseline="middle"
                  fill={theme.colors.text}
                  fontSize={11}
                  fontWeight={600}
                  fontFamily={theme.fonts.body}
                >
                  {formatAxisLabel(value)}
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* Title */}
      {options.title && (
        <text
          x={width / 2}
          y={15}
          textAnchor="middle"
          fill={theme.colors.text}
          fontSize={16}
          fontWeight={theme.styles.headingWeight}
          fontFamily={theme.fonts.heading}
        >
          {options.title}
        </text>
      )}
    </svg>
  );
}

/**
 * Line Chart Component
 */
function LineChart({ data, options, colors, width, height, theme }: ChartComponentProps) {
  const padding = { top: 40, right: 20, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const allValues = data.datasets.flatMap(ds => ds.data);
  const maxValue = Math.max(...allValues, 0) * 1.1;
  const minValue = Math.min(...allValues, 0);
  const valueRange = maxValue - minValue;

  const xScale = (index: number) => padding.left + (index / (data.labels.length - 1)) * chartWidth;
  const yScale = (value: number) => padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  const yTicks = useMemo(() => {
    const tickCount = 5;
    const ticks: number[] = [];
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(minValue + (valueRange / tickCount) * i);
    }
    return ticks;
  }, [minValue, valueRange]);

  const [hoveredPoint, setHoveredPoint] = useState<{ datasetIndex: number; pointIndex: number } | null>(null);

  return (
    <svg width={width} height={height} className="chart-svg">
      {/* Grid lines */}
      {options.showGrid !== false && (
        <g className="grid">
          {yTicks.map((tick, i) => (
            <line
              key={i}
              x1={padding.left}
              y1={yScale(tick)}
              x2={width - padding.right}
              y2={yScale(tick)}
              stroke={theme.colors.border}
              strokeOpacity={0.5}
              strokeWidth={1}
              strokeDasharray="4 2"
            />
          ))}
        </g>
      )}

      {/* Axes */}
      <g className="axes">
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke={theme.colors.text}
          strokeWidth={2}
        />
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke={theme.colors.text}
          strokeWidth={2}
        />
      </g>

      {/* Y-axis labels */}
      <g className="y-axis-labels">
        {yTicks.map((tick, i) => (
          <text
            key={i}
            x={padding.left - 10}
            y={yScale(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            fill={theme.colors.textMuted}
            fontSize={12}
            fontFamily={theme.fonts.body}
          >
            {formatAxisLabel(tick)}
          </text>
        ))}
      </g>

      {/* X-axis labels */}
      <g className="x-axis-labels">
        {data.labels.map((label, i) => (
          <text
            key={i}
            x={xScale(i)}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            fill={theme.colors.textMuted}
            fontSize={12}
            fontFamily={theme.fonts.body}
          >
            {label}
          </text>
        ))}
      </g>

      {/* Lines and points */}
      {data.datasets.map((dataset, datasetIndex) => {
        const points: Point[] = dataset.data.map((value, i) => ({
          x: xScale(i),
          y: yScale(value),
        }));

        const linePath = generateSmoothPath(points);
        const color = dataset.borderColor || colors[datasetIndex % colors.length];

        return (
          <g key={datasetIndex}>
            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Points */}
            {points.map((point, pointIndex) => {
              const isHovered =
                hoveredPoint?.datasetIndex === datasetIndex && hoveredPoint?.pointIndex === pointIndex;

              return (
                <g key={pointIndex}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isHovered ? 5 : 3}
                    fill={color}
                    stroke={theme.colors.background}
                    strokeWidth={2}
                    onMouseEnter={() => setHoveredPoint({ datasetIndex, pointIndex })}
                    onMouseLeave={() => setHoveredPoint(null)}
                    style={{ transition: 'r 0.2s', cursor: 'pointer' }}
                  />
                  {isHovered && (
                    <text
                      x={point.x}
                      y={point.y - 15}
                      textAnchor="middle"
                      fill={theme.colors.text}
                      fontSize={11}
                      fontWeight={600}
                      fontFamily={theme.fonts.body}
                    >
                      {formatAxisLabel(dataset.data[pointIndex])}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Title */}
      {options.title && (
        <text
          x={width / 2}
          y={20}
          textAnchor="middle"
          fill={theme.colors.text}
          fontSize={16}
          fontWeight={theme.styles.headingWeight}
          fontFamily={theme.fonts.heading}
        >
          {options.title}
        </text>
      )}
    </svg>
  );
}

/**
 * Pie/Donut Chart Component
 */
function PieChart({ data, options, colors, width, height, theme, donut = false }: ChartComponentProps & { donut?: boolean }) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35;
  const innerRadius = donut ? radius * 0.5 : 0;

  const slices = useMemo(
    () => calculatePieSlices(data, radius, centerX, centerY, innerRadius, colors),
    [data, radius, centerX, centerY, innerRadius, colors]
  );

  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);

  // Legend position
  const showLegend = options.showLegend !== false;
  const legendY = height - 40;

  return (
    <svg width={width} height={height} className="chart-svg">
      {/* Slices */}
      <g className="slices">
        {slices.map((slice, i) => {
          const isHovered = hoveredSlice === i;

          // Calculate label position
          const labelRadius = donut ? (radius + innerRadius) / 2 : radius * 0.7;
          const labelX = centerX + Math.cos(slice.midAngle) * labelRadius;
          const labelY = centerY + Math.sin(slice.midAngle) * labelRadius;

          return (
            <g key={i}>
              <path
                d={slice.path}
                fill={slice.color}
                opacity={isHovered ? 0.8 : 1}
                onMouseEnter={() => setHoveredSlice(i)}
                onMouseLeave={() => setHoveredSlice(null)}
                style={{ transition: 'opacity 0.2s', cursor: 'pointer' }}
              />
              {isHovered && slice.percentage > 5 && (
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={getContrastColor(slice.color)}
                  fontSize={12}
                  fontWeight={600}
                  fontFamily={theme.fonts.body}
                >
                  {slice.percentage.toFixed(1)}%
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* Center label for donut */}
      {donut && (
        <g className="center-label">
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={theme.colors.text}
            fontSize={14}
            fontWeight={600}
            fontFamily={theme.fonts.body}
          >
            Total
          </text>
          <text
            x={centerX}
            y={centerY + 18}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={theme.colors.textMuted}
            fontSize={12}
            fontFamily={theme.fonts.body}
          >
            {formatAxisLabel(slices.reduce((sum, s) => sum + s.value, 0))}
          </text>
        </g>
      )}

      {/* Title */}
      {options.title && (
        <text
          x={width / 2}
          y={20}
          textAnchor="middle"
          fill={theme.colors.text}
          fontSize={16}
          fontWeight={theme.styles.headingWeight}
          fontFamily={theme.fonts.heading}
        >
          {options.title}
        </text>
      )}

      {/* Legend */}
      {showLegend && (
        <g className="legend">
          {slices.map((slice, i) => {
            const itemWidth = 120;
            const itemsPerRow = Math.floor(width / itemWidth);
            const row = Math.floor(i / itemsPerRow);
            const col = i % itemsPerRow;
            const x = (width - itemsPerRow * itemWidth) / 2 + col * itemWidth;
            const y = legendY + row * 20;

            return (
              <g key={i}>
                <rect x={x} y={y - 8} width={12} height={12} fill={slice.color} rx={2} />
                <text
                  x={x + 18}
                  y={y}
                  dominantBaseline="middle"
                  fill={theme.colors.textMuted}
                  fontSize={11}
                  fontFamily={theme.fonts.body}
                >
                  {slice.label}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}

/**
 * Statistical Annotation Component
 */
function StatisticalAnnotation({
  x,
  y,
  text,
  type,
  theme,
}: {
  x: number;
  y: number;
  text: string;
  type: 'pValue' | 'significance' | 'ci' | 'label';
  theme: Theme;
}) {
  const getAnnotationStyle = () => {
    switch (type) {
      case 'pValue':
        return {
          fontSize: 10,
          fontStyle: 'italic',
          color: theme.colors.textMuted,
        };
      case 'significance':
        return {
          fontSize: 14,
          fontWeight: 700,
          color: theme.colors.accent,
        };
      case 'ci':
        return {
          fontSize: 9,
          fontStyle: 'italic',
          color: theme.colors.textMuted,
        };
      case 'label':
      default:
        return {
          fontSize: 11,
          fontWeight: 500,
          color: theme.colors.text,
        };
    }
  };

  const style = getAnnotationStyle();

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      fill={style.color}
      fontSize={style.fontSize}
      fontWeight={style.fontWeight || 400}
      fontStyle={style.fontStyle || 'normal'}
      fontFamily={theme.fonts.body}
    >
      {text}
    </text>
  );
}

/**
 * Scatter Chart Component (with bubble chart variant)
 */
function ScatterChart({
  data,
  options,
  colors,
  width,
  height,
  theme,
}: ChartComponentProps & { data: ChartData & { points?: ScatterPoint[] } }) {
  const padding = { top: 40, right: 20, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Get scatter points from data
  const scatterPoints: ScatterPoint[] = data.points || [];

  // If no explicit points, convert from datasets
  if (scatterPoints.length === 0 && data.datasets.length > 0) {
    data.datasets.forEach((dataset, datasetIndex) => {
      dataset.data.forEach((value, index) => {
        scatterPoints.push({
          x: index,
          y: value,
          label: data.labels[index],
          size: 1,
        });
      });
    });
  }

  // Calculate ranges
  const xValues = scatterPoints.map(p => p.x);
  const yValues = scatterPoints.map(p => p.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues, 0);
  const maxY = Math.max(...yValues);

  const xRange = maxX - minX || 1;
  const yRange = maxY - minY || 1;

  const xScale = (value: number) => padding.left + ((value - minX) / xRange) * chartWidth;
  const yScale = (value: number) => padding.top + chartHeight - ((value - minY) / yRange) * chartHeight;

  // Generate axis ticks
  const xTicks = useMemo(() => {
    const tickCount = 5;
    const ticks: number[] = [];
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(minX + (xRange / tickCount) * i);
    }
    return ticks;
  }, [minX, xRange]);

  const yTicks = useMemo(() => {
    const tickCount = 5;
    const ticks: number[] = [];
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(minY + (yRange / tickCount) * i);
    }
    return ticks;
  }, [minY, yRange]);

  // Calculate trend line if enabled
  const showTrendLine = options.showTrendLine !== false;
  const trendLine = useMemo(() => {
    if (!showTrendLine) return null;
    return calculateTrendLine(scatterPoints.map(p => ({ x: p.x, y: p.y })));
  }, [scatterPoints, showTrendLine]);

  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  return (
    <svg width={width} height={height} className="chart-svg">
      {/* Grid lines */}
      {options.showGrid !== false && (
        <g className="grid">
          {yTicks.map((tick, i) => (
            <line
              key={`y-${i}`}
              x1={padding.left}
              y1={yScale(tick)}
              x2={width - padding.right}
              y2={yScale(tick)}
              stroke={theme.colors.border}
              strokeOpacity={0.5}
              strokeWidth={1}
              strokeDasharray="4 2"
            />
          ))}
          {xTicks.map((tick, i) => (
            <line
              key={`x-${i}`}
              x1={xScale(tick)}
              y1={padding.top}
              x2={xScale(tick)}
              y2={height - padding.bottom}
              stroke={theme.colors.border}
              strokeOpacity={0.5}
              strokeWidth={1}
              strokeDasharray="4 2"
            />
          ))}
        </g>
      )}

      {/* Axes */}
      <g className="axes">
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke={theme.colors.text}
          strokeWidth={2}
        />
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke={theme.colors.text}
          strokeWidth={2}
        />
      </g>

      {/* Axis labels */}
      <g className="axis-labels">
        {yTicks.map((tick, i) => (
          <text
            key={`y-label-${i}`}
            x={padding.left - 10}
            y={yScale(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            fill={theme.colors.textMuted}
            fontSize={12}
            fontFamily={theme.fonts.body}
          >
            {formatAxisLabel(tick)}
          </text>
        ))}
        {xTicks.map((tick, i) => (
          <text
            key={`x-label-${i}`}
            x={xScale(tick)}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            fill={theme.colors.textMuted}
            fontSize={12}
            fontFamily={theme.fonts.body}
          >
            {formatAxisLabel(tick)}
          </text>
        ))}
      </g>

      {/* Trend line */}
      {trendLine && trendLine.r2 > 0 && (
        <g className="trend-line">
          <line
            x1={xScale(minX)}
            y1={yScale(trendLine.slope * minX + trendLine.intercept)}
            x2={xScale(maxX)}
            y2={yScale(trendLine.slope * maxX + trendLine.intercept)}
            stroke={theme.colors.accent}
            strokeWidth={2}
            strokeDasharray="8 4"
            opacity={0.7}
          />
          <text
            x={width - padding.right - 10}
            y={padding.top + 20}
            textAnchor="end"
            fill={theme.colors.accent}
            fontSize={10}
            fontFamily={theme.fonts.body}
          >
            R² = {trendLine.r2.toFixed(3)}
          </text>
        </g>
      )}

      {/* Scatter points */}
      <g className="points">
        {scatterPoints.map((point, i) => {
          const isHovered = hoveredPoint === i;
          const pointSize = (point.size || 1) * (isHovered ? 8 : 6);
          const px = xScale(point.x);
          const py = yScale(point.y);

          return (
            <g key={i}>
              <circle
                cx={px}
                cy={py}
                r={pointSize}
                fill={colors[0]}
                fillOpacity={0.7}
                stroke={theme.colors.background}
                strokeWidth={2}
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
                style={{ transition: 'r 0.2s', cursor: 'pointer' }}
              />
              {isHovered && (
                <>
                  <rect
                    x={px + 10}
                    y={py - 30}
                    width={80}
                    height={40}
                    fill={theme.colors.background}
                    stroke={theme.colors.border}
                    strokeWidth={1}
                    rx={4}
                    opacity={0.95}
                  />
                  <text
                    x={px + 50}
                    y={py - 18}
                    textAnchor="middle"
                    fill={theme.colors.text}
                    fontSize={10}
                    fontWeight={600}
                    fontFamily={theme.fonts.body}
                  >
                    {point.label || `Point ${i + 1}`}
                  </text>
                  <text
                    x={px + 50}
                    y={py - 5}
                    textAnchor="middle"
                    fill={theme.colors.textMuted}
                    fontSize={9}
                    fontFamily={theme.fonts.body}
                  >
                    ({formatAxisLabel(point.x)}, {formatAxisLabel(point.y)})
                  </text>
                </>
              )}
            </g>
          );
        })}
      </g>

      {/* Title */}
      {options.title && (
        <text
          x={width / 2}
          y={20}
          textAnchor="middle"
          fill={theme.colors.text}
          fontSize={16}
          fontWeight={theme.styles.headingWeight}
          fontFamily={theme.fonts.heading}
        >
          {options.title}
        </text>
      )}
    </svg>
  );
}

/**
 * Area Chart Component
 */
function AreaChart({ data, options, colors, width, height, theme }: ChartComponentProps) {
  const padding = { top: 40, right: 20, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const allValues = data.datasets.flatMap(ds => ds.data);
  const maxValue = Math.max(...allValues, 0) * 1.1;
  const minValue = Math.min(...allValues, 0);
  const valueRange = maxValue - minValue;

  const xScale = (index: number) => padding.left + (index / (data.labels.length - 1)) * chartWidth;
  const yScale = (value: number) => padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  const yTicks = useMemo(() => {
    const tickCount = 5;
    const ticks: number[] = [];
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(minValue + (valueRange / tickCount) * i);
    }
    return ticks;
  }, [minValue, valueRange]);

  const [hoveredPoint, setHoveredPoint] = useState<{ datasetIndex: number; pointIndex: number } | null>(null);

  return (
    <svg width={width} height={height} className="chart-svg">
      {/* Grid lines */}
      {options.showGrid !== false && (
        <g className="grid">
          {yTicks.map((tick, i) => (
            <line
              key={i}
              x1={padding.left}
              y1={yScale(tick)}
              x2={width - padding.right}
              y2={yScale(tick)}
              stroke={theme.colors.border}
              strokeOpacity={0.5}
              strokeWidth={1}
              strokeDasharray="4 2"
            />
          ))}
        </g>
      )}

      {/* Axes */}
      <g className="axes">
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke={theme.colors.text}
          strokeWidth={2}
        />
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke={theme.colors.text}
          strokeWidth={2}
        />
      </g>

      {/* Y-axis labels */}
      <g className="y-axis-labels">
        {yTicks.map((tick, i) => (
          <text
            key={i}
            x={padding.left - 10}
            y={yScale(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            fill={theme.colors.textMuted}
            fontSize={12}
            fontFamily={theme.fonts.body}
          >
            {formatAxisLabel(tick)}
          </text>
        ))}
      </g>

      {/* X-axis labels */}
      <g className="x-axis-labels">
        {data.labels.map((label, i) => (
          <text
            key={i}
            x={xScale(i)}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            fill={theme.colors.textMuted}
            fontSize={12}
            fontFamily={theme.fonts.body}
          >
            {label}
          </text>
        ))}
      </g>

      {/* Areas and lines */}
      {data.datasets.map((dataset, datasetIndex) => {
        const points: Point[] = dataset.data.map((value, i) => ({
          x: xScale(i),
          y: yScale(value),
        }));

        const linePath = generateSmoothPath(points);

        // Create area path (close to bottom)
        const areaPath = linePath +
          ` L ${points[points.length - 1].x} ${height - padding.bottom}` +
          ` L ${points[0].x} ${height - padding.bottom}` +
          ' Z';

        const color = dataset.borderColor || colors[datasetIndex % colors.length];
        const fillColor = dataset.backgroundColor || color;

        return (
          <g key={datasetIndex}>
            {/* Gradient definition */}
            <defs>
              <linearGradient id={`area-gradient-${datasetIndex}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={Array.isArray(fillColor) ? fillColor[0] : fillColor} stopOpacity={0.5} />
                <stop offset="100%" stopColor={Array.isArray(fillColor) ? fillColor[0] : fillColor} stopOpacity={0.05} />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <path
              d={areaPath}
              fill={`url(#area-gradient-${datasetIndex})`}
            />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Points */}
            {points.map((point, pointIndex) => {
              const isHovered =
                hoveredPoint?.datasetIndex === datasetIndex && hoveredPoint?.pointIndex === pointIndex;

              return (
                <g key={pointIndex}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isHovered ? 5 : 3}
                    fill={color}
                    stroke={theme.colors.background}
                    strokeWidth={2}
                    onMouseEnter={() => setHoveredPoint({ datasetIndex, pointIndex })}
                    onMouseLeave={() => setHoveredPoint(null)}
                    style={{ transition: 'r 0.2s', cursor: 'pointer' }}
                  />
                  {isHovered && (
                    <text
                      x={point.x}
                      y={point.y - 15}
                      textAnchor="middle"
                      fill={theme.colors.text}
                      fontSize={11}
                      fontWeight={600}
                      fontFamily={theme.fonts.body}
                    >
                      {formatAxisLabel(dataset.data[pointIndex])}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Title */}
      {options.title && (
        <text
          x={width / 2}
          y={20}
          textAnchor="middle"
          fill={theme.colors.text}
          fontSize={16}
          fontWeight={theme.styles.headingWeight}
          fontFamily={theme.fonts.heading}
        >
          {options.title}
        </text>
      )}
    </svg>
  );
}

/**
 * Box Plot Component for statistical distributions
 */
function BoxPlot({
  data,
  options,
  colors,
  width,
  height,
  theme,
}: {
  data: { datasets: BoxPlotData[] };
  options: ChartComponentProps['options'];
  colors: string[];
  width: number;
  height: number;
  theme: Theme;
}) {
  const padding = { top: 40, right: 20, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate global min/max for y-axis
  const allValues = data.datasets.flatMap(d => [
    d.min,
    d.q1,
    d.median,
    d.q3,
    d.max,
    ...(d.outliers || []),
  ]);
  const minValue = Math.min(...allValues) * 0.9;
  const maxValue = Math.max(...allValues) * 1.1;
  const valueRange = maxValue - minValue;

  const yScale = (value: number) => padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  const boxWidth = (chartWidth / data.datasets.length) * 0.6;
  const boxSpacing = chartWidth / data.datasets.length;

  const yTicks = useMemo(() => {
    const tickCount = 5;
    const ticks: number[] = [];
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(minValue + (valueRange / tickCount) * i);
    }
    return ticks;
  }, [minValue, valueRange]);

  const [hoveredBox, setHoveredBox] = useState<number | null>(null);

  return (
    <svg width={width} height={height} className="chart-svg">
      {/* Grid lines */}
      {options.showGrid !== false && (
        <g className="grid">
          {yTicks.map((tick, i) => (
            <line
              key={i}
              x1={padding.left}
              y1={yScale(tick)}
              x2={width - padding.right}
              y2={yScale(tick)}
              stroke={theme.colors.border}
              strokeOpacity={0.5}
              strokeWidth={1}
              strokeDasharray="4 2"
            />
          ))}
        </g>
      )}

      {/* Axes */}
      <g className="axes">
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke={theme.colors.text}
          strokeWidth={2}
        />
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke={theme.colors.text}
          strokeWidth={2}
        />
      </g>

      {/* Y-axis labels */}
      <g className="y-axis-labels">
        {yTicks.map((tick, i) => (
          <text
            key={i}
            x={padding.left - 10}
            y={yScale(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            fill={theme.colors.textMuted}
            fontSize={12}
            fontFamily={theme.fonts.body}
          >
            {formatAxisLabel(tick)}
          </text>
        ))}
      </g>

      {/* Box plots */}
      <g className="boxes">
        {data.datasets.map((boxData, i) => {
          const centerX = padding.left + i * boxSpacing + boxSpacing / 2;
          const isHovered = hoveredBox === i;
          const color = colors[i % colors.length];

          // Y positions
          const yMin = yScale(boxData.min);
          const yQ1 = yScale(boxData.q1);
          const yMedian = yScale(boxData.median);
          const yQ3 = yScale(boxData.q3);
          const yMax = yScale(boxData.max);

          return (
            <g key={i}>
              {/* Whisker lines (min to Q1, Q3 to max) */}
              <line
                x1={centerX}
                y1={yMin}
                x2={centerX}
                y2={yQ1}
                stroke={color}
                strokeWidth={2}
              />
              <line
                x1={centerX}
                y1={yQ3}
                x2={centerX}
                y2={yMax}
                stroke={color}
                strokeWidth={2}
              />

              {/* Whisker caps */}
              <line
                x1={centerX - boxWidth / 4}
                y1={yMin}
                x2={centerX + boxWidth / 4}
                y2={yMin}
                stroke={color}
                strokeWidth={2}
              />
              <line
                x1={centerX - boxWidth / 4}
                y1={yMax}
                x2={centerX + boxWidth / 4}
                y2={yMax}
                stroke={color}
                strokeWidth={2}
              />

              {/* IQR box (Q1 to Q3) */}
              <rect
                x={centerX - boxWidth / 2}
                y={yQ3}
                width={boxWidth}
                height={yQ1 - yQ3}
                fill={color}
                fillOpacity={isHovered ? 0.4 : 0.3}
                stroke={color}
                strokeWidth={2}
                onMouseEnter={() => setHoveredBox(i)}
                onMouseLeave={() => setHoveredBox(null)}
                style={{ transition: 'fill-opacity 0.2s', cursor: 'pointer' }}
              />

              {/* Median line */}
              <line
                x1={centerX - boxWidth / 2}
                y1={yMedian}
                x2={centerX + boxWidth / 2}
                y2={yMedian}
                stroke={theme.colors.text}
                strokeWidth={3}
              />

              {/* Outliers */}
              {boxData.outliers?.map((outlier, oi) => (
                <circle
                  key={oi}
                  cx={centerX}
                  cy={yScale(outlier)}
                  r={3}
                  fill={color}
                  fillOpacity={0.6}
                />
              ))}

              {/* X-axis label */}
              <text
                x={centerX}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                fill={theme.colors.textMuted}
                fontSize={12}
                fontFamily={theme.fonts.body}
              >
                {boxData.label}
              </text>

              {/* Hover info */}
              {isHovered && (
                <g>
                  <rect
                    x={centerX + boxWidth / 2 + 10}
                    y={yQ3 - 10}
                    width={90}
                    height={80}
                    fill={theme.colors.background}
                    stroke={theme.colors.border}
                    strokeWidth={1}
                    rx={4}
                    opacity={0.95}
                  />
                  <text
                    x={centerX + boxWidth / 2 + 55}
                    y={yQ3 + 5}
                    textAnchor="middle"
                    fill={theme.colors.text}
                    fontSize={9}
                    fontFamily={theme.fonts.body}
                  >
                    Max: {formatAxisLabel(boxData.max)}
                  </text>
                  <text
                    x={centerX + boxWidth / 2 + 55}
                    y={yQ3 + 18}
                    textAnchor="middle"
                    fill={theme.colors.text}
                    fontSize={9}
                    fontFamily={theme.fonts.body}
                  >
                    Q3: {formatAxisLabel(boxData.q3)}
                  </text>
                  <text
                    x={centerX + boxWidth / 2 + 55}
                    y={yQ3 + 31}
                    textAnchor="middle"
                    fill={theme.colors.text}
                    fontSize={9}
                    fontWeight={600}
                    fontFamily={theme.fonts.body}
                  >
                    Med: {formatAxisLabel(boxData.median)}
                  </text>
                  <text
                    x={centerX + boxWidth / 2 + 55}
                    y={yQ3 + 44}
                    textAnchor="middle"
                    fill={theme.colors.text}
                    fontSize={9}
                    fontFamily={theme.fonts.body}
                  >
                    Q1: {formatAxisLabel(boxData.q1)}
                  </text>
                  <text
                    x={centerX + boxWidth / 2 + 55}
                    y={yQ3 + 57}
                    textAnchor="middle"
                    fill={theme.colors.text}
                    fontSize={9}
                    fontFamily={theme.fonts.body}
                  >
                    Min: {formatAxisLabel(boxData.min)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* Title */}
      {options.title && (
        <text
          x={width / 2}
          y={20}
          textAnchor="middle"
          fill={theme.colors.text}
          fontSize={16}
          fontWeight={theme.styles.headingWeight}
          fontFamily={theme.fonts.heading}
        >
          {options.title}
        </text>
      )}
    </svg>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Main chart renderer component for presentation slides
 * Supports bar, horizontal bar, line, area, scatter, bubble, pie, donut, and box plot charts
 * All charts are rendered with pure SVG (no external dependencies)
 */
export function SlideChart({
  config,
  theme,
  width = 800,
  height = 450,
  className = '',
}: SlideChartProps) {
  // Get chart colors from theme
  const colors = useMemo(() => {
    return config.data.datasets.length === 1
      ? theme.colors.chart
      : config.data.datasets.map((_, i) => getChartColor(theme, i));
  }, [config.data.datasets, theme]);

  // Common props for all chart types
  const chartProps: ChartComponentProps = {
    data: config.data,
    options: config.options,
    colors,
    width,
    height,
    theme,
  };

  // Render appropriate chart type
  const renderChart = () => {
    switch (config.type) {
      case 'bar':
      case 'stacked-bar':
        return <BarChart {...chartProps} />;

      case 'horizontal-bar':
        return <HorizontalBarChart {...chartProps} />;

      case 'line':
      case 'multi-line':
        return <LineChart {...chartProps} />;

      case 'area':
        return <AreaChart {...chartProps} />;

      case 'scatter':
      case 'bubble':
        return <ScatterChart {...chartProps} data={config.data as ChartData & { points?: ScatterPoint[] }} />;

      case 'box-plot':
        return <BoxPlot data={config.data as unknown as { datasets: BoxPlotData[] }} options={config.options} colors={colors} width={width} height={height} theme={theme} />;

      case 'pie':
        return <PieChart {...chartProps} donut={false} />;

      case 'donut':
        return <PieChart {...chartProps} donut={true} />;

      default:
        return (
          <div
            style={{
              width,
              height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.textMuted,
              fontFamily: theme.fonts.body,
            }}
          >
            Chart type &quot;{config.type}&quot; not yet implemented
          </div>
        );
    }
  };

  return (
    <div className={`slide-chart ${className}`} style={{ width, height }}>
      {renderChart()}

      {/* Data source citation */}
      {config.source && (
        <div
          style={{
            marginTop: 8,
            fontSize: 10,
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.body,
            fontStyle: 'italic',
            textAlign: 'right',
          }}
        >
          Source: {config.source}
        </div>
      )}

      {/* Legend for multi-dataset charts */}
      {config.data.datasets.length > 1 &&
       config.options.showLegend !== false &&
       !['pie', 'donut'].includes(config.type) && (
        <div
          style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            marginTop: 12,
            flexWrap: 'wrap',
          }}
        >
          {config.data.datasets.map((dataset, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: colors[i],
                  borderRadius: 2,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: theme.colors.textMuted,
                  fontFamily: theme.fonts.body,
                }}
              >
                {dataset.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Export helper types for external use
export type { ScatterPoint, BoxPlotData };

// Export StatisticalAnnotation for external use in custom visualizations
export { StatisticalAnnotation };
