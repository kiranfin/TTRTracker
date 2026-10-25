import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type SparklineProps = {
  values: number[];
  color: string;
  height?: number;
  // Fläche unter der Linie, 0 schaltet sie ab
  fillOpacity?: number;
  // Punkt am letzten Wert
  endDot?: boolean;
};

const PADDING = 6;

// Kompakte Verlaufslinie ohne Achsen. Misst die eigene Breite, damit die Linie nicht verzerrt wird.
export function Sparkline({ values, color, height = 56, fillOpacity = 0, endDot }: SparklineProps) {
  const [width, setWidth] = useState(0);

  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  const points =
      width > 0
          ? values.map((value, index) => ({
            x: PADDING + (index / (values.length - 1)) * (width - PADDING * 2),
            y: height - PADDING - ((value - min) / range) * (height - PADDING * 2),
          }))
          : [];

  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const last = points[points.length - 1];
  const area = last ? `${line} L ${last.x} ${height} L ${points[0].x} ${height} Z` : '';

  return (
      <View style={{ height }} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 ? (
            <Svg width={width} height={height}>
              {fillOpacity > 0 ? <Path d={area} fill={color} fillOpacity={fillOpacity} /> : null}
              <Path d={line} fill="none" stroke={color} strokeOpacity={0.9} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              {endDot && last ? <Circle cx={last.x} cy={last.y} r={4} fill={color} /> : null}
            </Svg>
        ) : null}
      </View>
  );
}
