# Hướng dẫn triển khai DS2API (Tiếng Việt)

Ngôn ngữ / Language: [Tiếng Việt](DEPLOY.vi.md) | [中文](DEPLOY.md) | [English](DEPLOY.en.md)

Tài liệu này mô tả các phương thức triển khai DS2API. Tham chiếu code nguồn: kiến trúc xem [ARCHITECTURE.md](./ARCHITECTURE.md), API xem [API.md](../API.md).

> Mẹo: Bản dịch này tóm tắt phần thực sự cần để chạy DS2API. Để xem tất cả tuỳ chọn (Nginx, systemd, GHCR…) hãy đọc [DEPLOY.md](./DEPLOY.md) hoặc [DEPLOY.en.md](./DEPLOY.en.md).

---

## Mục lục

- [Thứ tự ưu tiên triển khai](#thứ-tự-ưu-tiên-triển-khai)
- [0. Yêu cầu trước khi cài](#0-yêu-cầu-trước-khi-cài)
- [1. Tải gói Release](#1-tải-gói-release)
- [2. Triển khai bằng Docker / GHCR](#2-triển-khai-bằng-docker--ghcr)
- [3. Triển khai trên Vercel](#3-triển-khai-trên-vercel)
- [4. Chạy từ source cục bộ](#4-chạy-từ-source-cục-bộ)
- [5. Reverse proxy (Nginx)](#5-reverse-proxy-nginx)
- [6. Service hoá bằng systemd (Linux)](#6-service-hoá-bằng-systemd-linux)
- [7. Kiểm tra sau khi triển khai](#7-kiểm-tra-sau-khi-triển-khai)

---

## Thứ tự ưu tiên triển khai

Khuyến nghị chọn phương thức theo thứ tự:

1. **Tải gói Release** – đỡ tốn công nhất, đã build sẵn, phù hợp đa số người dùng.
2. **Docker / GHCR image** – phù hợp khi cần container hoá, orchestration, môi trường cloud.
3. **Vercel** – phù hợp khi đã quen Vercel và chấp nhận giới hạn nền tảng.
4. **Chạy từ source / tự build** – phù hợp khi phát triển, debug, hoặc cần sửa code.

---

## 0. Yêu cầu trước khi cài

| Phụ thuộc | Phiên bản tối thiểu | Ghi chú |
| --- | --- | --- |
| Go | 1.26+ | Để build/chạy backend |
| Node.js | `20.19+` hoặc `22.12+` | Chỉ cần khi build WebUI cục bộ |
| npm | đi kèm Node.js | Cài dependency WebUI |

Nguồn cấu hình (chọn 1):

- **File**: `config.json` (khuyến nghị cho local/Docker)
- **Biến môi trường**: `DS2API_CONFIG_JSON` (khuyến nghị cho Vercel; hỗ trợ JSON string hoặc Base64; cũng có thể truyền JSON nguyên bản)

Best practice:

```bash
cp config.example.json config.json
# Sửa config.json
```

Nên coi `config.json` là nguồn cấu hình duy nhất:
- Local: đọc trực tiếp `config.json`.
- Docker / Vercel: từ `config.json` sinh `DS2API_CONFIG_JSON` (Base64) đổ vào biến môi trường.

---

## 1. Tải gói Release

Repo có sẵn workflow GitHub Actions: `.github/workflows/release-artifacts.yml`.

- **Trigger**: mặc định chỉ tự kích hoạt khi Release `published`; cũng hỗ trợ chạy thủ công `workflow_dispatch` ở trang Actions với `release_tag` để re-run.
- **Artifact**: gói nhị phân đa nền tảng + image Docker Linux + `sha256sums.txt`.
- **Container image**: chỉ push lên GHCR (`ghcr.io/cjackhwang/ds2api`).

| Hệ điều hành | Kiến trúc | Định dạng |
| --- | --- | --- |
| Linux | amd64, arm64, armv7 | `.tar.gz` |
| macOS | amd64, arm64 | `.tar.gz` |
| Windows | amd64, arm64 | `.zip` |

Mỗi gói gồm:

- File thực thi `ds2api` (`ds2api.exe` trên Windows)
- `static/admin/` (artifact build WebUI)
- `config.example.json`, `.env.example`
- `README.MD`, `README.en.md`, `README.vi.md`, `LICENSE`

```bash
# 1. Tải gói tương ứng nền tảng
# 2. Giải nén
tar -xzf ds2api_<tag>_linux_amd64.tar.gz
cd ds2api_<tag>_linux_amd64

# 3. Cấu hình
cp config.example.json config.json
# Sửa config.json

# 4. Khởi động
./ds2api
```

---

## 2. Triển khai bằng Docker / GHCR

```bash
# Pull image đã build sẵn
docker pull ghcr.io/cjackhwang/ds2api:latest

# Copy template biến môi trường và file cấu hình
cp .env.example .env
cp config.example.json config.json

# Sửa .env (đổi thành mật khẩu mạnh), tối thiểu cần:
#   DS2API_ADMIN_KEY=mật-khẩu-mạnh-của-bạn
#   (Tuỳ chọn) DS2API_HOST_PORT=5001 nếu muốn expose port khác

# Khởi động bằng compose
docker-compose up -d

# Xem log
docker-compose logs -f

# Cập nhật image
docker-compose pull && docker-compose up -d
```

Mặc định `docker-compose.yml` map host `6011` vào container `5001`. Đổi `DS2API_HOST_PORT` để dùng port khác. File `config.json` được mount vào `/data/config.json` và DS2API đọc từ đó (`DS2API_CONFIG_PATH=/data/config.json`).

---

## 3. Triển khai trên Vercel

1. Fork repo về GitHub của bạn.
2. Import vào Vercel.
3. Đặt biến môi trường:
   - `DS2API_ADMIN_KEY=mật-khẩu-mạnh-của-bạn` (bắt buộc)
   - `DS2API_CONFIG_JSON=...` (khuyến nghị; có thể là Base64 của `config.json`)
4. Triển khai.

Sinh chuỗi Base64:

```bash
base64 < config.json | tr -d '\n'
```

> **Streaming**: trên Vercel, `/v1/chat/completions` đi qua `api/chat-stream.js` (Node Runtime) để đảm bảo SSE thời gian thực. Auth, chọn tài khoản, chuẩn bị session/PoW vẫn do Go xử lý qua prepare interface; phản hồi streaming (kể cả `tools`) được lắp ráp bên Node theo cùng logic Go.

---

## 4. Chạy từ source cục bộ

```bash
# 1. Clone
git clone https://github.com/CJackHwang/ds2api.git
cd ds2api

# 2. Cấu hình
cp config.example.json config.json
# Sửa config.json: điền tài khoản DeepSeek và API key

# 3. Khởi động
go run ./cmd/ds2api
```

Mặc định: bind `0.0.0.0:5001`, truy cập tại `http://127.0.0.1:5001` hoặc IP nội bộ trong cùng LAN.

> **Tự build WebUI**: Lần đầu chạy, nếu chưa có `static/admin`, hệ thống sẽ tự chạy `npm ci` (chỉ khi thiếu dependency) và `npm run build -- --outDir static/admin --emptyOutDir`. Bạn cũng có thể build thủ công:
>
> - Linux/macOS: `./scripts/build-webui.sh`
> - Windows PowerShell: `cd webui; npm ci; npm run build -- --outDir ../static/admin --emptyOutDir`

### Biến môi trường thường dùng

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `PORT` | `5001` | Port HTTP server lắng nghe |
| `LOG_LEVEL` | `INFO` | Mức log: DEBUG / INFO / WARN / ERROR |
| `DS2API_ADMIN_KEY` | – | Khoá đăng nhập bảng quản trị `/admin` (bắt buộc) |
| `DS2API_CONFIG_PATH` | `./config.json` | Đường dẫn file cấu hình |
| `DS2API_CONFIG_JSON` | – | Cấu hình dạng JSON inline / Base64 |
| `DS2API_STATIC_ADMIN_DIR` | `./static/admin` | Đường dẫn artifact WebUI |
| `DS2API_ACCOUNT_MAX_INFLIGHT` | `2` | Đồng thời tối đa cho mỗi tài khoản |
| `DS2API_ACCOUNT_MAX_QUEUE` | tự tính | Hàng chờ tối đa cho mỗi tài khoản |
| `DS2API_DEV_PACKET_CAPTURE` | `false` | Bật chế độ bắt gói tin debug |

---

## 5. Reverse proxy (Nginx)

Ví dụ tối thiểu:

```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Streaming (SSE)
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 600s;
    }
}
```

---

## 6. Service hoá bằng systemd (Linux)

Tạo `/etc/systemd/system/ds2api.service`:

```ini
[Unit]
Description=DS2API server
After=network.target

[Service]
Type=simple
User=ds2api
WorkingDirectory=/opt/ds2api
EnvironmentFile=/opt/ds2api/.env
ExecStart=/opt/ds2api/ds2api
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ds2api
sudo journalctl -u ds2api -f
```

---

## 7. Kiểm tra sau khi triển khai

```bash
# Liveness
curl http://127.0.0.1:5001/healthz
# Readiness (kiểm tra cấu hình + tài khoản)
curl http://127.0.0.1:5001/readyz

# Liệt kê model qua OpenAI surface
curl -H "Authorization: Bearer $YOUR_API_KEY" \
     http://127.0.0.1:5001/v1/models

# Test chat đơn giản
curl -X POST http://127.0.0.1:5001/v1/chat/completions \
  -H "Authorization: Bearer $YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-v4-flash",
    "messages": [
      {"role": "user", "content": "Xin chào, tự giới thiệu một câu nhé."}
    ]
  }'
```

Bảng quản trị: mở `http://127.0.0.1:5001/admin`, đăng nhập bằng `DS2API_ADMIN_KEY`. WebUI mặc định đã chuyển sang giao diện tiếng Việt; có thể đổi sang Tiếng Anh / Trung qua nút ngôn ngữ.

> Nếu muốn xem chi tiết về reverse proxy nâng cao, monitoring, GHCR, các bước phát hành… hãy tham khảo [DEPLOY.md](./DEPLOY.md) hoặc [DEPLOY.en.md](./DEPLOY.en.md).
