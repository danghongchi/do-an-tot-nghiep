const config = require('../config');

// AI Service (OpenRouter only)
class AIService {
  constructor() {
    this.apiKey = config.openrouterApiKey; // require OpenRouter
    this.model = (config.openrouterModel || 'openai/gpt-3.5-turbo').toString();
    if (typeof this.model === 'string') {
      // Sanitize accidental env assignment like "OPENROUTER_MODEL=deepseek/deepseek-chat"
      this.model = this.model.split('=')[this.model.split('=').length - 1].trim();
    }
    this.baseUrl = (config.openrouterBaseUrl || 'https://openrouter.ai/api/v1').toString();
    
    // Từ điển chuyên khoa (khớp với database) - ƯU TIÊN TỪ KHÓA CỤ THỂ
    this.specialtyKeywords = {
      // Ưu tiên từ khóa có nhiều từ trước (để phát hiện chính xác hơn)
      'Tâm lý hướng nghiệp': ['hướng nghiệp', 'huong nghiep', 'nghề nghiệp', 'nghe nghiep', 'career', 'công việc', 'cong viec', 'work', 'định hướng', 'dinh huong', 'sự nghiệp', 'su nghiep', 'thất nghiệp', 'that nghiep', 'chuyển việc', 'chuyen viec', 'áp lực công việc', 'ap luc cong viec', 'môi trường làm việc', 'moi truong lam viec', 'nghề', 'nghe', 'job'],
      'Tâm lý học tổ chức': ['tổ chức', 'to chuc', 'organization', 'doanh nghiệp', 'doanh nghiep', 'quản lý', 'quan ly', 'lãnh đạo', 'lanh dao', 'nhóm', 'nhom', 'team', 'công ty', 'cong ty', 'văn hóa doanh nghiệp', 'van hoa doanh nghiep'],
      'Tâm lý hôn nhân gia đình': ['hôn nhân', 'hon nhan', 'gia đình', 'gia dinh', 'vợ chồng', 'vo chong', 'ly hôn', 'ly hon', 'chia tay', 'mâu thuẫn gia đình', 'mau thuan gia dinh', 'xung đột gia đình', 'xung dot gia dinh', 'family', 'marriage', 'bố mẹ', 'bo me', 'con cái', 'con cai', 'anh chị em', 'ông bà', 'quan hệ gia đình', 'quan he gia dinh'],
      'Tâm lý tình yêu – quan hệ': ['tình yêu', 'tinh yeu', 'love', 'người yêu', 'nguoi yeu', 'crush', 'hẹn hò', 'hen ho', 'dating', 'chia tay', 'tình cảm', 'tinh cam', 'yêu đương', 'yeu duong', 'mối quan hệ tình cảm', 'moi quan he tinh cam', 'tình bạn', 'tinh ban', 'bạn bè', 'ban be'],
      'Tâm lý trẻ em và vị thành niên': ['trẻ em', 'tre em', 'vị thành niên', 'vi thanh nien', 'thiếu niên', 'thieu nien', 'children', 'teenager', 'teen', 'con cái', 'con cai', 'tuổi dậy thì', 'tuoi day thi', 'học sinh', 'hoc sinh', 'thanh thiếu niên', 'thanh thieu nien'],
      'Tâm lý học phát triển': ['phát triển', 'phat trien', 'development', 'lớn lên', 'lon len', 'trưởng thành', 'truong thanh', 'giai đoạn phát triển', 'giai doan phat trien', 'tuổi dậy thì', 'tuoi day thi'],
      'Tâm lý học giáo dục': ['giáo dục', 'giao duc', 'học đường', 'hoc duong', 'học tập', 'hoc tap', 'education', 'trường học', 'truong hoc', 'sinh viên', 'sinh vien', 'học sinh', 'hoc sinh', 'thi cử', 'thi cu', 'học bài', 'hoc bai', 'kết quả học', 'ket qua hoc'],
      'Tâm lý học lâm sàng': ['lâm sàng', 'lam sang', 'trị liệu', 'tri lieu', 'therapy', 'điều trị', 'dieu tri', 'clinical', 'bệnh lý', 'benh ly', 'chẩn đoán', 'chan doan', 'phương pháp điều trị', 'phuong phap dieu tri'],
      'Tâm lý phục hồi xã hội': ['phục hồi', 'phuc hoi', 'tái hòa nhập', 'tai hoa nhap', 'xã hội', 'xa hoi', 'rehabilitation', 'cộng đồng', 'cong dong', 'hòa nhập', 'hoa nhap', 'tái phát triển', 'tai phat trien'],
      // Tâm lý sức khỏe - LOẠI BỎ "tâm lý", "tinh thần", "tâm trí" vì quá chung chung
      'Tâm lý sức khỏe': ['sức khỏe tinh thần', 'suc khoe tinh than', 'mental health', 'lo âu', 'lo au', 'anxiety', 'stress', 'căng thẳng', 'cang thang', 'trầm cảm', 'tram cam', 'depression', 'buồn', 'buon', 'mất ngủ', 'mat ngu', 'insomnia', 'sợ hãi', 'so hai', 'hoảng loạn', 'hoang loan', 'panic', 'ám ảnh', 'am anh']
    };
    
    // Từ khóa khẩn cấp
    this.crisisKeywords = [
      'tự sát', 'tự tử', 'tự hại', 'suicide', 'kill myself', 'muốn chết', 
      'kết thúc cuộc đời', 'không muốn sống', 'bạo lực', 'tự làm tổn thương'
    ];
  }

  async generateContent(prompt) {
    try {
      if (!this.apiKey) {
        throw new Error('Thiếu OPENROUTER_API_KEY. Vui lòng cấu hình khóa OpenRouter.');
      }

      if (!prompt || typeof prompt !== 'string') {
        throw new Error('Prompt must be a non-empty string');
      }

      const model = this.model || 'openai/gpt-3.5-turbo';
      const url = `${this.baseUrl}/chat/completions`;
      
      console.log(`[AI SERVICE] Calling OpenRouter API with model: ${model}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'http://localhost',
          'X-Title': 'Counseling App',
        },
        body: JSON.stringify({
          model,
          messages: [
            { 
              role: 'system', 
              content: 'Bạn là một AI advisor về tư vấn tâm lý. Trả lời ngắn gọn, đồng cảm, hữu ích và an toàn bằng tiếng Việt.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errText}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      
      if (!text) {
        throw new Error('Empty response from OpenRouter API');
      }
      
      console.log(`[AI SERVICE] API call successful, response length: ${text.length}`);
      return text;
    } catch (error) {
      console.error('[AI SERVICE] generateContent error:', error.message);
      throw error;
    }
  }

  async suggestCounselors(topic, appointmentMode, timePreference, preferredGender) {
    const prompt = `
      Dựa trên thông tin sau, hãy đề xuất 3 counselor phù hợp:
      - Chủ đề tư vấn: ${topic || 'Không xác định'}
      - Hình thức: ${appointmentMode || 'Không xác định'}
      - Thời gian ưa thích: ${timePreference || 'Không xác định'}
      - Giới tính ưa thích: ${preferredGender || 'Không xác định'}

      Trả về dạng JSON (không thêm lời giải thích), format:
      {
        "suggestions": [
          { "counselor_id": 1, "reason": "lý do", "match_score": 85 }
        ]
      }
    `;

    try {
      const response = await this.generateContent(prompt);
      // Robust JSON extraction (supports code fences or extra text)
      let text = String(response || '');
      const fenced = text.match(/```[\s\S]*?```/);
      if (fenced) text = fenced[0].replace(/```(json)?/gi, '').replace(/```/g, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch(_) {
        const s = text.indexOf('{');
        const e = text.lastIndexOf('}');
        if (s !== -1 && e !== -1 && e > s) parsed = JSON.parse(text.slice(s, e+1));
      }
      return (parsed && Array.isArray(parsed.suggestions)) ? parsed : { suggestions: [] };
    } catch (error) {
      console.error('suggestCounselors error:', error);
      return { suggestions: [] };
    }
  }

  async chatWithAI(message, context = '') {
    if (!message || typeof message !== 'string') {
      throw new Error('Message must be a non-empty string');
    }

    const prompt = `
Bạn là một AI advisor chuyên về tư vấn tâm lý, nhiệm vụ của bạn là:
1. Lắng nghe và thấu hiểu cảm xúc người dùng
2. Đưa ra lời khuyên an toàn, đồng cảm và hữu ích
3. Gợi ý họ nên tìm chuyên gia nào phù hợp (các chuyên khoa: Tâm lý sức khỏe, Tâm lý học lâm sàng, Tâm lý hôn nhân gia đình, Tâm lý tình yêu – quan hệ, Tâm lý hướng nghiệp, Tâm lý học tổ chức, Tâm lý học giáo dục, Tâm lý trẻ em và vị thành niên, Tâm lý học phát triển, Tâm lý phục hồi xã hội)
4. Trả lời bằng tiếng Việt, ngắn gọn (2-4 câu), tối đa 150 từ

${context ? `Context cuộc trò chuyện trước: ${context}` : ''}

Tin nhắn người dùng: ${message}

Hãy trả lời một cách ấm áp, đồng cảm. Nếu họ đề cập vấn đề cụ thể, hãy gợi ý họ tìm chuyên gia phù hợp.
    `;

    try {
      const response = await this.generateContent(prompt);
      if (!response || typeof response !== 'string') {
        throw new Error('Invalid AI response format');
      }
      return response;
    } catch (error) {
      console.error('[AI SERVICE] Chat error:', error);
      throw new Error(`Không thể kết nối với AI: ${error.message}`);
    }
  }

  // Phân tích cảm xúc và mức độ khẩn cấp
  async analyzeEmotion(message) {
    if (!message || typeof message !== 'string') {
      console.warn('[AI SERVICE] analyzeEmotion: Empty or invalid message');
      return {
        urgency: 'low',
        emotions: [],
        recommendedSpecialty: null,
        needsImmediateHelp: false
      };
    }

    const normalizedMsg = this.normalizeVietnamese(message.toLowerCase());
    
    console.log('[AI SERVICE] Analyzing message:', message);
    console.log('[AI SERVICE] Normalized:', normalizedMsg);
    
    // Kiểm tra khẩn cấp
    const isCrisis = this.crisisKeywords.some(keyword => 
      normalizedMsg.includes(this.normalizeVietnamese(keyword.toLowerCase()))
    );
    
    if (isCrisis) {
      console.log('[AI SERVICE] ⚠️ CRISIS DETECTED');
      return {
        urgency: 'critical',
        emotions: ['distress', 'crisis'],
        recommendedSpecialty: null,
        needsImmediateHelp: true
      };
    }
    
    // Phát hiện chuyên khoa phù hợp (cải thiện - ưu tiên khớp chính xác)
    let recommendedSpecialty = null;
    let emotions = [];
    let maxScore = 0; // Đổi từ maxMatches sang maxScore để tính điểm chính xác hơn
    
    for (const [specialty, keywords] of Object.entries(this.specialtyKeywords)) {
      let score = 0;
      const matchedKeywords = [];
      
      for (const keyword of keywords) {
        const normalizedKeyword = this.normalizeVietnamese(keyword.toLowerCase());
        if (normalizedMsg.includes(normalizedKeyword)) {
          // Tính điểm dựa trên độ dài từ khóa (từ khóa dài hơn = chính xác hơn)
          const keywordLength = normalizedKeyword.split(' ').length;
          const weight = keywordLength * 10; // Từ 2 chữ = 20 điểm, từ 3 chữ = 30 điểm
          score += weight;
          matchedKeywords.push(keyword);
        }
      }
      
      if (score > 0) {
        console.log(`[AI SERVICE] ${specialty}: ${score} points - [${matchedKeywords.join(', ')}]`);
      }
      
      // Chọn chuyên khoa có điểm số cao nhất (ưu tiên khớp chính xác)
      if (score > maxScore) {
        maxScore = score;
        recommendedSpecialty = specialty;
        emotions = matchedKeywords;
      }
    }
    
    console.log('[AI SERVICE] Recommended specialty:', recommendedSpecialty || 'none');
    console.log('[AI SERVICE] Max score:', maxScore);
    
    // Đánh giá mức độ khẩn cấp
    const urgencyKeywords = {
      high: ['cap bach', 'ngay lap tuc', 'khan cap', 'nghiem trong', 'khong chiu noi', 'rat kho khan'],
      medium: ['kho khan', 'vat va', 'met moi', 'ap luc', 'can giup do'],
      low: ['thac mac', 'tim hieu', 'muon biet', 'goi y', 'tu van']
    };
    
    let urgency = 'low';
    for (const [level, keywords] of Object.entries(urgencyKeywords)) {
      if (keywords.some(kw => normalizedMsg.includes(this.normalizeVietnamese(kw)))) {
        urgency = level;
        break;
      }
    }
    
    return {
      urgency,
      emotions,
      recommendedSpecialty,
      needsImmediateHelp: false
    };
  }

  // Chuẩn hóa tiếng Việt (bỏ dấu)
  normalizeVietnamese(str) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  // Tạo quick replies thông minh dựa trên context
  generateQuickReplies(message, analysis) {
    const replies = [];
    
    if (analysis.needsImmediateHelp) {
      return ['Tôi cần hỗ trợ khẩn cấp', 'Cho tôi số điện thoại hỗ trợ', 'Tìm chuyên gia gần nhất'];
    }
    
    if (!analysis.recommendedSpecialty) {
      return [
        'Tôi đang lo âu',
        'Tôi mất ngủ', 
        'Vấn đề trong mối quan hệ',
        'Gợi ý chuyên gia phù hợp'
      ];
    }
    
    // Quick replies dựa trên chuyên khoa được phát hiện (khớp với database)
    switch (analysis.recommendedSpecialty) {
      case 'Tâm lý sức khỏe':
        return [
          'Làm sao để giảm lo âu?',
          'Cách cải thiện giấc ngủ',
          'Tìm chuyên gia tâm lý',
          'Đặt lịch tư vấn ngay'
        ];
      case 'Tâm lý học lâm sàng':
        return [
          'Tôi cần được điều trị',
          'Các phương pháp trị liệu',
          'Tìm chuyên gia lâm sàng',
          'Đặt lịch tư vấn ngay'
        ];
      case 'Tâm lý hôn nhân gia đình':
      case 'Tâm lý tình yêu – quan hệ':
        return [
          'Cách cải thiện mối quan hệ?',
          'Giải quyết xung đột',
          'Tìm chuyên gia gia đình',
          'Đặt lịch tư vấn ngay'
        ];
      case 'Tâm lý hướng nghiệp':
      case 'Tâm lý học tổ chức':
        return [
          'Quản lý stress công việc?',
          'Định hướng nghề nghiệp',
          'Tìm chuyên gia công việc',
          'Đặt lịch tư vấn ngay'
        ];
      case 'Tâm lý học giáo dục':
        return [
          'Vấn đề học tập',
          'Cải thiện kết quả học',
          'Tìm chuyên gia giáo dục',
          'Đặt lịch tư vấn ngay'
        ];
      case 'Tâm lý trẻ em và vị thành niên':
      case 'Tâm lý học phát triển':
        return [
          'Hỗ trợ phát triển con',
          'Vấn đề hành vi trẻ',
          'Tìm chuyên gia trẻ em',
          'Đặt lịch tư vấn ngay'
        ];
      case 'Tâm lý phục hồi xã hội':
        return [
          'Hỗ trợ tái hòa nhập',
          'Phục hồi tâm lý',
          'Tìm chuyên gia phục hồi',
          'Đặt lịch tư vấn ngay'
        ];
      default:
        return [
          'Cho tôi biết thêm',
          'Tôi muốn được tư vấn',
          'Gợi ý chuyên gia phù hợp',
          'Đặt lịch ngay'
        ];
    }
  }
}

module.exports = new AIService();
