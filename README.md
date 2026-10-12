# Hân ở Úc

Website trưng bày sản phẩm bằng tiếng Việt, tối ưu cho điện thoại, tablet và máy tính. Giao diện mới lấy cảm hứng từ cách Chemist Warehouse tổ chức tìm kiếm, danh mục, banner và thẻ sản phẩm nhưng được thiết kế riêng theo màu sắc/logo Hân ở Úc.

## Tính năng chính
- Giao diện chỉ dùng tiếng Việt
- Thanh slogan + tìm kiếm lớn, dễ dùng
- Carousel khuyến mãi tự chạy
- Danh mục sản phẩm và thương hiệu
- Lưu sản phẩm yêu thích trên thiết bị
- Giỏ hàng, tăng/giảm số lượng và tổng tạm tính
- Trang chi tiết sản phẩm với nút thêm vào giỏ
- Giá thường, giá sale, sale sắp tới và preorder
- Footer có số điện thoại, Facebook và thông tin sở hữu website
- Logo Hân ở Úc dùng ở header, footer và favicon/tab icon
- Trang `/admin` bằng tiếng Việt để quản lý sản phẩm và danh mục

## Biến môi trường
Dùng các biến sau ở `.env.local` và trong **Vercel > Environment Variables**:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_STORE_CURRENCY=AUD
NEXT_PUBLIC_CONTACT_URL=https://m.me/YOUR_PAGE
NEXT_PUBLIC_FACEBOOK_URL=https://www.facebook.com/YOUR_PAGE
NEXT_PUBLIC_CONTACT_PHONE=YOUR_PHONE_NUMBER
```

- `NEXT_PUBLIC_CONTACT_URL`: link mở khi khách bấm liên hệ đặt hàng.
- `NEXT_PUBLIC_FACEBOOK_URL`: link Facebook hiển thị ở cuối website.
- `NEXT_PUBLIC_CONTACT_PHONE`: số điện thoại hiển thị ở cuối website.

## Chạy trên máy
```bash
npm install
npm run dev
```

Mở:
- Cửa hàng: `http://localhost:3000`
- Quản trị: `http://localhost:3000/admin`

## Đưa lên Vercel
1. Chép các file mới vào thư mục repo GitHub Desktop của bạn.
2. Trong GitHub Desktop: **Commit to main** rồi **Push origin**.
3. Vercel sẽ tự động tạo deployment mới từ branch `main`.
4. Kiểm tra các Environment Variables bên trên đã có trong Vercel.

## Supabase
Cấu trúc database hiện tại vẫn dùng được. Không cần chạy SQL mới cho các tính năng yêu thích và giỏ hàng vì chúng được lưu trên thiết bị của khách bằng localStorage.
