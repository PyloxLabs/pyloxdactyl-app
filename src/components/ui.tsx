import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type RefreshControlProps,
  type TextInputProps,
  type TextProps,
  View,
  type ViewStyle,
} from 'react-native';

import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Crypto from 'expo-crypto';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing, alpha, Accent, type ThemeColor } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useColors() {
  const scheme = useColorScheme();
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}

export function useAccent() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? Accent.dark : Accent.light;
}

type TextVariant = 'title' | 'heading' | 'body' | 'label' | 'small' | 'mono' | 'caption';

const GRADIENTS = [
  { start: 'rgba(168, 85, 247, 0.16)', end: 'rgba(249, 115, 22, 0.08)' },
] as const;

function schemeSurface(colors: ReturnType<typeof useColors>, accent: ReturnType<typeof useAccent>) {
  return colors.background === '#09090B' ? '#18181B' : colors.background;
}

const textStyles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.4 },
  heading: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 15 },
  label: { fontSize: 13, fontWeight: '600' },
  small: { fontSize: 13 },
  mono: { fontSize: 13, fontFamily: Fonts?.mono },
  caption: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
});

export function AppText({
  variant = 'body',
  color,
  style,
  children,
  ...rest
}: TextProps & { variant?: TextVariant; color?: ThemeColor }) {
  const colors = useColors();
  return (
    <Text style={[{ color: colors[color ?? 'text'] }, textStyles[variant], style]} {...rest}>
      {children}
    </Text>
  );
}

export function Screen({
  children,
  scroll = true,
  contentStyle,
  refreshControl,
  footer,
  footerSpace,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  refreshControl?: ReactElement<RefreshControlProps>;
  footer?: ReactNode;
  footerSpace?: number;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  if (!scroll) {
    return <View style={[{ flex: 1, backgroundColor: colors.background }, contentStyle]}>{children}</View>;
  }
  return (
    <View collapsable={false} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          {
            padding: Spacing.three,
            paddingBottom: footer ? Spacing.three + (footerSpace ?? 0) : Spacing.three,
            gap: Spacing.two + 4,
          },
          contentStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}>
        {children}
      </ScrollView>
      {footer ? (
        <View
          style={{
            paddingHorizontal: Spacing.three,
            paddingTop: Spacing.two,
            paddingBottom: Spacing.two + insets.bottom,
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            borderTopWidth: StyleSheet.hairlineWidth,
          }}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}

export function Card({ children, style, glow = false }: { children: ReactNode; style?: ViewStyle; glow?: boolean }) {
  const colors = useColors();
  const accent = useAccent();
  return (
    <View
      style={[
        {
          backgroundColor: colors.backgroundElement,
          borderColor: glow ? alpha(accent.rgb, 0.35) : colors.border,
          borderWidth: StyleSheet.hairlineWidth + 0.5,
          borderRadius: Radius.medium,
          padding: Spacing.three,
          gap: Spacing.two,
        },
        glow
          ? {
              shadowColor: accent.glow,
              shadowOpacity: 0.5,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 3 },
              elevation: 3,
            }
          : null,
        style,
      ]}>
      {children}
    </View>
  );
}

export function GradientCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const colors = useColors();
  const accent = useAccent();
  return (
    <View
      style={[
        {
          borderColor: alpha(accent.rgb, 0.22),
          borderWidth: StyleSheet.hairlineWidth + 0.5,
          borderRadius: Radius.medium,
          overflow: 'hidden',
        },
        style,
      ]}>
      <View style={StyleSheet.absoluteFill}>
        {GRADIENTS.map((gradient, index) => (
          <LinearGradient
            key={index}
            colors={[gradient.start, gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { backgroundColor: index === 0 ? colors.backgroundElement : 'transparent' }]}
          />
        ))}
      </View>
      <View style={{ padding: Spacing.three, gap: Spacing.two }}>{children}</View>
    </View>
  );
}

export function Row({
  children,
  style,
  gap = Spacing.two,
  justify,
  align = 'center',
  wrap = false,
}: {
  children: ReactNode;
  style?: ViewStyle;
  gap?: number;
  justify?: ViewStyle['justifyContent'];
  align?: ViewStyle['alignItems'];
  wrap?: boolean;
}) {
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: align, gap, justifyContent: justify, flexWrap: wrap ? 'wrap' : 'nowrap' },
        style,
      ]}>
      {children}
    </View>
  );
}

export function Divider() {
  const colors = useColors();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />;
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

function useButtonTone(variant: ButtonVariant) {
  const colors = useColors();
  const accent = useAccent();
  switch (variant) {
    case 'primary':
      return { background: colors.primary, foreground: colors.primaryText, border: 'transparent', glow: accent.glow, gradient: true };
    case 'danger':
      return { background: alpha('239, 68, 68', 0.15), foreground: colors.danger, border: alpha('239, 68, 68', 0.2), glow: null, gradient: false };
    case 'secondary':
      return { background: colors.backgroundSelected, foreground: colors.text, border: 'transparent', glow: null, gradient: false };
    default:
      return { background: 'transparent', foreground: colors.text, border: colors.border, glow: null, gradient: false };
  }
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  small = false,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: ViewStyle;
}) {
  const tone = useButtonTone(variant);
  const accent = useAccent();
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        {
          backgroundColor: tone.gradient ? 'transparent' : tone.background,
          borderColor: tone.border,
          borderWidth: StyleSheet.hairlineWidth + 0.5,
          borderRadius: Radius.small,
          paddingVertical: small ? 6 : 11,
          paddingHorizontal: small ? 14 : 22,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          shadowColor: tone.glow ?? 'transparent',
          shadowOpacity: tone.glow ? 0.45 : 0,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: tone.glow ? 3 : 0,
          opacity: inactive ? 0.45 : pressed ? 0.75 : 1,
        },
        style,
      ]}>
      {tone.gradient ? (
        <LinearGradient
          colors={[accent.deep, tone.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {loading ? (
        <ActivityIndicator color={tone.foreground} size="small" />
      ) : (
        <Text style={{ color: tone.foreground, fontSize: small ? 12 : 14, fontWeight: '600' }}>{title}</Text>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  small = false,
  style,
}: {
  icon: (color: string) => ReactNode;
  onPress: () => void;
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: ViewStyle;
}) {
  const tone = useButtonTone(variant);
  const accent = useAccent();
  const inactive = disabled || loading;
  const size = small ? 34 : 42;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: Radius.small,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tone.gradient || variant === 'ghost' ? 'transparent' : tone.background,
          borderColor: tone.border,
          borderWidth: StyleSheet.hairlineWidth + 0.5,
          overflow: 'hidden',
          shadowColor: tone.glow ?? 'transparent',
          shadowOpacity: tone.glow ? 0.45 : 0,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: tone.glow ? 3 : 0,
          opacity: inactive ? 0.45 : pressed ? 0.75 : 1,
        },
        style,
      ]}>
      {tone.gradient ? (
        <LinearGradient
          colors={[accent.deep, tone.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {loading ? <ActivityIndicator color={tone.foreground} size="small" /> : icon(tone.foreground)}
    </Pressable>
  );
}

export function Field({
  label,
  hint,
  style,
  ...inputProps
}: TextInputProps & { label?: string; hint?: string; style?: ViewStyle }) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ gap: Spacing.one + 2 }, style]}>
      {label ? (
        <AppText variant="label" color="textSecondary">
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={colors.textSecondary}
        onFocus={(event) => {
          setFocused(true);
          inputProps.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          inputProps.onBlur?.(event);
        }}
        {...inputProps}
        style={{
          backgroundColor: colors.backgroundElement,
          borderColor: focused ? colors.primary : colors.border,
          borderWidth: StyleSheet.hairlineWidth + 0.5,
          borderRadius: Radius.small,
          color: colors.text,
          paddingHorizontal: 14,
          paddingVertical: 10,
          fontSize: 14,
          minHeight: 44,
          ...(inputProps.multiline ? { minHeight: 120, textAlignVertical: 'top' } : null),
        }}
      />
      {hint ? (
        <AppText variant="small" color="textSecondary">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

export function CheckRow({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, opacity: pressed ? 0.7 : 1 }]}>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: checked ? colors.primary : colors.border,
          backgroundColor: checked ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {checked ? <Text style={{ color: colors.primaryText, fontSize: 13, fontWeight: '700' }}>✓</Text> : null}
      </View>
      <AppText variant="body" style={{ flex: 1 }}>
        {label}
      </AppText>
    </Pressable>
  );
}

type PillTone = 'success' | 'danger' | 'warning' | 'primary' | 'muted' | 'info';

const PILL_TONES: Record<PillTone, string> = {
  success: '34, 197, 94',
  danger: '239, 68, 68',
  warning: '234, 179, 8',
  primary: '168, 85, 247',
  muted: '107, 114, 128',
  info: '59, 130, 246',
};

export function Pill({ label, tone = 'muted' }: { label: string; tone?: PillTone }) {
  const colors = useColors();
  const accent = useAccent();
  const rgb = tone === 'primary' ? accent.rgb : PILL_TONES[tone];
  const color = tone === 'muted' ? colors.textSecondary : tone === 'primary' ? accent.deep : colors[tone === 'info' ? 'primary' : tone];
  return (
    <View style={{ backgroundColor: alpha(rgb, 0.15), borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

export function Warning({ children }: { children: ReactNode }) {
  return (
    <View style={{ backgroundColor: alpha('239, 68, 68', 0.1), borderColor: alpha('239, 68, 68', 0.2), borderWidth: StyleSheet.hairlineWidth + 0.5, borderRadius: Radius.small, padding: 12 }}>
      <AppText variant="small" color="danger">
        {children}
      </AppText>
    </View>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <View style={{ backgroundColor: alpha('34, 197, 94', 0.1), borderColor: alpha('34, 197, 94', 0.2), borderWidth: StyleSheet.hairlineWidth + 0.5, borderRadius: Radius.small, padding: 12 }}>
      <AppText variant="small" color="success">
        {children}
      </AppText>
    </View>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return (
    <AppText variant="small" color="textSecondary">
      {children}
    </AppText>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  const colors = useColors();
  return (
    <View style={{ padding: 32, alignItems: 'center', gap: 10 }}>
      <ActivityIndicator color={colors.primary} />
      <AppText variant="small" color="textSecondary">
        {label}
      </AppText>
    </View>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={{ padding: 28, alignItems: 'center', gap: 6 }}>
      <AppText variant="heading">{title}</AppText>
      {hint ? (
        <AppText variant="small" color="textSecondary" style={{ textAlign: 'center' }}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <Row justify="space-between" style={{ marginTop: Spacing.two }}>
      <AppText variant="caption" color="textSecondary">
        {title}
      </AppText>
      {action}
    </Row>
  );
}

export function KeyValue({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <Row justify="space-between" align="flex-start" gap={12}>
      <AppText variant="small" color="textSecondary">
        {label}
      </AppText>
      <AppText variant={mono ? 'mono' : 'small'} style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </AppText>
    </Row>
  );
}

export function Meter({ label, value, detail, tone }: { label: string; value: number; detail?: string; tone?: string }) {
  const colors = useColors();
  const accent = useAccent();
  const width = `${Math.max(0, Math.min(100, value))}%` as const;
  return (
    <View style={{ gap: 5 }}>
      <Row justify="space-between">
        <AppText variant="small" color="textSecondary">
          {label}
        </AppText>
        <AppText variant="small">{detail ?? `${Math.round(value)}%`}</AppText>
      </Row>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.backgroundSelected, overflow: 'hidden' }}>
        <View
          style={{
            height: 6,
            width,
            borderRadius: 3,
            backgroundColor: tone ?? colors.primary,
            shadowColor: tone ?? accent.glow,
            shadowOpacity: 0.6,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 0 },
          }}
        />
      </View>
    </View>
  );
}

export function Choice<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T | null | undefined;
  onChange: (value: T) => void;
}) {
  return (
    <Row wrap gap={6}>
      {options.map((option) => (
        <ChoiceChip key={String(option.value)} option={option} active={option.value === value} onChange={onChange} />
      ))}
    </Row>
  );
}

function ChoiceChip<T extends string | number>({
  option,
  active,
  onChange,
}: {
  option: { label: string; value: T };
  active: boolean;
  onChange: (value: T) => void;
}) {
  const colors = useColors();
  const accent = useAccent();
  return (
    <Pressable
      onPress={() => onChange(option.value)}
      style={({ pressed }) => [
        {
          paddingVertical: 7,
          paddingHorizontal: 14,
          borderRadius: 999,
          borderWidth: StyleSheet.hairlineWidth + 0.5,
          borderColor: active ? alpha(accent.rgb, 0.5) : colors.border,
          backgroundColor: active ? alpha(accent.rgb, 0.14) : 'transparent',
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <Text style={{ color: active ? accent.deep : colors.textSecondary, fontSize: 13, fontWeight: '600' }}>{option.label}</Text>
    </Pressable>
  );
}

const SEGMENT_HEIGHT = 34;
const SEGMENT_PADDING = 3;

function liquidGlassAvailable() {
  try {
    return Platform.OS === 'ios' && isLiquidGlassAvailable();
  } catch {
    return false;
  }
}

export function SegmentedSlider<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T | null | undefined;
  onChange: (value: T) => void;
}) {
  const colors = useColors();
  const scheme = useColorScheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const [progress] = useState(() => new Animated.Value(0));

  const activeIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const segmentWidth = trackWidth > 0 ? (trackWidth - SEGMENT_PADDING * 2) / options.length : 0;
  const glass = liquidGlassAvailable();

  useEffect(() => {
    Animated.timing(progress, { toValue: activeIndex, duration: 240, useNativeDriver: true }).start();
  }, [activeIndex, progress]);

  const translateX = progress.interpolate({
    inputRange: options.map((_, index) => index),
    outputRange: options.map((_, index) => index * segmentWidth),
  });

  return (
    <View
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      style={{
        backgroundColor: colors.backgroundSelected,
        borderColor: colors.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 999,
        padding: SEGMENT_PADDING,
      }}>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: SEGMENT_PADDING,
          left: SEGMENT_PADDING,
          width: segmentWidth,
          height: SEGMENT_HEIGHT,
          opacity: segmentWidth > 0 ? 1 : 0,
          transform: [{ translateX }],
        }}>
        {glass ? (
          <GlassView
            glassEffectStyle="regular"
            isInteractive
            colorScheme={scheme}
            style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: colors.backgroundElement,
                borderRadius: 999,
                shadowColor: '#000',
                shadowOpacity: 0.14,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 },
                elevation: 2,
              },
            ]}
          />
        )}
      </Animated.View>
      <Row gap={0} style={{ height: SEGMENT_HEIGHT }}>
        {options.map((option, index) => (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text
              style={{
                color: index === activeIndex ? colors.primary : colors.textSecondary,
                fontSize: 13,
                fontWeight: '600',
              }}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </Row>
    </View>
  );
}

export function ModalCard({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const colors = useColors();
  const accent = useAccent();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View
          style={{
            backgroundColor: schemeSurface(colors, accent),
            borderRadius: Radius.medium,
            borderWidth: StyleSheet.hairlineWidth + 0.5,
            borderColor: colors.border,
            padding: 24,
            gap: 12,
            maxHeight: '85%',
            shadowColor: '#000',
            shadowOpacity: 0.5,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 12 },
            elevation: 8,
          }}>
          {title ? <AppText variant="heading">{title}</AppText> : null}
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
            {children}
          </ScrollView>
          <Button title="Close" variant="ghost" onPress={onClose} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Avatar({ email, name, size = 28 }: { email?: string | null; name?: string | null; size?: number }) {
  const colors = useColors();
  const [uri, setUri] = useState<string | null>(null);
  const initial = (name || '?').trim().charAt(0).toUpperCase();

  useEffect(() => {
    let cancelled = false;
    const normalized = email?.trim().toLowerCase();
    if (!normalized) {
      setUri(null);
      return;
    }
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.MD5, normalized)
      .then((hash) => {
        if (!cancelled) setUri(`https://www.gravatar.com/avatar/${hash}?s=${size * 2}&d=identicon&r=g`);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [email, size]);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
      <Text style={{ color: '#fff', fontSize: size * 0.42, fontWeight: '700' }}>{initial}</Text>
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          onError={() => setUri(null)}
        />
      ) : null}
    </View>
  );
}
