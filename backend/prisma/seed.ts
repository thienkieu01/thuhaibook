import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Đang khởi tạo dữ liệu mẫu...');

  // 1. Tạo tài khoản Admin mẫu
  const hashedPassword = await bcrypt.hash('123456', 10);
  await prisma.users.upsert({
    where: { Email: 'admin@thuhai.vn' },
    update: {},
    create: {
      Username: 'user',
      FirstName: 'Quản trị',
      LastName: 'Hệ thống',
      Email: 'user@thuhai.vn',
      Phone: '0901234567',
      PasswordHash: hashedPassword,
      Role: 'USER',
      Status: 'ACTIVE',
    },
  });

  // 2. Tạo Thể loại sách mẫu
 

  const publisher = await prisma.publishers.upsert({
    where: { Name: 'NXB Trẻ' },
    update: {},
    create: { Name: 'NXB Trẻ' },
  });

  // 2. Tạo Đầu sách
  const book = await prisma.books.create({
    data: {
      Title: 'Cho Tôi Xin Một Vé Đi Tuổi Thơ',
      PublisherID: publisher.PublisherID,
      AgeGroup: 'Mọi lứa tuổi',
      Description: 'Tác phẩm nổi tiếng của Nguyễn Nhật Ánh.',
      CoverImage: 'https://example.com/cover.jpg',
      Status: 'AVAILABLE',
    },
    
  });

  // 3. Tạo Bản sách cũ (BookCopy)
  await prisma.bookCopies.create({
    data: {
      BookID: book.BookID,
      ConditionPercent: 90,
      DamageDescription: 'Gáy hơi gập nhẹ.',
      Price: 45000,
      Status: 'AVAILABLE',
    },
  });

  // 3. Tạo Dịch vụ gia tăng mẫu
  await prisma.services.createMany({
    data: [
      { Name: 'Bọc sách plastic', Price: 5000 },
      { Name: 'Gói quà nghệ thuật', Price: 15000 },
      { Name: 'Tặng kèm Bookmark Thư Hải', Price: 2000 },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed dữ liệu mẫu thành công!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });