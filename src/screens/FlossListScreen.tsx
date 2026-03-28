import React, { useState, useMemo } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { DMC_COLORS, DmcColor } from '../data/dmcColors';
import { FlossItem } from '../components/FlossItem';
import { useInventory } from '../hooks/useInventory';

type FilterTab = 'all' | 'in_stock' | 'low' | 'unowned';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in_stock', label: 'In Stock' },
  { key: 'low', label: 'Low' },
  { key: 'unowned', label: 'Missing' },
];

// Deduplicate by number (some colors appear twice in DMC list)
const UNIQUE_COLORS: DmcColor[] = Array.from(
  new Map(DMC_COLORS.map((c) => [c.number, c])).values()
);

export function FlossListScreen() {
  const { inventory, loaded, cycleStatus, getStatus } = useInventory();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return UNIQUE_COLORS.filter((c) => {
      const matchesSearch =
        !q || c.number.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
      const matchesTab = activeTab === 'all' || getStatus(c.number) === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [search, activeTab, inventory, getStatus]);

  const counts = useMemo(() => {
    const inStock = UNIQUE_COLORS.filter((c) => getStatus(c.number) === 'in_stock').length;
    const low = UNIQUE_COLORS.filter((c) => getStatus(c.number) === 'low').length;
    return { inStock, low, total: UNIQUE_COLORS.length };
  }, [inventory, getStatus]);

  if (!loaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.title}>DMC Floss</Text>
        <Text style={styles.subtitle}>
          {counts.inStock + counts.low}/{counts.total} owned · {counts.low} low
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by number or name..."
          placeholderTextColor="#AAAAAA"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.number}
        renderItem={({ item }) => (
          <FlossItem
            color={item}
            status={getStatus(item.number)}
            onPress={() => cycleStatus(item.number)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No colors found</Text>
          </View>
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : undefined}
      />

      <View style={styles.hint}>
        <Text style={styles.hintText}>Tap a color to cycle: missing → in stock → low</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 13,
    color: '#888888',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    columnGap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#EEEEEE',
  },
  tabActive: {
    backgroundColor: '#4A90D9',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#AAAAAA',
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
  },
  hint: {
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  hintText: {
    fontSize: 11,
    color: '#BBBBBB',
  },
});
