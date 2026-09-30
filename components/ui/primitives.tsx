import { router, type Href } from 'expo-router';
import { type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type IconName } from '@/components/ui/icons';
import { colors, radius } from '@/components/ui/theme';

export function Screen({
  children,
  withBottomInset = false,
}: {
  children: ReactNode;
  withBottomInset?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 28 + (withBottomInset ? insets.bottom : 8) },
        ]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function Header({
  title,
  fallback,
  action,
}: {
  title: string;
  fallback?: Href;
  action?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      {fallback ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace(fallback);
            }
          }}
          style={styles.iconButton}
        >
          <AppIcon name="arrow-left" color={colors.ink} />
        </Pressable>
      ) : (
        <View style={styles.iconButton} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      {action ?? <View style={styles.iconButton} />}
    </View>
  );
}

export function Card({
  children,
  tone = 'plain',
}: {
  children: ReactNode;
  tone?: 'plain' | 'mint' | 'yellow' | 'soft';
}) {
  return (
    <View
      style={[
        styles.card,
        tone === 'mint' && styles.cardMint,
        tone === 'yellow' && styles.cardYellow,
        tone === 'soft' && styles.cardSoft,
      ]}
    >
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: IconName;
  disabled?: boolean;
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonSecondary,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon ? <AppIcon name={icon} color={primary ? colors.white : colors.primary} size={18} /> : null}
      <Text style={primary ? styles.buttonPrimaryText : styles.buttonSecondaryText}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ icon, label }: { icon?: IconName; label: string }) {
  return (
    <View style={styles.chip}>
      {icon ? <AppIcon name={icon} size={14} color={colors.primary} /> : null}
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ percent }: { percent: number }) {
  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }}>
      <View style={[styles.fill, { width: `${Math.max(0, Math.min(100, percent))}%` }]} />
    </View>
  );
}

export function Row({
  icon,
  title,
  subtitle,
  value,
  valueStyle,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  value?: string;
  valueStyle?: TextStyle;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.rowIcon}>
        <AppIcon name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={[styles.rowValue, valueStyle]}>{value}</Text> : null}
      {onPress ? <AppIcon name="chevron-right" size={18} color={colors.muted} /> : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  autoCapitalize = 'sentences',
  autoComplete,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: TextInputProps['autoComplete'];
  keyboardType?: 'default' | 'email-address' | 'number-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={!secureTextEntry && autoCapitalize !== 'none'}
        keyboardType={keyboardType}
      />
    </View>
  );
}

export function ChoiceRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.choices}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option)}
            style={[styles.choice, selected && styles.choiceSelected]}
          >
            <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function Amount({ children, compact = false }: { children: string; compact?: boolean }) {
  return <Text style={compact ? styles.amountCompact : styles.amount}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 16,
    gap: 8,
  },
  cardMint: {
    backgroundColor: colors.mint,
  },
  cardYellow: {
    backgroundColor: colors.yellowSoft,
  },
  cardSoft: {
    backgroundColor: '#F7F4EE',
  },
  button: {
    minHeight: 54,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.mint,
  },
  buttonPrimaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  buttonSecondaryText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.45,
  },
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.mint,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: '#E7F0EB',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  rowValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    minHeight: 52,
    borderRadius: radius.control,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 16,
  },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choice: {
    minHeight: 42,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  choiceSelected: {
    backgroundColor: colors.primary,
  },
  choiceText: {
    color: colors.ink,
    fontWeight: '700',
  },
  choiceTextSelected: {
    color: colors.white,
  },
  section: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  amount: {
    color: colors.ink,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  amountCompact: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
  },
});
