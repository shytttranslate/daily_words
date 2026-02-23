import { useWords } from '@/context/words-context';
import { useQuizStore } from '@/store/quiz-store';
import type { Word } from '@/types/word';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

const QUIZ_SIZE = 7;

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildQuizWords(words: Word[], count: number): Word[] {
  if (words.length <= count) return shuffle(words);
  return shuffle(words).slice(0, count);
}

function buildOptions(correct: Word, allWords: Word[]): { label: string; correct: boolean }[] {
  const others = allWords.filter((w) => w.id !== correct.id);
  const wrong = shuffle(others).slice(0, 2).map((w) => ({ label: w.vi, correct: false }));
  const options = shuffle([{ label: correct.vi, correct: true }, ...wrong]);
  return options;
}

export default function QuizScreen() {
  const { words, loaded } = useWords();
  const { addResult } = useQuizStore();
  const [started, setStarted] = useState(false);
  const [quizWords, setQuizWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ wordId: string; correct: boolean }[]>([]);
  const tint = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  const canStart = loaded && words.length >= 3;

  const startQuiz = useCallback(() => {
    const count = Math.min(QUIZ_SIZE, Math.max(5, words.length));
    setQuizWords(buildQuizWords(words, count));
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswers([]);
    setStarted(true);
  }, [words]);

  const currentWord = quizWords[currentIndex];
  const options = useMemo(
    () => (currentWord ? buildOptions(currentWord, words) : []),
    [currentWord, words]
  );

  const handleSelectOption = useCallback(
    (index: number) => {
      if (selectedOption !== null) return;
      const correct = options[index].correct;
      setSelectedOption(index);
      setAnswers((prev) => [
        ...prev,
        { wordId: currentWord.id, correct },
      ]);
    },
    [selectedOption, options, currentWord]
  );

  const goNext = useCallback(() => {
    if (currentIndex + 1 >= quizWords.length) {
      const allAnswers =
        answers.length === quizWords.length
          ? answers
          : [...answers, { wordId: currentWord.id, correct: options[selectedOption!].correct }];
      const result = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        total: quizWords.length,
        correct: allAnswers.filter((a) => a.correct).length,
        answers: allAnswers,
      };
      addResult(result);
      setStarted(false);
      setQuizWords([]);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedOption(null);
  }, [currentIndex, quizWords.length, answers, currentWord, options, selectedOption, addResult]);

  if (!loaded) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!started) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Ôn tập
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Bài kiểm tra gồm {Math.min(QUIZ_SIZE, Math.max(5, words.length))} câu. Chọn nghĩa đúng cho mỗi từ.
          </ThemedText>
        </View>
        {!canStart ? (
          <ThemedText style={styles.hint}>Cần ít nhất 3 từ trong danh sách để làm bài kiểm tra.</ThemedText>
        ) : (
          <Pressable
            onPress={startQuiz}
            style={[styles.startBtn, { backgroundColor: tint }]}
          >
            <ThemedText type="defaultSemiBold" style={styles.startBtnText}>
              Bắt đầu
            </ThemedText>
          </Pressable>
        )}
      </ThemedView>
    );
  }

  const answered = selectedOption !== null;
  const correctOptionIndex = options.findIndex((o) => o.correct);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle">
          Câu {currentIndex + 1} / {quizWords.length}
        </ThemedText>
        <ThemedText type="title" style={styles.questionWord}>
          &quot;{currentWord?.en}&quot;
        </ThemedText>
        <ThemedText style={styles.questionLabel}>có nghĩa là?</ThemedText>
      </View>
      <View style={styles.options}>
        {options.map((opt, index) => (
          <Pressable
            key={index}
            onPress={() => handleSelectOption(index)}
            disabled={answered}
            style={[
              styles.option,
              { borderColor },
              answered && index === correctOptionIndex && styles.optionCorrect,
              answered && index === selectedOption && !opt.correct && styles.optionWrong,
            ]}
          >
            <ThemedText type="defaultSemiBold">{opt.label}</ThemedText>
            {answered && index === correctOptionIndex && (
              <IconSymbol name="checkmark.circle.fill" size={22} color="#22c55e" />
            )}
            {answered && index === selectedOption && !opt.correct && (
              <IconSymbol name="xmark.circle.fill" size={22} color="#ef4444" />
            )}
          </Pressable>
        ))}
      </View>
      {answered && (
        <View style={[styles.feedback, { backgroundColor: borderColor }]}>
          <ThemedText type="defaultSemiBold">Giải thích:</ThemedText>
          <ThemedText style={styles.feedbackVi}>{currentWord?.vi}</ThemedText>
          {currentWord?.example ? (
            <ThemedText style={styles.feedbackEx}>VD: {currentWord.example}</ThemedText>
          ) : null}
          <Pressable onPress={goNext} style={[styles.nextBtn, { backgroundColor: tint }]}>
            <ThemedText type="defaultSemiBold" style={styles.startBtnText}>
              {currentIndex + 1 >= quizWords.length ? 'Xem kết quả' : 'Tiếp theo'}
            </ThemedText>
          </Pressable>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 56,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 28,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.9,
    marginBottom: 24,
  },
  hint: {
    marginBottom: 16,
    opacity: 0.8,
  },
  startBtn: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  startBtnText: {
    color: '#fff',
  },
  questionWord: {
    marginVertical: 8,
  },
  questionLabel: {
    fontSize: 16,
    opacity: 0.9,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  optionCorrect: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  optionWrong: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  feedback: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
  },
  feedbackVi: {
    marginTop: 4,
    marginBottom: 4,
  },
  feedbackEx: {
    fontStyle: 'italic',
    opacity: 0.9,
    marginBottom: 16,
  },
  nextBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});
