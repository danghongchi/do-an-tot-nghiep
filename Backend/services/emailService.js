const nodemailer = require('nodemailer');
const config = require('../config');

// Tạo transporter cho email
const createTransporter = () => {
  // Kiểm tra nếu là email test, sử dụng mock transporter
  if (config.email.auth.user === 'test@gmail.com' || !config.email.auth.user) {
    return {
      sendMail: async (mailOptions) => {
        console.log('📧 MOCK EMAIL SENT:');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('Verification URL:', mailOptions.html.match(/href="([^"]+)"/)?.[1] || 'No URL found');
        console.log('---');
        return { messageId: 'mock-' + Date.now() };
      }
    };
  }
  
  try {
    return nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: config.email.auth
    });
  } catch (error) {
    console.error('Lỗi tạo email transporter:', error);
    // Fallback to mock transporter
    return {
      sendMail: async (mailOptions) => {
        console.log('📧 MOCK EMAIL SENT (Fallback):');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('Verification URL:', mailOptions.html.match(/href="([^"]+)"/)?.[1] || 'No URL found');
        console.log('---');
        return { messageId: 'mock-' + Date.now() };
      }
    };
  }
};

// Gửi email reset password
const sendResetPasswordEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: config.email.auth.user,
      to: email,
      subject: 'Đặt lại mật khẩu - Hệ thống tư vấn tâm lý',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Đặt lại mật khẩu</h2>
          <p>Xin chào,</p>
          <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
          <p>Vui lòng nhấp vào liên kết bên dưới để đặt lại mật khẩu:</p>
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Đặt lại mật khẩu</a>
          <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email reset password đã được gửi thành công');
    return true;
  } catch (error) {
    console.error('Lỗi gửi email reset password:', error);
    throw error;
  }
};

// Gửi email thông báo đơn đăng ký counselor
const sendCounselorApplicationEmail = async (email, status) => {
  try {
    const transporter = createTransporter();
    
    const subject = status === 'approved' 
      ? 'Đơn đăng ký counselor đã được duyệt' 
      : 'Đơn đăng ký counselor đã bị từ chối';
    
    const message = status === 'approved'
      ? 'Chúc mừng! Đơn đăng ký counselor của bạn đã được duyệt. Bạn có thể đăng nhập và bắt đầu cung cấp dịch vụ tư vấn.'
      : 'Rất tiếc, đơn đăng ký counselor của bạn đã bị từ chối. Vui lòng liên hệ admin để biết thêm chi tiết.';
    
    const mailOptions = {
      from: config.email.auth.user,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${subject}</h2>
          <p>Xin chào,</p>
          <p>${message}</p>
          <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email thông báo counselor application đã được gửi: ${status}`);
    return true;
  } catch (error) {
    console.error('Lỗi gửi email counselor application:', error);
    throw error;
  }
};

// Send email verification
const sendEmailVerification = async (email, userName, verificationToken) => {
  try {
    const transporter = createTransporter();
    
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: config.email.auth.user || 'noreply@test.com',
      to: email,
      subject: 'Xác thực email - Hệ thống tư vấn tâm lý',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Xác thực email của bạn</h2>
          <p>Xin chào ${userName},</p>
          <p>Cảm ơn bạn đã đăng ký tài khoản với chúng tôi!</p>
          <p>Để hoàn tất quá trình đăng ký, vui lòng xác thực email của bạn bằng cách nhấp vào nút bên dưới:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Xác thực email</a>
          </div>
          <p><strong>Lưu ý:</strong> Link này sẽ hết hạn sau 24 giờ.</p>
          <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
          <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email xác thực đã được gửi thành công');
    return true;
  } catch (error) {
    console.error('Lỗi gửi email xác thực:', error);
    // Không throw error để không làm fail registration
    return false;
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, userName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: config.email.auth.user,
      to: email,
      subject: 'Chào mừng đến với Hệ thống tư vấn tâm lý',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Chào mừng ${userName}!</h2>
          <p>Xin chào,</p>
          <p>Cảm ơn bạn đã đăng ký tài khoản với chúng tôi. Bạn có thể bắt đầu sử dụng các dịch vụ tư vấn tâm lý ngay bây giờ.</p>
          <p>Chúc bạn có những trải nghiệm tốt nhất!</p>
          <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email chào mừng đã được gửi thành công');
    return true;
  } catch (error) {
    console.error('Lỗi gửi email chào mừng:', error);
    throw error;
  }
};

// Email rate limiting
const emailRateLimit = new Map();

const checkEmailRateLimit = (email) => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxEmails = 3; // Maximum 3 emails per window

  if (!emailRateLimit.has(email)) {
    emailRateLimit.set(email, []);
  }

  const userEmails = emailRateLimit.get(email);
  
  // Remove old entries outside the window
  const validEmails = userEmails.filter(timestamp => now - timestamp < windowMs);
  emailRateLimit.set(email, validEmails);

  if (validEmails.length >= maxEmails) {
    return false; // Rate limit exceeded
  }

  // Add current email
  validEmails.push(now);
  emailRateLimit.set(email, validEmails);
  
  return true; // Email allowed
};

module.exports = {
  sendResetPasswordEmail,
  sendCounselorApplicationEmail,
  sendEmailVerification,
  sendWelcomeEmail,
  checkEmailRateLimit,
  sendPaymentSuccessEmail,
  sendNewAppointmentToCounselor
};

// Gửi email xác nhận thanh toán lịch hẹn thành công
async function sendPaymentSuccessEmail(toEmail, details = {}) {
  try {
    if (!toEmail) return false;
    const transporter = createTransporter();

    const {
      userName,
      appointmentId,
      appointmentDate,
      appointmentTime,
      appointmentType,
      counselorName,
      amount,
      meetingUrl,
      gateway = 'VNPAY',
      txnRef
    } = details;

    const fmtAmount = Number(amount || 0).toLocaleString('vi-VN');

    const rows = [
      `<p>Xin chào${userName ? ' ' + userName : ''},</p>`,
      `<p>Thanh toán lịch hẹn của bạn đã được xác nhận thành công.</p>`,
      `<ul style="line-height:1.6;">`,
      appointmentId ? `<li>Mã lịch hẹn: <strong>#${appointmentId}</strong></li>` : '',
      appointmentDate ? `<li>Ngày: <strong>${appointmentDate}</strong></li>` : '',
      appointmentTime ? `<li>Giờ: <strong>${appointmentTime}</strong></li>` : '',
      appointmentType ? `<li>Hình thức: <strong>${appointmentType === 'online' ? 'Trực tuyến' : 'Trực tiếp'}</strong></li>` : '',
      counselorName ? `<li>Chuyên gia: <strong>${counselorName}</strong></li>` : '',
      amount != null ? `<li>Số tiền: <strong>${fmtAmount} VND</strong></li>` : '',
      gateway ? `<li>Cổng thanh toán: <strong>${gateway}</strong></li>` : '',
      txnRef ? `<li>Mã giao dịch: <strong>${txnRef}</strong></li>` : '',
      meetingUrl ? `<li>Link phòng tư vấn: <a href="${meetingUrl}">${meetingUrl}</a></li>` : '',
      `</ul>`,
      `<p>Bạn có thể theo dõi chi tiết trong mục Lịch hẹn trên hệ thống.</p>`,
      `<p>Trân trọng,<br/>Đội ngũ hỗ trợ</p>`
    ].filter(Boolean);

    const mailOptions = {
      from: config.email.auth.user || 'noreply@test.com',
      to: toEmail,
      subject: 'Xác nhận thanh toán lịch hẹn thành công',
      html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
        <h2 style="color:#2a7;">Thanh toán thành công</h2>
        ${rows.join('\n')}
      </div>`
    };

    await transporter.sendMail(mailOptions);
    console.log('[Email] Sent payment success email to:', toEmail);
    return true;
  } catch (err) {
    console.error('[Email] Error sending payment success email:', err);
    return false;
  }
}

// Gửi email thông báo cho chuyên gia khi có lịch hẹn mới
async function sendNewAppointmentToCounselor(counselorEmail, details = {}) {
  try {
    if (!counselorEmail) return false;
    const transporter = createTransporter();

    const {
      counselorName,
      patientName,
      appointmentId,
      appointmentDate,
      appointmentTime,
      appointmentType,
      notes,
      isAnonymous
    } = details;

    const displayPatientName = isAnonymous ? 'Khách hàng ẩn danh' : (patientName || 'Khách hàng');
    const displayNotes = isAnonymous ? '(Khách hàng yêu cầu ẩn danh)' : (notes || 'Không có ghi chú');

    const mailOptions = {
      from: config.email.auth.user || 'noreply@test.com',
      to: counselorEmail,
      subject: '🔔 Bạn có lịch hẹn mới',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #10b981; margin-top: 0;">🔔 Bạn có lịch hẹn mới!</h2>
            <p>Xin chào ${counselorName || 'Chuyên gia'},</p>
            <p>Bạn vừa nhận được một lịch hẹn tư vấn mới từ khách hàng.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">📋 Thông tin lịch hẹn:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${appointmentId ? `<tr><td style="padding: 8px 0; color: #6b7280;">Mã lịch hẹn:</td><td style="padding: 8px 0; font-weight: bold; color: #111827;">#${appointmentId}</td></tr>` : ''}
                <tr><td style="padding: 8px 0; color: #6b7280;">Khách hàng:</td><td style="padding: 8px 0; font-weight: bold; color: #111827;">${displayPatientName}</td></tr>
                ${appointmentDate ? `<tr><td style="padding: 8px 0; color: #6b7280;">Ngày:</td><td style="padding: 8px 0; font-weight: bold; color: #111827;">${appointmentDate}</td></tr>` : ''}
                ${appointmentTime ? `<tr><td style="padding: 8px 0; color: #6b7280;">Giờ:</td><td style="padding: 8px 0; font-weight: bold; color: #111827;">${appointmentTime}</td></tr>` : ''}
                ${appointmentType ? `<tr><td style="padding: 8px 0; color: #6b7280;">Hình thức:</td><td style="padding: 8px 0; font-weight: bold; color: #111827;">${appointmentType === 'online' ? '💻 Trực tuyến' : '🏥 Trực tiếp'}</td></tr>` : ''}
                ${notes ? `<tr><td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Ghi chú:</td><td style="padding: 8px 0; color: #111827;">${displayNotes}</td></tr>` : ''}
              </table>
            </div>

            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>⚠️ Lưu ý:</strong> Khách hàng đã thanh toán. Vui lòng xác nhận lịch hẹn trong hệ thống để khách hàng nhận được thông báo.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${config.frontendUrl}/counselor/appointments" 
                 style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Xem chi tiết lịch hẹn
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Trân trọng,<br>
              <strong>Đội ngũ hỗ trợ - Mental Health Care</strong>
            </p>
          </div>
          
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
            Email này được gửi tự động. Vui lòng không trả lời email này.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('[Email] Sent new appointment notification to counselor:', counselorEmail);
    return true;
  } catch (err) {
    console.error('[Email] Error sending new appointment email to counselor:', err);
    return false;
  }
}
