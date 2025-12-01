import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  const team = [
    {
      name: 'Dr. Nguyễn Minh Anh',
      role: 'Founder & CEO',
      specialty: 'Tâm lý lâm sàng',
      description: 'Bác sĩ tâm lý với 15 năm kinh nghiệm'
    },
    {
      name: 'ThS. Trần Thu Hà',
      role: 'Giám đốc Y khoa',
      specialty: 'Tâm lý trị liệu',
      description: 'Chuyên gia tâm lý hàng đầu Việt Nam'
    },
    {
      name: 'Lê Văn Nam',
      role: 'CTO',
      specialty: 'Công nghệ Y tế',
      description: 'Chuyên gia công nghệ trong y tế số'
    },
    {
      name: 'Phạm Mai Linh',
      role: 'Head of Customer Care',
      specialty: 'Chăm sóc khách hàng',
      description: 'Lắng nghe và hỗ trợ người dùng 24/7'
    }
  ];

  const values = [
    {
      title: 'Tận tâm',
      description: 'Đặt sức khỏe tâm lý của bạn lên hàng đầu',
      color: 'red'
    },
    {
      title: 'Bảo mật',
      description: 'Thông tin của bạn được bảo vệ tuyệt đối',
      color: 'blue'
    },
    {
      title: 'Chuyên nghiệp',
      description: 'Đội ngũ chuyên gia giàu kinh nghiệm',
      color: 'green'
    },
    {
      title: 'Đồng hành',
      description: 'Luôn bên bạn trên hành trình chữa lành',
      color: 'purple'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Người dùng tin tưởng' },
    { number: '500+', label: 'Chuyên gia tâm lý' },
    { number: '50,000+', label: 'Buổi tư vấn thành công' },
    { number: '4.9/5', label: 'Đánh giá trung bình' }
  ];

  const timeline = [
    { year: '2020', event: 'Thành lập công ty và xây dựng nền tảng' },
    { year: '2021', event: 'Ra mắt dịch vụ tư vấn trực tuyến đầu tiên' },
    { year: '2022', event: 'Đạt 5,000 người dùng và 100 chuyên gia' },
    { year: '2023', event: 'Tích hợp AI Advisor và mở rộng toàn quốc' },
    { year: '2024', event: 'Nhận giải thưởng "Startup Y tế xuất sắc"' },
    { year: '2025', event: 'Phát triển ứng dụng mobile và mở rộng quốc tế' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Về chúng tôi
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
            Nền tảng tư vấn tâm lý trực tuyến hàng đầu Việt Nam, 
            kết nối bạn với các chuyên gia tâm lý uy tín
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Sứ mệnh */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-blue-100">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Sứ mệnh</h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                Làm cho dịch vụ tư vấn tâm lý trở nên dễ tiếp cận, chuyên nghiệp 
                và hiệu quả cho mọi người dân Việt Nam. Chúng tôi tin rằng sức khỏe 
                tâm lý là nền tảng của hạnh phúc và thành công trong cuộc sống.
              </p>
            </div>

            {/* Tầm nhìn */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-purple-100">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Tầm nhìn</h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                Trở thành nền tảng tư vấn tâm lý trực tuyến số 1 tại Đông Nam Á, 
                nơi mọi người đều có thể dễ dàng tìm kiếm sự giúp đỡ chuyên nghiệp 
                mỗi khi họ cần, mọi lúc mọi nơi.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-white mb-12">
            Con số ấn tượng
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-lg text-white opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Giá trị cốt lõi
          </h2>
          <p className="text-center text-gray-600 text-lg mb-12 max-w-2xl mx-auto">
            Những giá trị định hướng mọi hoạt động của chúng tôi
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const colorMap = {
                red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
                blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
                green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
                purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' }
              };
              const colors = colorMap[value.color];
              
              return (
                <div
                  key={index}
                  className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 ${colors.border}`}
                >
                  <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <svg className={`w-8 h-8 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Hành trình phát triển
          </h2>
          <p className="text-center text-gray-600 text-lg mb-12">
            Từ ý tưởng đến thực tế
          </p>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-blue-400 to-purple-600"></div>
            
            <div className="space-y-12">
              {timeline.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
                      <div className="font-bold text-2xl text-blue-600 mb-2">{item.year}</div>
                      <p className="text-gray-700">{item.event}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full border-4 border-white shadow-lg z-10"></div>
                  <div className="w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Đội ngũ lãnh đạo
          </h2>
          <p className="text-center text-gray-600 text-lg mb-12 max-w-2xl mx-auto">
            Những người tiên phong trong việc đem lại dịch vụ tâm lý chất lượng cao
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl font-bold text-blue-600">
                    {member.name.split(' ').pop().charAt(0)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-blue-600 font-semibold mb-2">{member.role}</p>
                <p className="text-sm text-gray-600 mb-3">{member.specialty}</p>
                <p className="text-sm text-gray-500">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Tại sao chọn chúng tôi?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Chuyên gia uy tín</h3>
              <p className="text-gray-600">
                500+ chuyên gia tâm lý được kiểm định bằng cấp, giấy phép hành nghề 
                và có nhiều năm kinh nghiệm thực tế.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Bảo mật tuyệt đối</h3>
              <p className="text-gray-600">
                Mọi thông tin được mã hóa end-to-end, tuân thủ các tiêu chuẩn 
                bảo mật y tế quốc tế HIPAA.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Công nghệ AI</h3>
              <p className="text-gray-600">
                AI Advisor thông minh giúp phân tích vấn đề và gợi ý chuyên gia 
                phù hợp nhất với bạn.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Dễ dàng sử dụng</h3>
              <p className="text-gray-600">
                Giao diện thân thiện, đặt lịch chỉ trong 3 phút, tư vấn mọi lúc mọi nơi 
                qua điện thoại hoặc máy tính.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Giá cả hợp lý</h3>
              <p className="text-gray-600">
                Chi phí tư vấn minh bạch, nhiều gói lựa chọn phù hợp với túi tiền. 
                Chính sách hoàn tiền rõ ràng.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Hỗ trợ 24/7</h3>
              <p className="text-gray-600">
                Đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ bạn bất cứ lúc nào, 
                kể cả ngày lễ và cuối tuần.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Sẵn sàng bắt đầu hành trình chữa lành?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Hàng nghìn người đã tin tưởng và cải thiện sức khỏe tâm lý cùng chúng tôi
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg transform hover:scale-105"
            >
              Đăng ký ngay
            </Link>
            <Link
              to="/counselors"
              className="bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-400 transition-all shadow-lg transform hover:scale-105"
            >
              Tìm chuyên gia
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
