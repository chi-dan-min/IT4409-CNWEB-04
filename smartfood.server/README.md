# Dự án Backend

Đây là dự án backend xây dựng bằng ExpressJS.

## Các công nghệ chính

* **Node.js:** Môi trường JavaScript runtime được xây dựng trên V8 JavaScript engine.
* **Express.js:** Một framework web Node.js tối giản và linh hoạt, cung cấp một tập hợp các tính năng mạnh mẽ để xây dựng các ứng dụng web và di động.

## Cài đặt

Để chạy dự án này trên máy cục bộ của bạn, hãy làm theo các bước sau:

1.  **Di chuyển vào thư mục dự án:**
    ```bash
    cd smartfood.server
    ```

2.  **Cài đặt các dependencies:**
    ```bash
    npm install
    ```

## Chạy ứng dụng

Để khởi động máy chủ backend, hãy chạy lệnh sau:

```bash
npm run start:dev
```

## Cấu trúc dự án

Đây là cấu trúc thư mục của dự án backend:

```
smartfood.server/
├── node_modules/    # Chứa các thư viện và dependencies đã cài đặt
├── src/             # Chứa mã nguồn chính của backend
│   ├── controller/  # Chứa các file xử lý logic nghiệp vụ và tương tác với model
│   ├── middleware/  # Chứa các middleware để xử lý request và response
│   ├── model/       # Chứa các định nghĩa về dữ liệu (ví dụ: schema database)
│   └── route/       # Chứa các định nghĩa về các API endpoints của ứng dụng
├── index.js         # Điểm vào chính của ứng dụng backend
├── .gitignore       # Chỉ định các tệp và thư mục Git nên bỏ qua
├── package-lock.json# Khóa các phiên bản dependencies (cho npm)
├── package.json     # Chứa thông tin về dự án và các dependencies
└── README.md        # Tài liệu mô tả dự án (tệp này)
```
