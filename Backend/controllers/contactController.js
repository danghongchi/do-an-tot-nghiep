const { sendEmail } = require('../services/emailService');

// Submit contact form (static - email only, no database)
const submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, category, message, priority } = req.body;
    
    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    console.log('📧 Contact form submission from:', name, email);

    // Send email notification to admin
    try {
      await sendEmail({
        to: 'support@mindcare.vn', // Change to your admin email
        subject: `[${priority?.toUpperCase() || 'NORMAL'}] ${subject}`,
        html: `
          <h2>Tin nhắn liên hệ mới</h2>
          <p><strong>Từ:</strong> ${name} (${email})</p>
          ${phone ? `<p><strong>SĐT:</strong> ${phone}</p>` : ''}
          <p><strong>Danh mục:</strong> ${category || 'general'}</p>
          <p><strong>Mức độ ưu tiên:</strong> ${priority || 'normal'}</p>
          <p><strong>Tiêu đề:</strong> ${subject}</p>
          <p><strong>Nội dung:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>Gửi lúc: ${new Date().toLocaleString('vi-VN')}</small></p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send contact notification email:', emailError);
    }

    // Send confirmation email to user
    try {
      await sendEmail({
        to: email,
        subject: 'Xác nhận đã nhận tin nhắn của bạn - MindCare',
        html: `
          <h2>Cảm ơn bạn đã liên hệ với MindCare!</h2>
          <p>Chào ${name},</p>
          <p>Chúng tôi đã nhận được tin nhắn của bạn về: <strong>${subject}</strong></p>
          <p>Đội ngũ hỗ trợ của chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.</p>
          <p>Nếu vấn đề khẩn cấp, vui lòng gọi hotline: <strong>1800.599.199</strong></p>
          <br>
          <p>Trân trọng,</p>
          <p><strong>Đội ngũ MindCare</strong></p>
          <hr>
          <p><small>Email này được gửi tự động, vui lòng không trả lời.</small></p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    res.json({ 
      message: 'Gửi tin nhắn thành công. Chúng tôi sẽ phản hồi sớm nhất!',
      success: true
    });

  } catch (error) {
    console.error('Error submitContactForm:', error);
    res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại sau!' });
  }
};

module.exports = {
  submitContactForm
};
