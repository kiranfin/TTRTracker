import { View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { NormalizedTtrHistoryEvent } from '@/src/types/tttracker';
import { getEventTtr } from '../utils';
import { styles } from '../styles';

export function TtrLineChart({
                          events,
                          highlightedEvent,
                      }: {
    events: NormalizedTtrHistoryEvent[];
    highlightedEvent: NormalizedTtrHistoryEvent | null;
}) {
    const { colors } = useTheme();
    const { t } = useI18n();

    const width = 320;
    const height = 180;
    const paddingX = 22;
    const paddingY = 24;

    const values = events
        .map((event) => getEventTtr(event))
        .filter((value): value is number => typeof value === 'number');

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);

    const points = events.map((event, index) => {
        const value = getEventTtr(event) ?? min;
        const x = paddingX + (index / Math.max(1, events.length - 1)) * (width - paddingX * 2);
        const y = height - paddingY - ((value - min) / range) * (height - paddingY * 2);
        return { x, y, value, event };
    });

    const path = points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');

    const highlightedPoint = points.find((point) => point.event.id === highlightedEvent?.id);

    return (
        <View style={styles.lineChartWrap}>
            <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
                <Line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke={colors.border} strokeWidth="1" />
                <Line x1={paddingX} y1={paddingY} x2={paddingX} y2={height - paddingY} stroke={colors.border} strokeWidth="1" />

                <Path d={path} fill="none" stroke={colors.primary} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

                {points.map((point, index) => (
                    <Circle key={`${point.event.id}-${index}`} cx={point.x} cy={point.y} r={3.5} fill={colors.primary} />
                ))}

                {highlightedPoint ? (
                    <>
                        <Circle cx={highlightedPoint.x} cy={highlightedPoint.y} r={7} fill={colors.card} stroke={colors.primary} strokeWidth="3" />
                        <SvgText
                            x={Math.min(width - 76, Math.max(34, highlightedPoint.x - 28))}
                            y={Math.max(16, highlightedPoint.y - 12)}
                            fill={colors.primary}
                            fontSize="12"
                            fontWeight="800"
                        >
                            {t('player.topValue', { value: highlightedPoint.value })}
                        </SvgText>
                    </>
                ) : null}

                <SvgText x={paddingX} y={height - 5} fill={colors.mutedText} fontSize="11" fontWeight="700">
                    {min}
                </SvgText>
                <SvgText x={paddingX} y={16} fill={colors.mutedText} fontSize="11" fontWeight="700">
                    {max}
                </SvgText>
            </Svg>
        </View>
    );
}
