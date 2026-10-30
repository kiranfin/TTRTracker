import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { font } from '@/src/theme/typography';
import type { NormalizedTtrHistoryEvent } from '@/src/types/tttracker';
import { parseDateValue } from '@/src/utils/dates';
import { getEventTtr } from '../utils';
import { styles } from '../styles';

const HEIGHT = 150;
const TOP = 20;
const BOTTOM = 130;
const LABEL_WIDTH = 34;
const AXIS_LABELS = 6;

// Saubere Stufen für die Hilfslinien (50er, 25er oder 10er Schritte)
function niceBounds(min: number, max: number) {
  const span = Math.max(1, max - min);
  const step = span > 120 ? 50 : span > 50 ? 25 : 10;
  const low = Math.floor(min / step) * step;
  const high = Math.max(low + step * 2, Math.ceil(max / step) * step);

  return { low, high, mid: Math.round((low + high) / 2) };
}

export function TtrLineChart({ events }: { events: NormalizedTtrHistoryEvent[] }) {
  const { colors } = useTheme();
  const { language } = useI18n();
  const [width, setWidth] = useState(0);

  const values = events
      .map((event) => getEventTtr(event))
      .filter((value): value is number => typeof value === 'number');

  if (values.length < 2) return null;

  const { low, high, mid } = niceBounds(Math.min(...values), Math.max(...values));
  const range = Math.max(1, high - low);
  const plotLeft = LABEL_WIDTH;
  const plotRight = Math.max(plotLeft + 10, width - 10);

  const yFor = (value: number) => BOTTOM - ((value - low) / range) * (BOTTOM - TOP);

  const points = values.map((value, index) => ({
    x: plotLeft + (index / Math.max(1, values.length - 1)) * (plotRight - plotLeft),
    y: yFor(value),
    value,
  }));

  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const last = points[points.length - 1];
  const area = `${line} L ${last.x} ${BOTTOM} L ${points[0].x} ${BOTTOM} Z`;

  const bubbleWidth = 50;
  const bubbleX = Math.min(plotRight - bubbleWidth, Math.max(plotLeft, last.x - bubbleWidth / 2));
  const bubbleY = last.y - 36 < 0 ? last.y + 12 : last.y - 34;

  // Monatsnamen gleichmäßig über den Zeitraum verteilt
  const datedEvents = events.map((event) => parseDateValue(event.date)).filter((date): date is Date => Boolean(date));
  const axisLabels =
      datedEvents.length > 1
          ? Array.from({ length: AXIS_LABELS }, (_, index) => {
            const date = datedEvents[Math.round((index / (AXIS_LABELS - 1)) * (datedEvents.length - 1))];
            return date
                .toLocaleDateString(language === 'de' ? 'de-DE' : 'en-GB', { month: 'short' })
                .replace('.', '')
                .slice(0, 3);
          })
          : [];

  const labelFont = font('500').fontFamily;

  return (
      <View style={styles.lineChartWrap}>
        <View style={{ height: HEIGHT }} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
          {width > 0 ? (
              <Svg width={width} height={HEIGHT}>
                {[high, mid].map((value) => (
                    <Line
                        key={value}
                        x1={0}
                        x2={width}
                        y1={yFor(value)}
                        y2={yFor(value)}
                        stroke={colors.border}
                        strokeDasharray="3 4"
                    />
                ))}
                <Line x1={0} x2={width} y1={BOTTOM} y2={BOTTOM} stroke={colors.border} />

                {[high, mid, low].map((value) => (
                    <SvgText key={`label-${value}`} x={0} y={yFor(value) - 5} fill={colors.mutedText} fontSize="11" fontFamily={labelFont}>
                      {value}
                    </SvgText>
                ))}

                <Path d={area} fill={colors.primarySoft} />
                <Path d={line} fill="none" stroke={colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                <Circle cx={last.x} cy={last.y} r={5} fill={colors.card} stroke={colors.primary} strokeWidth={3} />

                <Rect x={bubbleX} y={bubbleY} width={bubbleWidth} height={22} rx={6} fill={colors.text} />
                <SvgText
                    x={bubbleX + bubbleWidth / 2}
                    y={bubbleY + 15}
                    fill={colors.card}
                    fontSize="12"
                    fontFamily={font('700').fontFamily}
                    textAnchor="middle"
                >
                  {last.value}
                </SvgText>
              </Svg>
          ) : null}
        </View>

        {axisLabels.length > 0 ? (
            <View style={[styles.axisRow, { paddingLeft: LABEL_WIDTH - 8 }]}>
              {axisLabels.map((label, index) => (
                  <Text key={`${label}-${index}`} style={[styles.axisLabel, { color: colors.mutedText }]}>
                    {label}
                  </Text>
              ))}
            </View>
        ) : null}
      </View>
  );
}
