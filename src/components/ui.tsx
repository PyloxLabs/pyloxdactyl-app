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

import { Colors, Fonts, Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useColors() {
  const scheme = useColorScheme();
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}

type TextVariant = 'title' | 'heading' | 'body' | 'label' | 'small' | 'mono' | 'caption';

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
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  refreshControl?: ReactElement<RefreshControlProps>;
}) {
  const colors = useColors();
  if (!scroll) {
    return <View style={[{ flex: 1, backgroundColor: colors.background }, contentStyle]}>{children}</View>;
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[{ padding: Spacing.three, gap: Spacing.two + 4 }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}>
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const colors = useColors();
  return (
    <View
      style={[
        {
          backgroundColor: colors.backgroundElement,
          borderColor: colors.border,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: Radius.medium,
          padding: Spacing.three,
          gap: Spacing.two,
        },
        style,
      ]}>
      {children}
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
  const colors = useColors();
  const background =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : variant === 'secondary' ? colors.backgroundSelected : 'transparent';
  const foreground =
    variant === 'primary' ? colors.primaryText : variant === 'danger' ? '#FFFFFF' : variant === 'secondary' ? colors.text : colors.primary;
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        {
          backgroundColor: background,
          borderColor: variant === 'ghost' ? 'transparent' : background,
          borderWidth: 1,
          borderRadius: Radius.small,
          paddingVertical: small ? 6 : 11,
          paddingHorizontal: small ? 10 : 16,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: inactive ? 0.45 : pressed ? 0.75 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={foreground} size="small" />
      ) : (
        <Text style={{ color: foreground, fontSize: small ? 13 : 15, fontWeight: '600' }}>{title}</Text>
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
  const colors = useColors();
  const background =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : variant === 'secondary' ? colors.backgroundSelected : 'transparent';
  const foreground =
    variant === 'primary' ? colors.primaryText : variant === 'danger' ? '#FFFFFF' : variant === 'secondary' ? colors.text : colors.primary;
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
          backgroundColor: background,
          borderColor: variant === 'ghost' ? 'transparent' : background,
          borderWidth: 1,
          opacity: inactive ? 0.45 : pressed ? 0.75 : 1,
        },
        style,
      ]}>
      {loading ? <ActivityIndicator color={foreground} size="small" /> : icon(foreground)}
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
  return (
    <View style={[{ gap: Spacing.one + 2 }, style]}>
      {label ? (
        <AppText variant="label" color="textSecondary">
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={colors.textSecondary}
        {...inputProps}
        style={{
          backgroundColor: colors.background,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: Radius.small,
          color: colors.text,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 15,
          minHeight: 42,
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
          borderRadius: 5,
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

export function Pill({ label, tone = 'muted' }: { label: string; tone?: 'success' | 'danger' | 'warning' | 'primary' | 'muted' }) {
  const colors = useColors();
  const color = tone === 'muted' ? colors.textSecondary : colors[tone];
  return (
    <View style={{ backgroundColor: `${color}22`, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
}

export function Warning({ children }: { children: ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ backgroundColor: `${colors.danger}18`, borderColor: `${colors.danger}55`, borderWidth: 1, borderRadius: Radius.small, padding: 10 }}>
      <AppText variant="small" color="danger">
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
        <View style={{ height: 6, width, borderRadius: 3, backgroundColor: tone ?? colors.primary }} />
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
  const colors = useColors();
  return (
    <Row wrap gap={6}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              {
                paddingVertical: 7,
                paddingHorizontal: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? colors.primary : colors.backgroundElement,
                opacity: pressed ? 0.7 : 1,
              },
            ]}>
            <Text style={{ color: active ? colors.primaryText : colors.text, fontSize: 13, fontWeight: '600' }}>{option.label}</Text>
          </Pressable>
        );
      })}
    </Row>
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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.55)' }}>
        <View
          style={{
            backgroundColor: colors.backgroundElement,
            borderRadius: Radius.large,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            padding: 20,
            gap: 12,
            maxHeight: '85%',
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
