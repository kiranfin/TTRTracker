import Svg, { Path } from 'react-native-svg';

type SparklineProps = {
  values: number[];
  color: string;
  height?: number;
  // Fläche unter der Linie, 0 schaltet sie ab
  fillOpacity?: number;
};

const WIDTH = 240;
const PADDING = 4;

// Kompakte Verlaufslinie ohne Achsen, gleiche react-native-svg Basis wie TtrLineChart.
export function Sparkline({ values, color, height = 56, fillOpacity = 0.2 }: SparklineProps) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  const points = values.map((value, index) => ({
    x: PADDING + (index / (values.length - 1)) * (WIDTH - PADDING * 2),
    y: height - PADDING - ((value - min) / range) * (height - PADDING * 2),
  }));

  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const area = `${line} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
      <Svg width="100%" height={height} viewBox={`0 0 ${WIDTH} ${height}`} preserveAspectRatio="none">
        {fillOpacity > 0 ? <Path d={area} fill={color} fillOpacity={fillOpacity} /> : null}
        <Path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
  );
}
