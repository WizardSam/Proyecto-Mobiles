import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useDemo } from '@/components/demo-state';
import { AppIcon } from '@/components/ui/icons';
import { calendarItems, calendarMarks, maskMoney } from '@/constants/demo';
import { Card, Muted, Row, Screen, SectionTitle } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';

const weekdays = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const leadingBlankDays = 4;
const daysInOctober = 31;

export default function CalendarScreen() {
  const demo = useDemo();
  const money = (value: string) => maskMoney(value, demo.hideAmounts);
  const [selected, setSelected] = useState(15);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const items = useMemo(() => calendarItems(demo.goalRoute.nextAmount), [demo.goalRoute.nextAmount]);
  const visible = items.filter((item) => {
    const matchesDay = item.day === selected;
    const matchesQuery =
      query.trim().length === 0 || item.title.toLowerCase().includes(query.trim().toLowerCase());
    return matchesDay && matchesQuery;
  });
  const upcoming = items.filter(
    (item) => query.trim().length === 0 || item.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Screen>
      <View style={styles.top}>
        <Text style={styles.title}>Calendario</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buscar compromiso"
          onPress={() => setSearching((current) => !current)}
          style={styles.search}
        >
          <AppIcon name="search" color={colors.ink} />
        </Pressable>
      </View>
      {searching ? (
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar compromiso"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
      ) : null}
      <View style={styles.month}>
        <View style={styles.monthButton} />
        <Text style={styles.monthLabel}>Octubre</Text>
        <View style={styles.monthButton} />
      </View>
      <Muted>Compromisos de ejemplo. Una suscripción o la renta solo se vuelven gasto cuando las confirmes.</Muted>
      <View style={styles.grid}>
        {weekdays.map((day, index) => (
          <Text key={`${day}-${index}`} style={styles.weekday}>
            {day}
          </Text>
        ))}
        {Array.from({ length: leadingBlankDays }, (_, index) => (
          <View key={`blank-${index}`} style={styles.day} />
        ))}
        {Array.from({ length: daysInOctober }, (_, index) => {
          const day = index + 1;
          const marked = calendarMarks.includes(day);
          const isSelected = day === selected;
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityLabel={`${day} de octubre`}
              onPress={() => setSelected(day)}
              style={[styles.day, marked && styles.marked, isSelected && styles.selected]}
            >
              <Text style={[styles.dayText, isSelected && styles.selectedText]}>{day}</Text>
            </Pressable>
          );
        })}
      </View>
      <SectionTitle>{visible.length > 0 ? 'Ese día' : 'Próximos compromisos'}</SectionTitle>
      <Card>
        {(visible.length > 0 ? visible : upcoming).map((item) => (
          <Row
            key={`${item.day}-${item.title}`}
            icon={item.icon}
            title={item.title}
            subtitle={`${item.day} oct`}
            value={money(item.amount)}
            valueStyle={{ color: item.title === 'Ahorro Cancún' ? colors.primary : colors.coralInk }}
            onPress={
              item.href
                ? () => {
                    if (item.href) {
                      router.push(item.href);
                    }
                  }
                : undefined
            }
          />
        ))}
        {visible.length === 0 && upcoming.length === 0 ? <Muted>No hay compromisos con esa búsqueda.</Muted> : null}
      </Card>
      <Pressable accessibilityRole="button" onPress={() => router.push('/suscripciones')}>
        <Card tone="mint">
          <Text style={styles.link}>Ver suscripciones</Text>
        </Card>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800',
  },
  search: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    color: colors.ink,
  },
  month: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: 44,
    height: 44,
  },
  monthLabel: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekday: {
    width: '14.28%',
    textAlign: 'center',
    color: colors.muted,
    fontWeight: '700',
    marginBottom: 8,
  },
  day: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    color: colors.ink,
    fontWeight: '700',
  },
  marked: {
    backgroundColor: colors.mint,
    borderRadius: 18,
  },
  selected: {
    backgroundColor: colors.primary,
    borderRadius: 18,
  },
  selectedText: {
    color: colors.white,
  },
  link: {
    color: colors.primary,
    fontWeight: '800',
    textAlign: 'center',
  },
});
