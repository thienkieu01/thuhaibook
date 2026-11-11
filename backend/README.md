## Tech Stack

Framework: NestJS (TypeScript)

Database ORM: Prisma ORM

Database: PostgreSQL

Authentication: JWT (JSON Web Token) & Passport

API Testing: Postman Collection

## Cấu trúc Dự án (Modules)

src/
├── auth/           # Đăng ký, đăng nhập, phân quyền (Role Guard), quản lý địa chỉ
├── books/          # Quản lý Đầu sách (Books), Bản sách (BookCopies), Tác giả, NXB, Thể loại
├── cart/           # Quản lý giỏ hàng sách cũ độc bản
├── orders/         # Tạo đơn hàng, xử lý giao dịch đồng thời (Prisma $transaction), hủy đơn
├── reviews/        # Đánh giá sách (Ràng buộc lịch sử đã mua hàng)
├── blog/           # Bài viết cộng đồng, bình luận, lượt thích
└── prisma/         # PrismaService & Cấu hình Database


## Hướng dẫn Khởi chạy Dự án

1. Yêu cầu 

Node.js (Phiên bản 18 trở lên)

PostgreSQL (Đang chạy cục bộ ở port 5432 hoặc Database Cloud)

2. Cài đặt Dependencies

Mở Terminal tại thư mục dự án và chạy:

npm install


3. Cấu hình Biến môi trường (.env)

Tạo file .env tại thư mục gốc của dự án (cùng cấp với package.json) và điền các thông tin sau:

- Database Connection String
DATABASE_URL="postgresql://postgres:123456@localhost:5432/thu_hai_db?schema=public"

- JWT Secret Key
JWT_SECRET="thu_hai_secret_key_2026"
JWT_EXPIRES_IN="7d"

- Server Port
PORT=3000


Lưu ý: Thay đổi postgres:123456 thành username và password PostgreSQL trên máy của bạn.

4. Khởi tạo Cơ sở dữ liệu với Prisma

Chạy các lệnh sau để tự động tạo bảng và nạp dữ liệu mẫu vào PostgreSQL:

- Đồng bộ Schema và tạo các bảng trong PostgreSQL
npx prisma migrate dev --name init

- Sinh bộ mã Prisma Client
npx prisma generate

- Nạp dữ liệu mẫu
npx prisma db seed


- Khởi động Server Development

npm run start:dev


Server backend sẽ chạy tại địa chỉ: http://localhost:3000

# Quản lý Dữ liệu trực quan với Prisma Studio

Để xem, sửa hoặc thêm dữ liệu trực tiếp trên giao diện Web, mở một cửa sổ Terminal mới và chạy:

npx prisma studio


Trình duyệt sẽ tự động mở trang http://localhost:5555.

# Hướng dẫn Kiểm thử API trên Postman

Import Collection & Environment: Import file Postman Collection của dự án vào Postman.

Thiết lập Environment: Chọn Environment Thư Hải - Local.

Cấu hình biến baseUrl: Điền value là http://localhost:3000.

Xác thực API: Sau khi gọi API Login, Postman sẽ tự động lưu accessToken vào Environment để dùng cho các request cần đăng nhập (Bearer Token).