import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import CounselorCard from '../../components/CounselorCard';
import UserPage from '../../components/UserPage';
import AIAdvisor from '../../components/AIAdvisor';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/RangeSlider.css';

export default function CounselorList() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [minYears, setMinYears] = useState('');
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1400000);
  const [gender, setGender] = useState('');
  const [minRating, setMinRating] = useState('');
  const [loading, setLoading] = useState(true);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [searchParams] = useSearchParams();
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const isGuest = !user;

  const normalize = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const applySuggestedFilters = (filters) => {
    if (!filters) return;
    
    let nextSpecialty = '';
    if (filters.specialtyId) {
      nextSpecialty = String(filters.specialtyId);
    } else if (filters.specialtyName) {
      const target = normalize(filters.specialtyName);
      const m = specialties.find(s => normalize(s.name).includes(target));
      if (m) nextSpecialty = String(m.id);
    } else if (filters.topic) {
      const target = normalize(filters.topic);
      const m = specialties.find(s => normalize(s.name).includes(target));
      if (m) nextSpecialty = String(m.id);
    }

    if (nextSpecialty !== '') setSelectedSpecialty(nextSpecialty);

    if (filters.minYears || filters.experienceYears) {
      const y = parseInt(filters.minYears || filters.experienceYears);
      if (Number.isFinite(y)) setMinYears(String(y));
    }

    if (filters.gender) {
      // Convert from Vietnamese to database format
      if (filters.gender === 'Nam' || filters.gender === 'male') {
        setGender('male');
      } else if (filters.gender === 'Nữ' || filters.gender === 'female') {
        setGender('female');
      } else {
        setGender(filters.gender);
      }
    }

    if (filters.minRating) {
      setMinRating(String(filters.minRating));
    }

    if (filters.maxPrice) {
      const price = parseInt(filters.maxPrice);
      setMaxPrice(price);
    }

    if (filters.minPrice) {
      const price = parseInt(filters.minPrice);
      setMinPrice(price);
    }

    if (filters.search) {
      setSearch(String(filters.search));
    }
  };

  useEffect(() => {
    (async ()=>{
      try {
        setLoading(true);
        const [counselorsRes, specialtiesRes] = await Promise.all([
          api.get('/counselors'),
          api.get('/specialties')
        ]);
        console.log('Sample counselor data:', counselorsRes.data?.[0]);
        setList(counselorsRes.data || []);
        setFilteredList(counselorsRes.data || []);
        setSpecialties(specialtiesRes.data || []);
      } catch (err) {
        console.error('Error fetching counselors:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Apply prefilters passed from FloatingChatWidget (sessionStorage)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('counselor_list_prefilters');
      if (raw) {
        const f = JSON.parse(raw);
        applySuggestedFilters(f);
        sessionStorage.removeItem('counselor_list_prefilters');
      }
    } catch {}
  }, [specialties]);

  useEffect(() => {
    const init = searchParams.get('init');
    if (init && (init === 'ai' || init === 'advisor')) {
      setAdvisorOpen(true);
    }
    const q = searchParams.get('q');
    if (q && typeof q === 'string') {
      setSearch(q);
      setCurrentPage(1);
    }
    
    // Handle specialty filter from URL
    const specialtyParam = searchParams.get('specialty');
    if (specialtyParam) {
      setSelectedSpecialty(specialtyParam);
      setCurrentPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    let result = list;
    
    if (search.trim() !== '') {
      const q = search.trim().toLowerCase();
      result = result.filter(c =>
        String(c.full_name || '').toLowerCase().includes(q) ||
        String(c.specialty_name || c.specialty?.name || '').toLowerCase().includes(q)
      );
    }
    
    if (selectedSpecialty !== '') {
      result = result.filter(counselor => counselor.specialty_id === parseInt(selectedSpecialty));
    }
    
    if (minYears !== '') {
      const years = parseInt(minYears);
      result = result.filter(counselor => {
        const y = counselor.experience_years ?? counselor.experienceYears ?? counselor.years_of_experience;
        const num = typeof y === 'number' ? y : parseInt(y);
        return Number.isFinite(num) && num >= years;
      });
    }
    
    // Filter by price range
    if (minPrice > 0 || maxPrice < 2000000) {
      result = result.filter(counselor => {
        const price = parseFloat(counselor.online_price) || 0;
        return price >= minPrice && price <= maxPrice;
      });
    }
    
    if (gender !== '') {
      console.log('Filtering by gender:', gender);
      result = result.filter(counselor => {
        console.log(`Counselor ${counselor.full_name} gender: "${counselor.gender}" vs filter: "${gender}"`);
        return counselor.gender === gender;
      });
      console.log('Results after gender filter:', result.length);
    }
    
    if (minRating !== '') {
      const rating = parseFloat(minRating);
      console.log('Filtering by rating:', rating);
      result = result.filter(counselor => {
        const avgRating = parseFloat(counselor.average_rating) || 0;
        console.log(`Counselor ${counselor.full_name} rating: ${avgRating} vs filter: ${rating}`);
        return avgRating >= rating;
      });
      console.log('Results after rating filter:', result.length);
    }
    
    setFilteredList(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [selectedSpecialty, minYears, list, search, priceRange, minPrice, maxPrice, gender, minRating]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredList.slice(startIndex, endIndex);

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    const visiblePages = getVisiblePages();

    return (
      <div className="flex items-center justify-center gap-2 mt-8 mb-6">
        {/* Previous button */}
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg border transition-colors ${
            currentPage === 1 
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
        {visiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-gray-400">...</span>
            ) : (
              <button
                onClick={() => setCurrentPage(page)}
                className={`min-w-[40px] h-10 rounded-lg border font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-cyan-400 text-white border-cyan-400'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        {/* Next button */}
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg border transition-colors ${
            currentPage === totalPages 
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <UserPage>
      {/* Simple Header */}
      <div className="bg-cyan-50 rounded-xl p-4 mb-6 border border-cyan-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-400 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 01 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 01 9.288 0M15 7a3 3 0 11-6 0 3 3 0 01 6 0m6 3a2 2 0 11-4 0 2 2 0 01 4 0M7 10a2 2 0 11-4 0 2 2 0 01 4 0" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Danh sách chuyên gia</h1>
              <p className="text-sm text-cyan-400">Tìm thấy {filteredList.length} chuyên gia phù hợp</p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-orange-100 rounded-full px-3 py-1 flex items-center gap-1 mb-1">
              <span className="text-lg font-bold text-orange-600">{filteredList.length}</span>
              <span className="text-sm text-orange-600">chuyên gia</span>
            </div>
            {totalPages > 1 && (
              <div className="text-xs text-gray-500">
                Trang {currentPage} / {totalPages}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Compact Sidebar Filters */}
        <div className="w-80 shrink-0">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Bộ lọc</h3>
              <button 
                onClick={() => {
                  setSelectedSpecialty('');
                  setMinYears('');
                  setSearch('');
                  setPriceRange('');
                  setMinPrice(0);
                  setMaxPrice(1400000);
                  setGender('');
                  setMinRating('');
                }}
                className="text-xs text-gray-500 hover:text-cyan-400 transition-colors"
              >
                Xóa tất cả
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Compact Search */}
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm chuyên gia..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-sm"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              {/* Compact Filters Grid */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chuyên ngành</label>
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-sm"
                  >
                    <option value="">Tất cả</option>
                    {specialties.map(specialty => (
                      <option key={specialty.id} value={specialty.id}>
                        {specialty.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kinh nghiệm</label>
                  <select
                    value={minYears}
                    onChange={(e) => setMinYears(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-sm"
                  >
                    <option value="">Tất cả</option>
                    <option value="1">1+ năm</option>
                    <option value="3">3+ năm</option>
                    <option value="5">5+ năm</option>
                    <option value="7">7+ năm</option>
                    <option value="10">10+ năm</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                  >
                    <option value="">Tất cả</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đánh giá</label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                  >
                    <option value="">Tất cả</option>
                    <option value="4.5">4.5+ sao</option>
                    <option value="4.0">4.0+ sao</option>
                    <option value="3.5">3.5+ sao</option>
                    <option value="3.0">3.0+ sao</option>
                  </select>
                </div>
              </div>
              
              {/* Compact Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Khoảng giá</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <input
                      type="range"
                      min="0"
                      max="2000000"
                      step="50000"
                      value={minPrice}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value <= maxPrice) {
                          setMinPrice(value);
                        }
                      }}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-blue"
                    />
                    <div className="text-xs text-gray-600 mt-1">
                      Từ ₫{minPrice.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <input
                      type="range"
                      min="0"
                      max="2000000"
                      step="50000"
                      value={maxPrice}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value >= minPrice) {
                          setMaxPrice(value);
                        }
                      }}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-blue"
                    />
                    <div className="text-xs text-gray-600 mt-1">
                      Đến ₫{maxPrice.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Reset Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedSpecialty('');
                    setMinYears('');
                    setPriceRange('');
                    setMinPrice(0);
                    setMaxPrice(1400000);
                    setGender('');
                    setMinRating('');
                  }}
                  className="w-full px-4 py-2 bg-cyan-400 text-white rounded-lg hover:bg-cyan-500 transition-colors text-sm font-medium"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-8 shadow-lg">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 mx-auto" />
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mt-6" />
                  <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mt-3 w-2/3 mx-auto" />
                  <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl mt-6" />
                </div>
              ))}
            </div>
          ) : filteredList.length === 0 ? (
            <div className="bg-gradient-to-br from-white to-gray-50 p-12 rounded-2xl shadow-xl border border-gray-200 text-center">
              <div className="max-w-md mx-auto">
                <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.1-5.291-2.709M20 7l-8-4-8 4m16 0v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7m16 0L12 11 4 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Không tìm thấy chuyên gia</h3>
                <p className="text-gray-600 mb-6">Không có chuyên gia nào phù hợp với tiêu chí tìm kiếm của bạn. Hãy thử điều chỉnh bộ lọc hoặc mở rộng phạm vi tìm kiếm.</p>
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedSpecialty('');
                    setMinYears('');
                    setPriceRange('');
                    setMinPrice(0);
                    setMaxPrice(1400000);
                    setGender('');
                    setMinRating('');
                  }}
                  className="px-6 py-3 bg-cyan-400 text-white rounded-xl font-semibold hover:bg-cyan-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {currentItems.map(c => <CounselorCard key={c.id || c._id} counselor={c} isGuest={isGuest} />)}
              </div>

              {/* Pagination */}
              <Pagination />
            </div>
          )}
        </div>
      </div>

      {/* AI Advisor Promotion - At Bottom */}
      <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 p-4 rounded-xl border border-cyan-200 mt-8 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.641-.329-1.224-.876-1.563l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-cyan-800">Cần gợi ý chuyên gia phù hợp?</h3>
              <p className="text-sm text-cyan-600">Sử dụng Trợ lý AI để được tư vấn</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAdvisorOpen(true)}
            className="px-4 py-2 bg-cyan-400 text-white rounded-lg text-sm font-medium hover:bg-cyan-500 transition-all duration-200"
          >
            Tư vấn với AI
          </button>
        </div>
      </div>

      <AIAdvisor open={advisorOpen} onClose={() => setAdvisorOpen(false)} onSuggestFilters={applySuggestedFilters} />
    </UserPage>
  );
}
