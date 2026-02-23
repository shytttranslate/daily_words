import { useQuizStore } from '@/store/quiz-store';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StatsScreen() {
  const { results, loaded, load } = useQuizStore();
  const borderColor = useThemeColor({}, 'border');
  const tint = useThemeColor({}, 'tint');

  useEffect(() => {
    load();
  }, [load]);

  if (!loaded) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  const totalQuizzes = results.length;
  const totalCorrect = results.reduce((s, r) => s + r.correct, 0);
  const totalQuestions = results.reduce((s, r) => s + r.total, 0);
  const avgPercent =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Thống kê
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Kết quả các bài kiểm tra trắc nghiệm
        </ThemedText>
      </View>
      <View style={[styles.summaryCard, { borderColor }]}>
        <View style={styles.summaryRow}>
          <ThemedText type="defaultSemiBold">Số bài làm:</ThemedText>
          <ThemedText>{totalQuizzes}</ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText type="defaultSemiBold">Tổng câu đúng:</ThemedText>
          <ThemedText>{totalCorrect} / {totalQuestions}</ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText type="defaultSemiBold">Trung bình:</ThemedText>
          <ThemedText>{avgPercent}%</ThemedText>
        </View>
      </View>
      <ThemedText type="subtitle" style={styles.listTitle}>
        Lịch sử bài làm
      </ThemedText>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.resultCard, { borderColor }]}>
            <ThemedText type="defaultSemiBold">
              {item.correct} / {item.total} đúng
            </ThemedText>
            <ThemedText style={styles.resultDate}>{formatDate(item.date)}</ThemedText>
          </View>
        )}
        ListEmptyComponent={
          <ThemedView style={styles.empty}>
            <IconSymbol name="chart.bar.fill" size={48} color={tint} />
            <ThemedText style={styles.emptyText}>
              Chưa có bài kiểm tra nào. Hãy vào Ôn tập để làm bài.
            </ThemedText>
          </ThemedView>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.9,
  },
  summaryCard: {
    marginHorizontal: 24,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  listTitle: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  resultDate: {
    marginTop: 4,
    fontSize: 13,
    opacity: 0.8,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
});
