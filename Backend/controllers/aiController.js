const { query } = require('../config/database');
const aiService = require('../services/aiService');

/* =========================================
   Helpers
========================================= */

// Chuẩn hoá tiếng Việt về không dấu để so khớp từ khoá
const vnNormalize = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // bỏ dấu

// Shuffle mảng và lấy n phần tử đầu
const pickRandom = (arr, n) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
};

/* =========================================
   AI: Gợi ý counselor
========================================= */

const suggestCounselors = async (req, res) => {
  try {
    const { topic, appointmentMode, timePreference, preferredGender } = req.body || {};

    // Lấy danh sách counselors
    const counselors = await query(`
      SELECT 
        u.id AS user_id, 
        u.full_name, 
        u.gender,
        s.name AS specialty_name,
        cp.experience_years,
        cp.online_price, 
        cp.offline_price,
        cp.avatar_url
      FROM users u
      JOIN counselor_profiles cp ON u.id = cp.user_id
      LEFT JOIN specialties s ON cp.specialty_id = s.id
      WHERE u.role = 'counselor'
    `);

    // Gọi AI để gợi ý
    const aiResp = await aiService.suggestCounselors(
      topic,
      appointmentMode,
      timePreference,
      preferredGender
    );

    const aiSuggestions = aiResp?.suggestions || [];

    // Nếu AI không trả kết quả -> trả về 3 counselor ngẫu nhiên
    if (aiSuggestions.length === 0) {
      const randomCounselors = pickRandom(counselors, Math.min(3, counselors.length)).map(
        (c) => ({
          counselor_id: c.user_id,
          counselor_name: c.full_name,
          specialties: c.specialty_name || 'Tổng quát',
          experience: c.experience_years || 0,
          hourly_rate: c.online_price ?? null,
          avatar_url: c.avatar_url ?? null,
          match_score: Math.floor(Math.random() * 21) + 80, // 80–100
          reason: 'Phù hợp cơ bản theo kinh nghiệm và chuyên khoa.'
        })
      );
      return res.json({ suggestions: randomCounselors });
    }

    // Map AI suggestions với dữ liệu thật
    const mappedSuggestions = aiSuggestions
      .map((sug) => {
        const c = counselors.find((x) => x.user_id === sug.counselor_id);
        if (!c) return null;
        return {
          counselor_id: c.user_id,
          counselor_name: c.full_name,
          specialties: c.specialty_name || 'Tổng quát',
          experience: c.experience_years || 0,
          hourly_rate: c.online_price ?? null,
          avatar_url: c.avatar_url ?? null,
          match_score: sug.match_score ?? 85,
          reason: sug.reason || 'Phù hợp với yêu cầu của bạn.'
        };
      })
      .filter(Boolean);

    return res.json({ suggestions: mappedSuggestions });
  } catch (error) {
    console.error('Lỗi suggestCounselors:', error);
    return res.status(500).json({
      message: 'Xin lỗi, có lỗi xảy ra khi gợi ý chuyên gia.'
    });
  }
};

/* =========================================
   Đảm bảo bảng lịch sử chat AI
========================================= */

// Cache để tránh tạo bảng nhiều lần
let historyTableChecked = false;

const ensureAIHistoryTable = async () => {
  if (historyTableChecked) return;
  
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS ai_chat_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        message TEXT,
        response LONGTEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_created (user_id, created_at),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    historyTableChecked = true;
    console.log('[CONTROLLER] ai_chat_history table checked/created successfully');
  } catch (e) {
    console.error('Không thể tạo bảng ai_chat_history:', e.message);
    // Không throw error - chat vẫn hoạt động được
  }
};

/* =========================================
   Chat với AI Advisor
========================================= */

const chatWithAI = async (req, res) => {
  try {
    const { message, context = '', action } = req.body || {};
    const userId = req.user?.id || null; // Cho phép null nếu chưa đăng nhập

    if ((!message || String(message).trim() === '') && !action) {
      return res.status(400).json({ message: 'Tin nhắn không được để trống' });
    }

    // Nếu có action (ví dụ đặt lịch từ UI), phản hồi thân thiện
    let prefaceMsg = null;
    if (action?.type === 'book') {
      const p = action.payload || {};
      const whenStr =
        p.appointment_date && p.appointment_time
          ? `${p.appointment_date} ${p.appointment_time}`
          : 'thời gian gần nhất phù hợp';
      prefaceMsg = { 
        role: 'assistant', 
        content: `Mình sẽ hỗ trợ bạn đặt lịch với chuyên gia #${p.counselor_user_id} vào ${whenStr}. Bộ phận đặt lịch sẽ liên hệ xác nhận ngay khi có slot phù hợp.` 
      };
    }

    // Phân tích cảm xúc và mức độ khẩn cấp
    console.log('[CONTROLLER] Analyzing message:', message);
    const analysis = await aiService.analyzeEmotion(message || '');
    console.log('[CONTROLLER] Analysis result:', JSON.stringify(analysis, null, 2));
    
    // Xử lý trường hợp khẩn cấp
    if (analysis.needsImmediateHelp) {
      const crisisResponse = {
        role: 'assistant',
        content: `🆘 Mình rất lo lắng khi nghe bạn chia sẻ điều này. 

Nếu bạn đang gặp nguy hiểm hoặc có suy nghĩ tự hại, hãy:
• Gọi ngay đường dây nóng: 115 (cấp cứu)
• Liên hệ: 1800.599.199 (tư vấn tâm lý 24/7)
• Đến cơ sở y tế gần nhất

Bạn không đơn độc. Luôn có người sẵn sàng hỗ trợ bạn.`
      };
      
      return res.json({
        messages: [crisisResponse],
        quickReplies: [
          'Tôi cần hỗ trợ khẩn cấp',
          'Cho tôi số hotline',
          'Tìm bệnh viện gần nhất',
          'Tôi muốn nói chuyện với người thật'
        ],
        suggestions: [],
        analysis,
        timestamp: new Date().toISOString()
      });
    }

    // Gọi AI service để chat
    let aiText = '';
    try {
      aiText = message ? await aiService.chatWithAI(message, context) : '';
    } catch (aiError) {
      console.error('AI chat error:', aiError);
      aiText = 'Xin lỗi, hiện chưa thể trả lời. Vui lòng thử lại sau.';
    }

    // Phát hiện ý định muốn gợi ý chuyên gia
    const wantRecommendations = (() => {
      const t = vnNormalize(message || '');
      return /goi\s*y|chuyen\s*gia|dat\s*lich|tu\s*van|counselor|recommend|book|tim\s*nguoi|ho\s*tro|chuyen\s*mon|bac\s*si|therapist/.test(t);
    })();

    // Sử dụng chuyên khoa từ phân tích AI (đã có logic phát hiện trong aiService)
    const detectedSpecialty = analysis.recommendedSpecialty;
    
    console.log('[CONTROLLER] wantRecommendations:', wantRecommendations);
    console.log('[CONTROLLER] detectedSpecialty:', detectedSpecialty);

    // Lấy gợi ý chuyên gia dựa trên phân tích
    let suggestions = [];
    if (wantRecommendations || analysis.recommendedSpecialty) {
      console.log('[CONTROLLER] Triggering counselor suggestions...');
      try {
        const desiredSpecialty = analysis.recommendedSpecialty;

        // Query được tối ưu với điều kiện rõ ràng hơn
        const params = [];
        let specialtyCondition = '';
        
        if (desiredSpecialty) {
          specialtyCondition = ' AND s.name LIKE ?';
          params.push(`%${desiredSpecialty}%`);
        }

        const baseQuery = `
          SELECT 
            u.id AS user_id, 
            u.full_name,
            u.gender,
            s.name AS specialty_name,
            cp.experience_years,
            cp.avatar_url,
            cp.online_price, 
            cp.offline_price,
            COALESCE((SELECT AVG(rating) FROM reviews WHERE counselor_id = u.id), 0) as avg_rating,
            COALESCE((SELECT COUNT(*) FROM reviews WHERE counselor_id = u.id), 0) as review_count
          FROM users u
          INNER JOIN counselor_profiles cp ON u.id = cp.user_id
          LEFT JOIN specialties s ON cp.specialty_id = s.id
          WHERE u.role = 'counselor'
            ${specialtyCondition}
          ORDER BY 
            CASE WHEN s.name = ? THEN 0 ELSE 1 END,
            avg_rating DESC,
            cp.experience_years DESC
          LIMIT 5
        `;

        const rows = await query(baseQuery, [...params, desiredSpecialty || '']);

        suggestions = rows.map((r) => ({
          counselor: {
            user_id: r.user_id,
            full_name: r.full_name,
            gender: r.gender,
            specialty_name: r.specialty_name || 'Tổng quát',
            experience_years: r.experience_years || 0,
            avatar_url: r.avatar_url || null,
            online_price: r.online_price ?? null,
            offline_price: r.offline_price ?? null,
            avg_rating: r.avg_rating ? parseFloat(r.avg_rating).toFixed(1) : null,
            review_count: r.review_count || 0
          },
          match_reason: getMatchReason(r, analysis),
          slots: []
        }));

        console.log(`[CONTROLLER] Found ${suggestions.length} counselors for specialty: ${desiredSpecialty || 'all'}`);

        // Nếu không tìm thấy counselor cho specialty cụ thể, tìm counselor tương tự
        if (suggestions.length === 0 && desiredSpecialty) {
          console.log('[CONTROLLER] No counselors found for specific specialty, finding alternatives...');
          
          // Danh sách specialty tương tự
          const relatedSpecialties = {
            'Tâm lý học giáo dục': ['Tâm lý học phát triển', 'Tâm lý hướng nghiệp', 'Tâm lý trẻ em và vị thành niên'],
            'Tâm lý học phát triển': ['Tâm lý trẻ em và vị thành niên', 'Tâm lý học giáo dục'],
            'Tâm lý hôn nhân gia đình': ['Tâm lý tình yêu – quan hệ'],
            'Tâm lý tình yêu – quan hệ': ['Tâm lý hôn nhân gia đình'],
            'Tâm lý hướng nghiệp': ['Tâm lý học tổ chức', 'Tâm lý học giáo dục'],
            'Tâm lý học tổ chức': ['Tâm lý hướng nghiệp']
          };

          const alternativeSpecialties = relatedSpecialties[desiredSpecialty] || [];
          
          if (alternativeSpecialties.length > 0) {
            const placeholders = alternativeSpecialties.map(() => '?').join(',');
            const altQuery = `
              SELECT 
                u.id AS user_id, 
                u.full_name,
                u.gender,
                s.name AS specialty_name,
                cp.experience_years,
                cp.avatar_url,
                cp.online_price, 
                cp.offline_price,
                COALESCE((SELECT AVG(rating) FROM reviews WHERE counselor_id = u.id), 0) as avg_rating,
                COALESCE((SELECT COUNT(*) FROM reviews WHERE counselor_id = u.id), 0) as review_count
              FROM users u
              INNER JOIN counselor_profiles cp ON u.id = cp.user_id
              LEFT JOIN specialties s ON cp.specialty_id = s.id
              WHERE u.role = 'counselor' 
                AND s.name IN (${placeholders})
              ORDER BY avg_rating DESC, cp.experience_years DESC
              LIMIT 3
            `;
            
            const altRows = await query(altQuery, alternativeSpecialties);

            suggestions = altRows.map((r) => ({
              counselor: {
                user_id: r.user_id,
                full_name: r.full_name,
                gender: r.gender,
                specialty_name: r.specialty_name || 'Tổng quát',
                experience_years: r.experience_years || 0,
                avatar_url: r.avatar_url || null,
                online_price: r.online_price ?? null,
                offline_price: r.offline_price ?? null,
                avg_rating: r.avg_rating ? parseFloat(r.avg_rating).toFixed(1) : null,
                review_count: r.review_count || 0
              },
              match_reason: `Chuyên về ${r.specialty_name} (liên quan đến ${desiredSpecialty})`,
              slots: []
            }));

            console.log(`[CONTROLLER] Found ${suggestions.length} alternative counselors`);
          }
        }
      } catch (e) {
        console.error('[CONTROLLER] Error getting counselor suggestions:', e.message, e.stack);
        // Không throw - vẫn trả về response với suggestions rỗng
      }
    }

    // Tạo quick replies thông minh
    const quickReplies = aiService.generateQuickReplies(message, analysis);

    // Lưu lịch sử chat
    try {
      await ensureAIHistoryTable();
      const saveResult = await query(
        'INSERT INTO ai_chat_history (user_id, message, response, created_at) VALUES (?, ?, ?, NOW())',
        [userId ?? null, message || JSON.stringify(action || {}), aiText]
      );
      console.log('[CONTROLLER] Chat history saved successfully, ID:', saveResult?.insertId);
    } catch (dbError) {
      console.error('[CONTROLLER] Error saving ai chat history:', dbError.message);
      // Không throw error - chat vẫn hoạt động được dù không lưu được history
    }

    const messages = [];
    if (prefaceMsg) messages.push(prefaceMsg);
    if (aiText) messages.push({ role: 'assistant', content: aiText });

    // Thêm thông báo nếu tìm thấy chuyên gia phù hợp
    if (suggestions.length > 0) {
      const isAlternative = suggestions.some(s => s.match_reason && s.match_reason.includes('liên quan'));
      if (isAlternative) {
        messages.push({
          role: 'assistant',
          content: `Hiện tại chưa có chuyên gia chuyên về ${analysis.recommendedSpecialty}, nhưng mình đã tìm thấy ${suggestions.length} chuyên gia có chuyên khoa liên quan có thể hỗ trợ bạn. Bạn có thể xem thông tin và đặt lịch tư vấn ngay bên dưới nhé! 👇`
        });
      } else {
        messages.push({
          role: 'assistant',
          content: `Mình đã tìm thấy ${suggestions.length} chuyên gia phù hợp với tình huống của bạn. Bạn có thể xem thông tin và đặt lịch tư vấn ngay bên dưới nhé! 👇`
        });
      }
    } else if (wantRecommendations || analysis.recommendedSpecialty) {
      // User muốn gợi ý nhưng không có counselor nào
      messages.push({
        role: 'assistant',
        content: `Xin lỗi, hiện tại chưa có chuyên gia phù hợp với yêu cầu của bạn. Hãy thử mở rộng tiêu chí tìm kiếm hoặc liên hệ với chúng tôi để được hỗ trợ tốt hơn.`
      });
    }

    return res.json({
      messages,
      quickReplies,
      suggestions,
      analysis: {
        urgency: analysis.urgency,
        recommendedSpecialty: analysis.recommendedSpecialty
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Lỗi chatWithAI:', error);
    return res.status(500).json({
      messages: [
        {
          role: 'assistant',
          content:
            '😅 Xin lỗi, mình gặp một chút trục trặc kỹ thuật. Hãy thử lại sau vài phút nhé!\n\nHoặc bạn có thể:\n• Làm mới cuộc trò chuyện\n• Liên hệ trực tiếp với chuyên gia\n• Thử lại với câu hỏi đơn giản hơn'
        }
      ],
      quickReplies: [
        'Tôi đang lo âu',
        'Tôi mất ngủ',
        'Vấn đề tình cảm',
        'Tìm chuyên gia ngay'
      ],
      timestamp: new Date().toISOString()
    });
  }
};

// Helper: Phát hiện chuyên khoa từ tin nhắn - BỎ FUNCTION NÀY vì đã có trong aiService.analyzeEmotion()
// Giữ lại để tham khảo nếu cần, nhưng không sử dụng nữa
// function detectSpecialtyFromMessage(message) { ... }

// Helper: Tạo lý do match
function getMatchReason(counselor, analysis) {
  const reasons = [];
  
  if (counselor.specialty_name && analysis.recommendedSpecialty) {
    reasons.push(`Chuyên về ${counselor.specialty_name}`);
  }
  
  if (counselor.experience_years >= 5) {
    reasons.push(`${counselor.experience_years} năm kinh nghiệm`);
  }
  
  if (counselor.avg_rating >= 4.5) {
    reasons.push(`Đánh giá cao (${counselor.avg_rating}⭐)`);
  }
  
  if (analysis.urgency === 'high' && counselor.online_price) {
    reasons.push('Có tư vấn online nhanh');
  }
  
  return reasons.length > 0 ? reasons.join(' • ') : 'Phù hợp với nhu cầu của bạn';
}

/* =========================================
   Lấy lịch sử chat AI
========================================= */

const getAIChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    // Validation
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100); // 1-100
    const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

    await ensureAIHistoryTable();

    const history = await query(
      `SELECT id, message, response, created_at 
       FROM ai_chat_history 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, parsedLimit, parsedOffset]
    );

    // Lấy tổng số record
    const [countResult] = await query(
      'SELECT COUNT(*) as total FROM ai_chat_history WHERE user_id = ?',
      [userId]
    );

    return res.json({
      history,
      pagination: {
        limit: parsedLimit,
        offset: parsedOffset,
        total: countResult?.total || 0
      }
    });
  } catch (error) {
    console.error('[CONTROLLER] Lỗi getAIChatHistory:', error);
    return res.status(500).json({ 
      message: 'Không thể tải lịch sử chat',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/* =========================================
   Xoá lịch sử chat AI
========================================= */

const clearAIChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await ensureAIHistoryTable();
    
    const result = await query('DELETE FROM ai_chat_history WHERE user_id = ?', [userId]);
    
    console.log(`[CONTROLLER] Cleared ${result?.affectedRows || 0} chat history records for user ${userId}`);
    
    return res.json({ 
      message: 'Xóa lịch sử chat thành công',
      deletedCount: result?.affectedRows || 0
    });
  } catch (error) {
    console.error('[CONTROLLER] Lỗi clearAIChatHistory:', error);
    return res.status(500).json({ 
      message: 'Không thể xóa lịch sử chat',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/* =========================================
   Public: Test kết nối AI (không auth)
========================================= */

const testGemini = async (req, res) => {
  try {
    const prompt = 'Xin chào, đây là yêu cầu kiểm tra hệ thống AI. Hãy trả lời ngắn gọn.';
    const startTime = Date.now();
    const response = await aiService.generateContent(prompt);
    const responseTime = Date.now() - startTime;
    
    return res.json({ 
      ok: true, 
      responseTime: `${responseTime}ms`,
      sample: String(response).slice(0, 200),
      model: aiService.model,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[CONTROLLER] AI health check failed:', error);
    return res.status(500).json({ 
      ok: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  suggestCounselors,
  chatWithAI,
  getAIChatHistory,
  clearAIChatHistory,
  testGemini
};
