import { useRef, useState } from 'react';
import type { GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/presentation/theme/useTheme';

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 6;
const ROW_HEIGHT = THUMB_SIZE + 16;

/** Ações de acessibilidade: leitores e teclado ajustam sem depender do toque. */
const A11Y_ACTIONS = [{ name: 'increment' }, { name: 'decrement' }];

type Scale = {
  min: number;
  max: number;
  step: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Valor arredondado ao passo e preso aos limites da escala. */
function snap(value: number, { min, max, step }: Scale): number {
  return clamp(Math.round(value / step) * step, min, max);
}

type ThumbProps = {
  value: number;
  scale: Scale;
  /** Limites efetivos desta alça (no modo duplo, a outra alça os aperta). */
  allowed: { min: number; max: number };
  trackWidth: number;
  onChange: (value: number) => void;
  accessibilityLabel: string;
  accessibilityValueText: string;
};

/**
 * Alça do slider: só desenho e acessibilidade. O toque é tratado na trilha
 * (que conhece a própria largura), então a alça não intercepta gestos.
 */
function Thumb({
  value,
  scale,
  allowed,
  trackWidth,
  onChange,
  accessibilityLabel,
  accessibilityValueText,
}: ThumbProps) {
  const { colors } = useTheme();
  const ratio = (value - scale.min) / (scale.max - scale.min);

  function adjust(delta: number) {
    onChange(clamp(snap(value + delta, scale), allowed.min, allowed.max));
  }

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: accessibilityValueText }}
      accessibilityActions={A11Y_ACTIONS}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') adjust(scale.step);
        if (event.nativeEvent.actionName === 'decrement') adjust(-scale.step);
      }}
      pointerEvents="none"
      style={[
        styles.thumb,
        {
          backgroundColor: colors.accent,
          borderColor: colors.background,
          left: ratio * Math.max(0, trackWidth - THUMB_SIZE),
        },
      ]}
    />
  );
}

type FieldProps = {
  label: string;
  /** Valor formatado (ex.: "de 18 °C a 26 °C") — também vai para o leitor. */
  valueText: string;
  /** Leitura em linguagem natural da escolha (ex.: "de ameno a calor moderado"). */
  feeling: string;
  /** Trecho preenchido da trilha, em fração [0, 1]. */
  fill: { start: number; end: number };
  /** Início do gesto: define o alvo (no modo duplo, qual alça). */
  onScrubStart: (value: number) => void;
  /** Continuação do gesto, já convertida em valor da escala. */
  onScrubMove: (value: number) => void;
  scale: Scale;
  children: (trackWidth: number) => React.ReactNode;
};

/** Moldura comum: rótulo, valor, leitura natural e a trilha que recebe o toque. */
function SliderField({
  label,
  valueText,
  feeling,
  fill,
  onScrubStart,
  onScrubMove,
  scale,
  children,
}: FieldProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);

  /** Posição do toque na trilha → valor da escala. */
  function valueAt(event: GestureResponderEvent): number | null {
    if (trackWidth <= 0) return null;
    const ratio = clamp(event.nativeEvent.locationX / trackWidth, 0, 1);
    return snap(scale.min + ratio * (scale.max - scale.min), scale);
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={[styles.header, { gap: spacing.sm }]}>
        <Text
          style={[
            typography.label,
            styles.headerLabel,
            styles.uppercase,
            { color: colors.textSecondary },
          ]}
        >
          {label}
        </Text>
        {/* O valor nunca quebra: é a leitura que a pessoa acompanha ao arrastar. */}
        <Text
          numberOfLines={1}
          style={[typography.heading, styles.headerValue, { color: colors.textPrimary }]}
        >
          {valueText}
        </Text>
      </View>

      <View
        onLayout={(event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width)}
        onResponderGrant={(event) => {
          const value = valueAt(event);
          if (value !== null) onScrubStart(value);
        }}
        onResponderMove={(event) => {
          const value = valueAt(event);
          if (value !== null) onScrubMove(value);
        }}
        onStartShouldSetResponder={() => true}
        style={styles.trackArea}
      >
        <View
          style={[
            styles.track,
            { backgroundColor: colors.surfaceBorder, borderRadius: radius.pill },
          ]}
        />
        <View
          style={[
            styles.track,
            {
              backgroundColor: colors.accent,
              borderRadius: radius.pill,
              left: `${fill.start * 100}%`,
              right: `${(1 - fill.end) * 100}%`,
            },
          ]}
        />
        {children(trackWidth)}
      </View>

      <Text style={[typography.caption, { color: colors.textSecondary }]}>{feeling}</Text>
    </View>
  );
}

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue: (value: number) => string;
  describeValue: (value: number) => string;
};

/** Slider de um valor (umidade, vento). */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  describeValue,
}: SliderProps) {
  const scale = { min, max, step };

  return (
    <SliderField
      fill={{ start: 0, end: (value - min) / (max - min) }}
      feeling={describeValue(value)}
      label={label}
      onScrubMove={onChange}
      onScrubStart={onChange}
      scale={scale}
      valueText={formatValue(value)}
    >
      {(trackWidth) => (
        <Thumb
          accessibilityLabel={label}
          accessibilityValueText={`${formatValue(value)}, ${describeValue(value)}`}
          allowed={{ min, max }}
          onChange={onChange}
          scale={scale}
          trackWidth={trackWidth}
          value={value}
        />
      )}
    </SliderField>
  );
}

type RangeSliderProps = {
  label: string;
  value: [number, number];
  min: number;
  max: number;
  step?: number;
  /** Amplitude mínima entre as pontas (§3: faixa de temperatura ≥ 4 °C). */
  minSpread?: number;
  onChange: (value: [number, number]) => void;
  formatValue: (min: number, max: number) => string;
  describeValue: (min: number, max: number) => string;
  /** Rótulos das duas alças para o leitor de tela. */
  edgeLabels: { min: string; max: string };
};

/** Slider de faixa, duas alças (temperatura agradável). */
export function RangeSlider({
  label,
  value,
  min,
  max,
  step = 1,
  minSpread = 0,
  onChange,
  formatValue,
  describeValue,
  edgeLabels,
}: RangeSliderProps) {
  const [low, high] = value;
  const scale = { min, max, step };
  const span = max - min;
  const valueText = formatValue(low, high);
  const feeling = describeValue(low, high);
  // A alça é escolhida no toque inicial e não troca no meio do arraste; sem
  // isso, passar o dedo pela outra ponta faria a faixa "pular" de alça.
  const dragging = useRef<'low' | 'high'>('low');

  function moveEdge(next: number, edge: 'low' | 'high') {
    if (edge === 'low') {
      onChange([clamp(next, min, high - minSpread), high]);
    } else {
      onChange([low, clamp(next, low + minSpread, max)]);
    }
  }

  return (
    <SliderField
      fill={{ start: (low - min) / span, end: (high - min) / span }}
      feeling={feeling}
      label={label}
      onScrubMove={(next) => moveEdge(next, dragging.current)}
      onScrubStart={(next) => {
        const edge = Math.abs(next - low) <= Math.abs(next - high) ? 'low' : 'high';
        dragging.current = edge;
        moveEdge(next, edge);
      }}
      scale={scale}
      valueText={valueText}
    >
      {(trackWidth) => (
        <>
          <Thumb
            accessibilityLabel={edgeLabels.min}
            accessibilityValueText={`${valueText}, ${feeling}`}
            allowed={{ min, max: high - minSpread }}
            onChange={(next) => onChange([next, high])}
            scale={scale}
            trackWidth={trackWidth}
            value={low}
          />
          <Thumb
            accessibilityLabel={edgeLabels.max}
            accessibilityValueText={`${valueText}, ${feeling}`}
            allowed={{ min: low + minSpread, max }}
            onChange={(next) => onChange([low, next])}
            scale={scale}
            trackWidth={trackWidth}
            value={high}
          />
        </>
      )}
    </SliderField>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerLabel: {
    flex: 1,
  },
  headerValue: {
    flexShrink: 0,
  },
  thumb: {
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    height: THUMB_SIZE,
    position: 'absolute',
    top: (ROW_HEIGHT - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
  },
  track: {
    height: TRACK_HEIGHT,
    left: 0,
    position: 'absolute',
    right: 0,
    top: (ROW_HEIGHT - TRACK_HEIGHT) / 2,
  },
  trackArea: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});
