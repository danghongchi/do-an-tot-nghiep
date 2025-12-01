import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Help() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const categories = [
    { id: 'getting-started', name: 'Bắt đầu' },
    { id: 'booking', name: 'Đặt lịch hẹn' },
    { id: 'payment', name: 'Thanh toán' },
    { id: 'counselor', name: 'Chuyên gia' },
    { id: 'chat', name: 'Chat & Tư vấn' },
    { id: 'account', name: 'Tài khoản' },
  ];

  const faqs = {
    'getting-started': [
      {
        q: 'Làm thế nào để đăng ký tài khoản?',
        a: 'Nhấn vào nút "Đăng ký" ở góc trên bên phải, điền đầy đủ thông tin (họ tên, email, mật khẩu), sau đó xác thực email để kích hoạt tài khoản.'
      },
      {
        q: 'Tôi có thể sử dụng dịch vụ mà không cần đăng ký không?',
        a: 'Bạn có thể xem danh sách chuyên gia và thông tin dịch vụ, nhưng cần đăng ký để đặt lịch hẹn và sử dụng các tính năng tư vấn.'
      },
      {
        q: 'Làm thế nào để tìm chuyên gia phù hợp?',
        a: 'Vào mục "Chuyên gia", sử dụng bộ lọc theo chuyên khoa, kinh nghiệm, giá cả, và đánh giá. AI Advisor cũng có thể gợi ý chuyên gia phù hợp dựa trên vấn đề của bạn.'
      }
    ],
    'booking': [
      {
        q: 'Cách đặt lịch hẹn với chuyên gia?',
        a: 'Chọn chuyên gia bạn muốn, xem lịch trống của họ, chọn ngày giờ phù hợp, điền thông tin và thanh toán để xác nhận lịch hẹn.'
      },
      {
        q: 'Tôi có thể hủy hoặc đổi lịch hẹn không?',
        a: 'Có, bạn có thể hủy lịch hẹn trước 24 giờ để được hoàn tiền. Để đổi lịch, vui lòng liên hệ chuyên gia hoặc support.'
      },
      {
        q: 'Sự khác biệt giữa tư vấn online và offline?',
        a: 'Tư vấn online: gặp mặt qua video call, linh hoạt về địa điểm. Tư vấn offline: gặp trực tiếp tại phòng khám của chuyên gia.'
      },
      {
        q: 'Tôi có thể đặt lịch định kỳ không?',
        a: 'Hiện tại bạn cần đặt từng buổi riêng lẻ. Tính năng đặt lịch định kỳ sẽ được cập nhật sớm.'
      }
    ],
    'payment': [
      {
        q: 'Các phương thức thanh toán nào được hỗ trợ?',
        a: 'Hiện tại chúng tôi hỗ trợ thanh toán qua VNPay (thẻ ATM, thẻ tín dụng, QR code). Sẽ bổ sung thêm các phương thức khác trong tương lai.'
      },
      {
        q: 'Khi nào tôi cần thanh toán?',
        a: 'Thanh toán ngay sau khi đặt lịch để xác nhận cuộc hẹn. Lịch hẹn chỉ được xác nhận khi thanh toán thành công.'
      },
      {
        q: 'Chính sách hoàn tiền như thế nào?',
        a: 'Hủy trước 24h: hoàn 100%. Hủy trong vòng 24h: hoàn 50%. Không hoàn tiền nếu bỏ lỡ cuộc hẹn mà không báo trước.'
      },
      {
        q: 'Tôi có thể xem lịch sử thanh toán ở đâu?',
        a: 'Vào mục "Lịch sử thanh toán" trong menu cá nhân để xem tất cả các giao dịch của bạn.'
      }
    ],
    'counselor': [
      {
        q: 'Làm thế nào để trở thành chuyên gia tư vấn?',
        a: 'Nhấn "Đăng ký làm chuyên gia" ở trang chủ, điền đơn đăng ký với thông tin về bằng cấp, kinh nghiệm và tải lên các giấy tờ cần thiết. Admin sẽ duyệt trong 3-5 ngày làm việc.'
      },
      {
        q: 'Tiêu chí nào để chọn chuyên gia?',
        a: 'Xem chuyên khoa, số năm kinh nghiệm, đánh giá từ bệnh nhân khác, giá cả, và số người đã tư vấn. Đọc phần giới thiệu để hiểu phong cách tư vấn.'
      },
      {
        q: 'Tôi có thể thay đổi chuyên gia không?',
        a: 'Có, bạn hoàn toàn có thể chọn chuyên gia khác cho lần tư vấn tiếp theo nếu cảm thấy không phù hợp.'
      }
    ],
    'chat': [
      {
        q: 'Chat với chuyên gia hoạt động như thế nào?',
        a: 'Sau khi lịch hẹn được xác nhận, bạn có thể chat trực tiếp với chuyên gia thông qua hệ thống chat. Tin nhắn được mã hóa và bảo mật.'
      },
      {
        q: 'Tôi có thể chat với AI Advisor không?',
        a: 'Có, AI Advisor luôn sẵn sàng lắng nghe và đưa ra lời khuyên ban đầu, đồng thời gợi ý chuyên gia phù hợp. Tuy nhiên AI không thay thế chuyên gia thực.'
      },
      {
        q: 'Thông tin chat có được bảo mật không?',
        a: 'Tuyệt đối. Tất cả tin nhắn được mã hóa và chỉ bạn, chuyên gia có thể xem. Chúng tôi tuân thủ nghiêm ngặt các quy định về bảo mật thông tin y tế.'
      }
    ],
    'account': [
      {
        q: 'Làm thế nào để đổi mật khẩu?',
        a: 'Vào "Cài đặt tài khoản", chọn "Đổi mật khẩu", nhập mật khẩu cũ và mật khẩu mới.'
      },
      {
        q: 'Quên mật khẩu phải làm sao?',
        a: 'Nhấn "Quên mật khẩu" ở trang đăng nhập, nhập email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu qua email.'
      },
      {
        q: 'Tôi muốn xóa tài khoản thì làm thế nào?',
        a: 'Vào "Cài đặt" > "Bảo mật" > "Xóa tài khoản". Lưu ý: việc này không thể hoàn tác và tất cả dữ liệu sẽ bị xóa vĩnh viễn.'
      }
    ]
  };

  const guides = [
    {
      title: 'Hướng dẫn đặt lịch hẹn',
      description: 'Tìm hiểu cách đặt lịch tư vấn với chuyên gia trong 3 bước',
      link: '#guide-booking'
    },
    {
      title: 'Cách sử dụng AI Advisor',
      description: 'Trò chuyện với AI để nhận gợi ý chuyên gia phù hợp',
      link: '#guide-ai'
    },
    {
      title: 'Thanh toán và hoàn tiền',
      description: 'Phương thức thanh toán và chính sách hoàn tiền',
      link: '#guide-payment'
    },
    {
      title: 'Bảo mật thông tin',
      description: 'Cách chúng tôi bảo vệ dữ liệu cá nhân của bạn',
      link: '#guide-security'
    }
  ];

  const filteredFAQs = searchQuery
    ? Object.entries(faqs).reduce((acc, [category, questions]) => {
        const filtered = questions.filter(
          faq =>
            faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.a.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered.length > 0) {
          acc[category] = filtered;
        }
        return acc;
      }, {})
    : { [activeCategory]: faqs[activeCategory] };

  const toggleFAQ = (category, index) => {
    const key = `${category}-${index}`;
    setExpandedFAQ(expandedFAQ === key ? null : key);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Trung tâm trợ giúp
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tìm câu trả lời cho câu hỏi của bạn hoặc liên hệ với chúng tôi
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi hoặc từ khóa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-lg shadow-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Link
            to="/about"
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-500 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                <svg className="w-5 h-5 text-blue-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900">Giới thiệu</h3>
            </div>
            <p className="text-gray-600 text-sm">Tìm hiểu về chúng tôi</p>
          </Link>

          <Link
            to="/contact"
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-500 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                <svg className="w-5 h-5 text-green-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900">Liên hệ</h3>
            </div>
            <p className="text-gray-600 text-sm">Gửi tin nhắn cho chúng tôi</p>
          </Link>

          <a
            href="tel:1800599199"
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-red-500 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-500 transition-colors">
                <svg className="w-5 h-5 text-red-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900">Hotline</h3>
            </div>
            <p className="text-gray-600 text-sm">1800.599.199 (24/7)</p>
          </a>

          <Link
            to={user ? (user.role === 'user' ? '/patient/appointments' : '/counselor') : '/login'}
            className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-white">Đặt lịch ngay</h3>
            </div>
            <p className="text-white text-sm opacity-90">Bắt đầu tư vấn</p>
          </Link>
        </div>

        {/* Guides Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Hướng dẫn sử dụng
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {guides.map((guide, index) => (
              <a
                key={index}
                href={guide.link}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-300 group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 flex-1">{guide.title}</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{guide.description}</p>
              </a>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Categories Sidebar */}
          {!searchQuery && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-4">
                <h3 className="font-bold text-lg text-gray-900 mb-4">Danh mục</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                        activeCategory === cat.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="font-medium">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FAQ Content */}
          <div className={searchQuery ? 'lg:col-span-4' : 'lg:col-span-3'}>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {searchQuery ? `Kết quả tìm kiếm: "${searchQuery}"` : 'Câu hỏi thường gặp'}
              </h2>

              {Object.keys(filteredFAQs).length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-gray-600 text-lg mb-2">Không tìm thấy kết quả phù hợp</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Xóa tìm kiếm
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(filteredFAQs).map(([category, questions]) => (
                    <div key={category}>
                      {searchQuery && (
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          {categories.find(c => c.id === category)?.name}
                        </h3>
                      )}
                      <div className="space-y-3">
                        {questions.map((faq, index) => {
                          const key = `${category}-${index}`;
                          const isExpanded = expandedFAQ === key;
                          return (
                            <div
                              key={index}
                              className="border-2 border-gray-100 rounded-xl overflow-hidden hover:border-blue-300 transition-all"
                            >
                              <button
                                onClick={() => toggleFAQ(category, index)}
                                className="w-full text-left px-6 py-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
                              >
                                <span className="font-semibold text-gray-900 flex-1">
                                  {faq.q}
                                </span>
                                <span className={`text-2xl transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                  ▼
                                </span>
                              </button>
                              {isExpanded && (
                                <div className="px-6 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
                                  <p className="text-gray-700 leading-relaxed">{faq.a}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white shadow-2xl">
          <h2 className="text-2xl font-bold mb-3">Không tìm thấy câu trả lời?</h2>
          <p className="text-lg opacity-90 mb-6">
            Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn 24/7
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Gửi tin nhắn
            </Link>
            <a
              href="tel:1800599199"
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-400 transition-colors shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Gọi hotline
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
