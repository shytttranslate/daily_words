import {
  generateVocabulary,
  type GeneratedVocabularyItem,
  type GeneratedWord,
} from '@/services/vocabup-api';

/** Mock: dùng khi chưa cấu hình EXPO_PUBLIC_API_BASE_URL */
const MOCK_DELAY_MS = 1800;

function makeId() {
  return `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const TOPIC_TECH: GeneratedVocabularyItem[] = [
  {
    word: 'algorithm',
    meaning_vi: 'thuật toán',
    example: 'This algorithm sorts data efficiently.',
    pos: 'noun',
    level: 'B1',
  },
  {
    word: 'database',
    meaning_vi: 'cơ sở dữ liệu',
    example: 'We store user data in a database.',
    pos: 'noun',
    level: 'B1',
  },
  {
    word: 'interface',
    meaning_vi: 'giao diện',
    example: 'The user interface is intuitive.',
    pos: 'noun',
    level: 'B1',
  },
  {
    word: 'network',
    meaning_vi: 'mạng lưới, mạng máy tính',
    example: 'The network is down.',
    pos: 'noun',
    level: 'A2',
  },
  {
    word: 'software',
    meaning_vi: 'phần mềm',
    example: 'This software runs on Windows.',
    pos: 'noun',
    level: 'A2',
  },
  {
    word: 'encryption',
    meaning_vi: 'mã hóa',
    example: 'Encryption protects your data.',
    pos: 'noun',
    level: 'B2',
  },
  {
    word: 'bandwidth',
    meaning_vi: 'băng thông',
    example: 'We need more bandwidth for video.',
    pos: 'noun',
    level: 'B2',
  },
  {
    word: 'cloud',
    meaning_vi: 'điện toán đám mây',
    example: 'Files are stored in the cloud.',
    pos: 'noun',
    level: 'B1',
  },
  {
    word: 'debug',
    meaning_vi: 'gỡ lỗi',
    example: 'I need to debug this code.',
    pos: 'verb',
    level: 'B1',
  },
  {
    word: 'framework',
    meaning_vi: 'framework, bộ khung',
    example: 'React is a popular framework.',
    pos: 'noun',
    level: 'B1',
  },
];

const TOPIC_TRAVEL: GeneratedVocabularyItem[] = [
  {
    word: 'itinerary',
    meaning_vi: 'lộ trình, hành trình',
    example: 'Here is your travel itinerary.',
    pos: 'noun',
    level: 'B1',
  },
  {
    word: 'boarding',
    meaning_vi: 'lên tàu/máy bay',
    example: 'Boarding starts in 20 minutes.',
    pos: 'noun',
    level: 'A2',
  },
  {
    word: 'destination',
    meaning_vi: 'điểm đến',
    example: 'Paris is our destination.',
    pos: 'noun',
    level: 'A2',
  },
  {
    word: 'reservation',
    meaning_vi: 'đặt chỗ, đặt phòng',
    example: 'I have a reservation for two.',
    pos: 'noun',
    level: 'A2',
  },
  {
    word: 'passport',
    meaning_vi: 'hộ chiếu',
    example: 'Please show your passport.',
    pos: 'noun',
    level: 'A1',
  },
  {
    word: 'luggage',
    meaning_vi: 'hành lý',
    example: 'Your luggage will arrive soon.',
    pos: 'noun',
    level: 'A2',
  },
  {
    word: 'departure',
    meaning_vi: 'giờ khởi hành',
    example: 'Departure is at 6 AM.',
    pos: 'noun',
    level: 'A2',
  },
  {
    word: 'accommodation',
    meaning_vi: 'chỗ ở',
    example: 'We booked accommodation downtown.',
    pos: 'noun',
    level: 'B1',
  },
  {
    word: 'sightseeing',
    meaning_vi: 'thăm quan',
    example: 'We went sightseeing all day.',
    pos: 'noun',
    level: 'A2',
  },
  {
    word: 'layover',
    meaning_vi: 'quá cảnh',
    example: 'We have a 3-hour layover in Dubai.',
    pos: 'noun',
    level: 'B1',
  },
];

const TOPIC_BUSINESS: GeneratedVocabularyItem[] = [
  {
    word: 'deadline',
    meaning_vi: 'hạn chót',
    example: 'The deadline is next Friday.',
    pos: 'noun',
    level: 'B1',
  },
  {
    word: 'negotiate',
    meaning_vi: 'thương lượng',
    example: 'We need to negotiate the contract.',
    pos: 'verb',
    level: 'B2',
  },
  {
    word: 'revenue',
    meaning_vi: 'doanh thu',
    example: 'Revenue increased by 20%.',
    pos: 'noun',
    level: 'B2',
  },
  {
    word: 'stakeholder',
    meaning_vi: 'các bên liên quan',
    example: 'Stakeholders will meet tomorrow.',
    pos: 'noun',
    level: 'B2',
  },
  {
    word: 'budget',
    meaning_vi: 'ngân sách',
    example: 'We are within budget.',
    pos: 'noun',
    level: 'B1',
  },
  {
    word: 'invoice',
    meaning_vi: 'hóa đơn',
    example: 'Please send the invoice by email.',
    pos: 'noun',
    level: 'B1',
  },
  {
    word: 'partnership',
    meaning_vi: 'quan hệ đối tác',
    example: 'We signed a partnership agreement.',
    pos: 'noun',
    level: 'B2',
  },
  {
    word: 'quarterly',
    meaning_vi: 'theo quý',
    example: 'Quarterly reports are due soon.',
    pos: 'adjective',
    level: 'B2',
  },
  {
    word: 'workflow',
    meaning_vi: 'quy trình làm việc',
    example: 'The new workflow saves time.',
    pos: 'noun',
    level: 'B1',
  },
  {
    word: 'briefing',
    meaning_vi: 'bản báo cáo ngắn, họp giao ban',
    example: 'The morning briefing is at 9.',
    pos: 'noun',
    level: 'B1',
  },
];

const TOPIC_DEFAULT: GeneratedVocabularyItem[] = [
  {
    word: 'vocabulary',
    meaning_vi: 'từ vựng',
    example: 'Reading helps expand your vocabulary.',
    pos: 'noun',
    level: 'A2',
  },
  {
    word: 'fluent',
    meaning_vi: 'trôi chảy',
    example: 'She is fluent in three languages.',
    pos: 'adjective',
    level: 'B1',
  },
  {
    word: 'practice',
    meaning_vi: 'luyện tập',
    example: 'Practice makes perfect.',
    pos: 'noun',
    level: 'A1',
  },
  {
    word: 'context',
    meaning_vi: 'ngữ cảnh',
    example: 'Understanding context is important.',
    pos: 'noun',
    level: 'B1',
  },
  {
    word: 'phrase',
    meaning_vi: 'cụm từ',
    example: 'Learn useful phrases for travel.',
    pos: 'noun',
    level: 'A2',
  },
  {
    word: 'pronunciation',
    meaning_vi: 'phát âm',
    example: 'Your pronunciation is improving.',
    pos: 'noun',
    level: 'A2',
  },
  {
    word: 'memorize',
    meaning_vi: 'ghi nhớ',
    example: 'Try to memorize these words.',
    pos: 'verb',
    level: 'A2',
  },
  {
    word: 'comprehension',
    meaning_vi: 'sự hiểu',
    example: 'Reading comprehension is key.',
    pos: 'noun',
    level: 'B1',
  },
  {
    word: 'expression',
    meaning_vi: 'cách diễn đạt',
    example: 'That is a common expression.',
    pos: 'noun',
    level: 'B1',
  },
  {
    word: 'native',
    meaning_vi: 'bản ngữ',
    example: 'He is a native English speaker.',
    pos: 'adjective',
    level: 'B1',
  },
];

function pickByTopic(topic: string): GeneratedVocabularyItem[] {
  const t = topic.toLowerCase().trim();
  if (
    /công nghệ|technology|tech|programming|code|máy tính|software|algorithm/.test(
      t,
    )
  ) {
    return TOPIC_TECH.map((w) => ({ ...w }));
  }
  if (
    /du lịch|travel|trip|flight|destination|passport|reservation/.test(t)
  ) {
    return TOPIC_TRAVEL.map((w) => ({ ...w }));
  }
  if (
    /kinh doanh|business|work|office|meeting|contract|revenue|deadline/.test(t)
  ) {
    return TOPIC_BUSINESS.map((w) => ({ ...w }));
  }
  return TOPIC_DEFAULT.map((w) => ({ ...w }));
}

/**
 * Tạo danh sách từ vựng theo chủ đề.
 * Gọi API generateVocabulary khi có EXPO_PUBLIC_API_BASE_URL; không thì dùng mock cùng shape.
 */
export async function generateWordsByTopic(
  topic: string,
  options?: { level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'; wordCount?: number },
): Promise<GeneratedWord[]> {
  const normalized = topic.trim();
  if (!normalized) return [];

  const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (baseURL) {
    const items = await generateVocabulary({
      content: normalized,
      level: options?.level ?? 'B1',
      wordCount: options?.wordCount ?? 10,
    });
    return items.map((item) => ({ ...item, id: makeId() }));
  }

  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  const mockItems = pickByTopic(normalized.toLowerCase());
  return mockItems.map((item) => ({ ...item, id: makeId() }));
}
