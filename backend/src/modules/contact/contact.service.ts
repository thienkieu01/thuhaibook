
import { Injectable } from '@nestjs/common';

@Injectable()
export class ContactService {
  getContactInfo() {
    return {
      success: true,
      data: {
        storeName: 'Thư Hải',
        tagline: 'Tiệm sách cũ — Gìn giữ trang giấy, nối dài tri thức',
        introduction:
          'Thư Hải là cửa hàng sách cũ tuyển chọn, mang đến những cuốn sách đã qua sử dụng với tình trạng và giá cả minh bạch để bạn đọc dễ dàng tìm thấy tri thức phù hợp.',
        email: 'lienhe@thuhai.vn',
        hotline: '0901234567',
        zaloUrl: 'https://zalo.me/0901234567',
        messengerUrl: 'https://m.me/thuhai.bookstore',
        address: 'TP. Hồ Chí Minh, Việt Nam',
        map: {
          lat: 10.7769,
          lng: 106.7009,
          embedUrl:
            'https://www.google.com/maps?q=10.7769,106.7009&hl=vi&z=15&output=embed',
        },
      },
    };
  }
}