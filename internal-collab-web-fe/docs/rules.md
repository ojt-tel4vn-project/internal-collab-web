# Frontend Next.js Best Practices

## 1. Kiến trúc và tổ chức thư mục
- Dùng `app/` theo App Router, tách route theo domain nghiệp vụ (`employee`, `hr`, `manager`).
- Mỗi route chỉ chứa phần liên quan route đó: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`.
- Tái sử dụng UI trong `components/` và logic dùng chung trong `lib/`, `hooks/`, `types/`.
- Không để route động trùng ý nghĩa; với role cố định, ưu tiên route tĩnh.

## 2. Server Component vs Client Component
- Mặc định dùng Server Component; chỉ thêm `"use client"` khi cần state, event handler, hoặc browser API.
- Không đưa logic fetch nhạy cảm xuống Client Component.
- Giữ Client Component nhỏ, tập trung vào tương tác UI.

## 3. Data fetching
- Ưu tiên fetch trên server (trong Server Component, route handler, hoặc server action).
- Chuẩn hóa xử lý lỗi API (status code, message, fallback UI).
- Dùng schema validate dữ liệu vào/ra (ví dụ Zod) cho form và API response quan trọng.
- Không gọi API lặp lại không cần thiết; cân nhắc cache/revalidate phù hợp.

## 4. TypeScript
- Bắt buộc typing rõ ràng cho props, response, domain model.
- Tránh `any`; nếu cần tạm dùng, ghi TODO rõ ràng để thay thế.
- Tạo type dùng chung trong `types/` để tránh định nghĩa lặp.

## 5. Form và validation
- Validate ở cả UI và server.
- Hiển thị lỗi theo field và lỗi tổng quát một cách nhất quán.
- Không submit khi dữ liệu chưa hợp lệ; disable nút submit khi đang gửi.

## 6. UI/UX và accessibility
- Dùng semantic HTML (`main`, `section`, `button`, `label`, `nav`).
- Tất cả input phải có label; ảnh phải có `alt` có nghĩa.
- Đảm bảo focus state nhìn thấy rõ và hỗ trợ bàn phím.
- Kiểm tra responsive tối thiểu cho mobile/tablet/desktop.

## 7. Hiệu năng
- Dùng `next/image` cho ảnh nội dung chính; chỉ dùng `img` khi có lý do rõ ràng.
- Tối ưu font bằng `next/font`.
- Tránh render lại không cần thiết; tách component lớn thành component nhỏ.
- Không import thư viện nặng ở mức global nếu chỉ dùng cục bộ.

## 8. Bảo mật frontend
- Không hard-code secret/token trong client.
- Không tin dữ liệu từ client; mọi quyền và nghiệp vụ quan trọng phải kiểm tra ở server.
- Escape/sanitize dữ liệu hiển thị từ nguồn ngoài nếu có nguy cơ chèn script.

## 9. Chất lượng code và review
- Giữ component ngắn, tên rõ nghĩa, một trách nhiệm chính.
- ESLint phải sạch trước khi merge.
- PR nhỏ, tập trung một mục tiêu; có mô tả phạm vi và ảnh chụp UI khi cần.
- Không commit code chết, log debug thừa, hoặc file tạm.

## 10. Testing tối thiểu
- Unit test cho util và logic xử lý quan trọng.
- Component test cho form, trạng thái loading/error/success.
- Smoke test luồng chính: đăng nhập, xem trang, thao tác chính theo role.

## 11. Quy ước team
- Mỗi feature mới phải có:
  - route/component rõ ràng
  - type đầy đủ
  - xử lý loading/error
  - kiểm tra responsive cơ bản
- Khi sửa bug, thêm test hoặc checklist tái hiện bug để tránh tái phát.
