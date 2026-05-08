# Mục lục tài liệu DS2API (Tiếng Việt)

Ngôn ngữ / Language: [Tiếng Việt](README.vi.md) | [中文](README.md) | [English](README.md#english)

Để giảm trùng lặp khi bảo trì, tài liệu repo được chia theo cấu trúc "tài liệu cổng vào + tài liệu chuyên đề". Khuyến nghị đọc theo thứ tự sau:

1. [Tổng quan dự án (README)](../README.vi.md)
2. [Kiến trúc và cấu trúc thư mục](./ARCHITECTURE.md) (tiếng Trung; bản tiếng Anh: [ARCHITECTURE.en.md](./ARCHITECTURE.en.md))
3. [Tài liệu API](../API.md) / [API.en.md](../API.en.md)
4. [Hướng dẫn triển khai](./DEPLOY.vi.md)
5. [Hướng dẫn kiểm thử](./TESTING.md)
6. [Tham chiếu nhanh cho lập trình viên](./DEVELOPMENT.md)
7. [Hướng dẫn đóng góp](./CONTRIBUTING.md)

### Tài liệu chuyên đề

- [Giá trị dự án DS2API](./project-value.md)
- [Pipeline tương thích "API → ngữ cảnh chat web dạng văn bản"](./prompt-compatibility.md)
- [Ngữ nghĩa Tool Calling thống nhất](./toolcall-semantics.md)
- [Mô tả hành vi DeepSeek SSE (quan sát reverse engineering)](./DeepSeekSSE行为结构说明-2026-04-05.md)

### Quy ước bảo trì tài liệu

- Mọi cập nhật tài liệu phải dựa trên code thực tế: routing tổng xem `internal/server/router.go`; route theo protocol/resource xem `internal/httpapi/**/handler*.go` và `internal/httpapi/admin/handler.go`; giá trị mặc định cấu hình xem `internal/config/*`; model/alias xem `internal/config/models.go`; pipeline tương thích prompt theo các entrypoint code liệt kê trong `docs/prompt-compatibility.md`.
- `README.MD` / `README.en.md` / `README.vi.md`: cho người dùng lần đầu tiếp xúc, giữ phần "là cái gì + chạy nhanh thế nào".
- `docs/ARCHITECTURE*.md`: cho lập trình viên, tập trung mô tả cấu trúc dự án, trách nhiệm module và call chain.
- `API*.md`: cho người tích hợp client, tập trung hành vi interface, xác thực và ví dụ.
- `docs/prompt-compatibility.md`: cho người bảo trì, tập trung duy trì ngữ nghĩa "API → ngữ cảnh chat web dạng văn bản"; mọi thay đổi hành vi liên quan phải đồng bộ cập nhật.
- Các `docs/*.md` khác: chuyên đề chủ điểm, tránh paste cùng một đoạn vào nhiều file.
