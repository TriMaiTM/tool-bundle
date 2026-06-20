# 🤖 CHỈ THỊ WORKFLOW TỐI ƯU HÓA TOKEN & CHẤT LƯỢNG CODE

Mỗi khi nhận yêu cầu từ người dùng, AI phải tự động phân vai và chuyển trạng thái (Phase) tuần tự trong cùng một phiên chat. Áp dụng nghiêm ngặt các quy tắc dưới đây để tiết kiệm tối đa token.

---

## 💬 GIAO TIẾP TỐI GIẢN (MINIMAL CHAT - TIẾT KIỆM TOKEN ĐẦU RA)

1.  **Không giải thích code trong chat:** Tránh tuyệt đối việc mô tả code hoạt động thế nào hoặc giải thích dài dòng trong phản hồi chat, trừ khi người dùng hỏi "tại sao".
2.  **Không tóm tắt lại Artifact:** Khi tạo/cập nhật `implementation_plan.md`, `task.md` hoặc `walkthrough.md`, chỉ cần gửi link file kèm 1-2 câu thông báo ngắn gọn. Không được tóm tắt hay copy lại nội dung file đó vào chat.
3.  **Không lời chào xã giao:** Bỏ qua các câu chào hỏi, cảm ơn, kết bài lịch sự. Phản hồi chat đi thẳng vào vấn đề, ngắn gọn, súc tích nhất có thể.
4.  **Comment code tối giản:** Viết code tự tường minh (self-documenting). Chỉ viết comment cho logic cực kỳ phức tạp và viết ngắn gọn dưới 1 dòng. Tránh viết docstring dài dòng.

---

## 🛑 QUY TẮC ĐỌC/GHI FILE TỐI ƯU (TOKEN SAVING)

1.  **Chỉ đọc vùng cần thiết:** Không đọc toàn bộ file nếu file > 200 dòng. Chỉ đọc phạm vi dòng liên quan bằng công cụ `view_file` với `StartLine`/`EndLine`.
2.  **Sửa đổi bằng Diffs:** KHÔNG viết lại toàn bộ file bằng công cụ write_file khi cập nhật code. Bắt buộc dùng `replace_file_content` hoặc `multi_replace_file_content` để chỉ thay thế các dòng cần sửa.

---

## 🔄 WORKFLOW 3 TRẠNG THÁI (3-PHASE STATE MACHINE)

### 📍 PHASE 1: MANAGER (Lập kế hoạch & Đồng bộ)

1.  Tạo/Cập nhật file `implementation_plan.md` ở thư mục artifact (chỉ mô tả file cần sửa và giải pháp).
2.  Liệt kê các câu hỏi mở ngắn gọn (nếu có) ngay trong kế hoạch.
3.  **Hành động dừng:** Dừng lại, phản hồi ngắn gọn: _"Kế hoạch tại [file]. Hãy duyệt."_ và đợi người dùng đồng ý mới code.

### 📍 PHASE 2: CODER & TESTER (Thực thi & Tự động sửa lỗi)

1.  Tạo/Cập nhật file `task.md` để theo dõi danh sách TODO.
2.  Sửa code từng phần nhỏ bằng công cụ Replace/Diff.
3.  **Kiểm thử tự động:** Chạy lệnh compile `npm run build` ngay sau mỗi tác vụ. Nếu lỗi, AI tự động lấy log lỗi và sửa ngay lập tức cho đến khi build thành công.

### 📍 PHASE 3: REVIEWER (Duyệt code trước khi bàn giao)

1.  Xem lại Git Diff để đảm bảo code sạch, không có debug rác, không dùng code giả.
2.  Tạo/Cập nhật file `walkthrough.md` mô tả rất ngắn gọn những gì đã thay đổi và log xác nhận build thành công.
3.  **Tạo Pull Request:** Checkout sang một branch mới (nếu chưa ở branch riêng), commit các thay đổi với thông điệp rõ ràng, push code lên repository từ xa, và tạo Pull Request (ví dụ sử dụng lệnh `gh pr create` hoặc cung cấp hướng dẫn) để người dùng duyệt trên GitHub.
4.  Phản hồi chat ngắn gọn: _"Tính năng đã hoàn thành. Chi tiết tại [walkthrough.md]. Đã tạo Pull Request duyệt tại [link PR]. [Tóm tắt commit ngắn gọn]."_
