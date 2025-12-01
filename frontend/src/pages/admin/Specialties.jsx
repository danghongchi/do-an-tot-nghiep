import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import AdminPage from './AdminPage';
import { useToast } from '../../components/Toast';
import Pagination from '../../components/Pagination';

const ITEMS_PER_PAGE = 8;

export default function AdminSpecialties(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [form, setForm] = useState({ id: null, name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  const resetForm = () => setForm({ id: null, name: '', description: '' });

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.get('/admin/specialties');
      setItems(res.data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); }, []);

  const submit = async (e) => {
    e?.preventDefault();
    if (!form.name.trim()) { show('Vui lòng nhập tên chuyên ngành', { title: 'Thiếu thông tin', type: 'error' }); return; }
    try {
      setSaving(true);
      if (form.id) {
        await api.put(`/admin/specialties/${form.id}`, { name: form.name.trim(), description: form.description });
      } else {
        await api.post('/admin/specialties', { name: form.name.trim(), description: form.description });
      }
      await load();
      resetForm();
      show(form.id ? 'Cập nhật chuyên ngành thành công' : 'Thêm chuyên ngành thành công', { title: 'Thành công', type: 'success' });
    } catch (e) {
      show(e.response?.data?.message || e.message, { title: 'Thất bại', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (sp) => setForm({ id: sp.id, name: sp.name || '', description: sp.description || '' });
  const onDelete = async (sp) => {
    if (!confirm(`Xóa chuyên ngành "${sp.name}"?`)) return;
    try {
      await api.delete(`/admin/specialties/${sp.id}`);
      await load();
      show('Đã xóa chuyên ngành', { title: 'Đã xóa', type: 'success' });
    } catch (e) {
      show(e.response?.data?.message || e.message, { title: 'Thất bại', type: 'error' });
    }
  };

  // Pagination
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = items.slice(startIndex, endIndex);

  return (
    <AdminPage 
      title="Quản lý chuyên ngành" 
      subtitle="Quản lý các lĩnh vực chuyên môn trong hệ thống"
      actions={form.id ? (
        <button 
          type="button" 
          onClick={resetForm} 
          className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
        >
          Hủy chỉnh sửa
        </button>
      ) : null}
    >

      {/* Form */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900">
            {form.id ? 'Chỉnh sửa chuyên ngành' : 'Thêm chuyên ngành mới'}
          </h3>
        </div>
        
        <form onSubmit={submit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Tên chuyên ngành
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                value={form.name}
                onChange={(e)=>setForm(f=>({ ...f, name: e.target.value }))}
                placeholder="Ví dụ: Học đường, Hôn nhân - Gia đình"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Mô tả
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                value={form.description}
                onChange={(e)=>setForm(f=>({ ...f, description: e.target.value }))}
                placeholder="Mô tả ngắn về chuyên ngành"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3">
            <button 
              disabled={saving} 
              className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {form.id ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Danh sách chuyên ngành ({items.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3"></div>
            <div className="text-gray-600 text-sm">Đang tải chuyên ngành...</div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-red-600 text-base font-medium">{error}</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {currentItems.map((sp, index) => (
              <div key={sp.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-base">
                      {startIndex + index + 1}
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">{sp.name}</h4>
                      {sp.description && (
                        <p className="text-xs text-gray-600 mt-0.5">{sp.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-gray-500">ID: {sp.id}</span>
                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                        <span className="text-xs text-gray-500">Chuyên ngành</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={()=>onEdit(sp)} 
                      className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all duration-200"
                    >
                      <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Sửa
                    </button>
                    <button 
                      onClick={()=>onDelete(sp)} 
                      className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-all duration-200"
                    >
                      <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {currentItems.length === 0 && (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="text-gray-500 text-base font-medium">Chưa có chuyên ngành nào</div>
                <div className="text-gray-400 text-xs mt-1">Hãy thêm chuyên ngành đầu tiên ở form phía trên</div>
              </div>
            )}
          </div>
        )}
        
        {/* Pagination */}
        {!loading && !error && items.length > ITEMS_PER_PAGE && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <Pagination
              current={currentPage}
              totalPages={totalPages}
              onChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </AdminPage>
  );
}


