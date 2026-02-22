OCR extract text từ image trên Android (Expo)

Kết luận nhanh

Có cách: dùng thư viện expo-text-recognition (Expo module, xử lý on-device, hỗ trợ cả Android và iOS).

Không cần eject: bạn vẫn dùng Expo (prebuild + development build). Eject theo kiểu “rời hẳn Expo” không cần thiết.

Lưu ý: Module có native code nên không chạy trong Expo Go. Bạn cần tạo development build (build app có nhúng native module) rồi chạy trên thiết bị/emulator.

flowchart LR
subgraph noEject [Không eject]
A[app.json + package.json] --> B[npx expo prebuild]
B --> C[android/ ios/ generated]
C --> D[Development build]
end
D --> E[App có OCR]

Thư viện đề xuất: expo-text-recognition

Npm: expo-text-recognition (v0.1.1, ~2K downloads/tuần).

Repo: vishaljak/expo-text-recognition.

Đặc điểm:

Expo module (có expo-module.config.json, native Android + iOS).

Xử lý on-device (không bắt buộc gửi ảnh lên server).

API đơn giản: truyền URI ảnh (file hoặc chụp) → nhận text.

Cài trong dự án Expo: npx expo install expo-text-recognition.

Cách dùng (sau khi đã có development build):

Cho ảnh từ file (ví dụ chọn từ gallery): truyền file URI (ví dụ từ expo-image-picker) vào API của package.

Cho ảnh chụp: dùng expo-image-picker (hoặc expo-camera) lấy URI → truyền vào expo-text-recognition.

Không cần eject; chỉ cần build app có chứa native module (bước 2 bên dưới).

Có cần eject source code không?

Không. Cách làm đúng với Expo hiện tại:

Giữ workflow Expo: code app vẫn chỉ chỉnh trong app/, components/, v.v. Không chỉnh tay trong android//ios/ trừ khi bạn chủ động thêm native code riêng (không bắt buộc cho OCR).

Prebuild: chạy npx expo prebuild khi cần. Lệnh này sinh thư mục android/ và ios/ từ app.json và các dependency (gồm expo-text-recognition). Bạn có thể không commit android//ios/ (dùng prebuild mỗi lần build) hoặc commit để tùy biến native sau.

Development build: build bản app “custom” có chứa native module (expo-text-recognition). Build xong thì chạy app đó trên máy/emulator; không dùng Expo Go cho màn OCR.

Tóm lại: không eject; chỉ thêm dependency, prebuild và dùng development build.

Các bước triển khai (gợi ý)

Cài package

npx expo install expo-text-recognition

(Tùy chọn) npx expo install expo-image-picker để chọn ảnh từ gallery hoặc chụp ảnh rồi đưa URI cho OCR.

Bật development build

npx expo install expo-dev-client

Chạy npx expo prebuild (sẽ tạo/ cập nhật android/, ios/).

Build Android: npx expo run:android (hoặc dùng EAS Build). Sau đó mở app đã build trên thiết bị/emulator (không mở bằng Expo Go).

Gọi OCR trong code

Import API từ expo-text-recognition (xem README / type definitions của package).

Lấy URI ảnh (từ image picker hoặc file) rồi gọi hàm recognize (ví dụ recognizeAsync(uri) hoặc tương đương).

Nhận chuỗi text trả về và dùng (hiển thị, lưu, đưa vào “tạo từ theo chủ đề”, v.v.).

Luồng UI (gợi ý)

Màn hình/modal: nút “Chọn ảnh” / “Chụp ảnh” → expo-image-picker → lấy uri → gọi expo-text-recognition → hiển thị/ xử lý text.

Thư viện khác (nếu cần so sánh)

Thư viện

Ghi chú

expo-mlkit-ocr

Chỉ Android; dùng ML Kit. Cũng cần dev build.

expo-text-extractor

ML Kit (Android) + Vision (iOS). Cần dev build.

@react-native-ml-kit/text-recognition

React Native thuần; dùng với Expo qua prebuild (có thể cần config plugin).

Với mục tiêu “OCR từ ảnh trên Android, không eject”, expo-text-recognition là lựa chọn phù hợp và đơn giản nhất trong hệ sinh thái Expo.

Tóm tắt

Có: dùng expo-text-recognition để extract text từ image trên Android (và iOS).

Eject: không cần; vẫn dùng Expo, chỉ cần development build (prebuild + expo-dev-client).

Expo Go: không hỗ trợ module này; phải chạy app qua bản build có nhúng native module (local hoặc EAS).

Nếu bạn muốn, bước tiếp theo có thể là: thêm một màn hình/modal “Chọn ảnh → OCR → hiển thị text” và gắn vào luồng “Tạo từ theo chủ đề” (paste text từ OCR vào ô chủ đề).
