import type { Word } from '@/types/word';

/** Mock: sẽ thay bằng gọi API thật sau */
const MOCK_DELAY_MS = 1800;

function makeId() {
  return `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const TOPIC_TECH: Word[] = [
  { id: makeId(), en: 'algorithm', vi: 'thuật toán', example: 'This algorithm sorts data efficiently.' },
  { id: makeId(), en: 'database', vi: 'cơ sở dữ liệu', example: 'We store user data in a database.' },
  { id: makeId(), en: 'interface', vi: 'giao diện', example: 'The user interface is intuitive.' },
  { id: makeId(), en: 'network', vi: 'mạng lưới, mạng máy tính', example: 'The network is down.' },
  { id: makeId(), en: 'software', vi: 'phần mềm', example: 'This software runs on Windows.' },
  { id: makeId(), en: 'encryption', vi: 'mã hóa', example: 'Encryption protects your data.' },
  { id: makeId(), en: 'bandwidth', vi: 'băng thông', example: 'We need more bandwidth for video.' },
  { id: makeId(), en: 'cloud', vi: 'điện toán đám mây', example: 'Files are stored in the cloud.' },
  { id: makeId(), en: 'debug', vi: 'gỡ lỗi', example: 'I need to debug this code.' },
  { id: makeId(), en: 'framework', vi: 'framework, bộ khung', example: 'React is a popular framework.' },
];

const TOPIC_TRAVEL: Word[] = [
  { id: makeId(), en: 'itinerary', vi: 'lộ trình, hành trình', example: 'Here is your travel itinerary.' },
  { id: makeId(), en: 'boarding', vi: 'lên tàu/máy bay', example: 'Boarding starts in 20 minutes.' },
  { id: makeId(), en: 'destination', vi: 'điểm đến', example: 'Paris is our destination.' },
  { id: makeId(), en: 'reservation', vi: 'đặt chỗ, đặt phòng', example: 'I have a reservation for two.' },
  { id: makeId(), en: 'passport', vi: 'hộ chiếu', example: 'Please show your passport.' },
  { id: makeId(), en: 'luggage', vi: 'hành lý', example: 'Your luggage will arrive soon.' },
  { id: makeId(), en: 'departure', vi: 'giờ khởi hành', example: 'Departure is at 6 AM.' },
  { id: makeId(), en: 'accommodation', vi: 'chỗ ở', example: 'We booked accommodation downtown.' },
  { id: makeId(), en: 'sightseeing', vi: 'thăm quan', example: 'We went sightseeing all day.' },
  { id: makeId(), en: 'layover', vi: 'quá cảnh', example: 'We have a 3-hour layover in Dubai.' },
];

const TOPIC_BUSINESS: Word[] = [
  { id: makeId(), en: 'deadline', vi: 'hạn chót', example: 'The deadline is next Friday.' },
  { id: makeId(), en: 'negotiate', vi: 'thương lượng', example: 'We need to negotiate the contract.' },
  { id: makeId(), en: 'revenue', vi: 'doanh thu', example: 'Revenue increased by 20%.' },
  { id: makeId(), en: 'stakeholder', vi: 'các bên liên quan', example: 'Stakeholders will meet tomorrow.' },
  { id: makeId(), en: 'budget', vi: 'ngân sách', example: 'We are within budget.' },
  { id: makeId(), en: 'invoice', vi: 'hóa đơn', example: 'Please send the invoice by email.' },
  { id: makeId(), en: 'partnership', vi: 'quan hệ đối tác', example: 'We signed a partnership agreement.' },
  { id: makeId(), en: 'quarterly', vi: 'theo quý', example: 'Quarterly reports are due soon.' },
  { id: makeId(), en: 'workflow', vi: 'quy trình làm việc', example: 'The new workflow saves time.' },
  { id: makeId(), en: 'briefing', vi: 'bản báo cáo ngắn, họp giao ban', example: 'The morning briefing is at 9.' },
];

const TOPIC_DEFAULT: Word[] = [
  { id: makeId(), en: 'vocabulary', vi: 'từ vựng', example: 'Reading helps expand your vocabulary.' },
  { id: makeId(), en: 'fluent', vi: 'trôi chảy', example: 'She is fluent in three languages.' },
  { id: makeId(), en: 'practice', vi: 'luyện tập', example: 'Practice makes perfect.' },
  { id: makeId(), en: 'context', vi: 'ngữ cảnh', example: 'Understanding context is important.' },
  { id: makeId(), en: 'phrase', vi: 'cụm từ', example: 'Learn useful phrases for travel.' },
  { id: makeId(), en: 'pronunciation', vi: 'phát âm', example: 'Your pronunciation is improving.' },
  { id: makeId(), en: 'memorize', vi: 'ghi nhớ', example: 'Try to memorize these words.' },
  { id: makeId(), en: 'comprehension', vi: 'sự hiểu', example: 'Reading comprehension is key.' },
  { id: makeId(), en: 'expression', vi: 'cách diễn đạt', example: 'That is a common expression.' },
  { id: makeId(), en: 'native', vi: 'bản ngữ', example: 'He is a native English speaker.' },
];

function pickByTopic(topic: string): Word[] {
  const t = topic.toLowerCase().trim();
  if (/công nghệ|technology|tech|programming|code|máy tính|software|algorithm/.test(t)) {
    return TOPIC_TECH.map((w) => ({ ...w, id: makeId() }));
  }
  if (/du lịch|travel|trip|flight|destination|passport|reservation/.test(t)) {
    return TOPIC_TRAVEL.map((w) => ({ ...w, id: makeId() }));
  }
  if (/kinh doanh|business|work|office|meeting|contract|revenue|deadline/.test(t)) {
    return TOPIC_BUSINESS.map((w) => ({ ...w, id: makeId() }));
  }
  return TOPIC_DEFAULT.map((w) => ({ ...w, id: makeId() }));
}

/**
 * Tạo danh sách từ vựng theo chủ đề (mock). Sau này thay bằng gọi API.
 */
export async function generateWordsByTopic(topic: string): Promise<Word[]> {
  const normalized = topic.trim().toLowerCase();
  if (!normalized) return [];

  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return pickByTopic(normalized);
}
