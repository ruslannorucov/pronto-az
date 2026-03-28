"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function WorkersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [workers, setWorkers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('worker_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setWorkers(data);
      } catch (error) {
        console.error("Ustaları çəkərkən xəta baş verdi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  // Axtarış və Filtrasiya məntiqi
  const filteredWorkers = workers.filter((worker) => {
    const fullName = `${worker.first_name || ''} ${worker.last_name || ''}`.toLowerCase();
    const category = (worker.category || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = fullName.includes(searchLower) || category.includes(searchLower);
    const matchesStatus = statusFilter === "all" || worker.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#E4EAFB] border-t-[#1B4FD8] rounded-full animate-spin"></div>
          <p className="text-[#4A5878] font-medium animate-pulse">Ustalar yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      
      {/* Səhifə Başlığı və Filtrlər */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0D1F3C]">Ustalar</h1>
          <p className="text-[#4A5878] mt-1 text-sm">Platformada qeydiyyatdan keçmiş bütün ustaların siyahısı</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            placeholder="Ad və ya Kateqoriya axtar..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-[#E4EAFB] rounded-lg text-sm focus:outline-none focus:border-[#1B4FD8] focus:ring-1 focus:ring-[#1B4FD8] w-full sm:w-64"
          />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-[#E4EAFB] rounded-lg text-sm focus:outline-none focus:border-[#1B4FD8] bg-white cursor-pointer"
          >
            <option value="all">Bütün statuslar</option>
            <option value="active">Aktiv</option>
            <option value="pending">Gözləyir (Təsdiq)</option>
            <option value="suspended">Dondurulub</option>
            <option value="rejected">Rədd edilib</option>
          </select>
        </div>
      </div>

      {/* Ustalar Cədvəli */}
      <div className="bg-white rounded-xl border border-[#E4EAFB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px] whitespace-nowrap">
            <thead className="bg-[#F8FAFF] text-[#4A5878] text-[13px] font-medium border-b border-[#E4EAFB]">
              <tr>
                <th className="px-5 py-4 font-medium">Usta</th>
                <th className="px-5 py-4 font-medium">Kateqoriya & Təcrübə</th>
                <th className="px-5 py-4 font-medium">Qeydiyyat Tarixi</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAFB] text-[#0D1F3C]">
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#4A5878]">
                    Axtarışa uyğun usta tapılmadı.
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-[#F8FAFF] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#BFCFFE] flex items-center justify-center text-[#1B4FD8] font-bold shrink-0">
                          {worker.first_name?.charAt(0) || 'U'}{worker.last_name?.charAt(0) || ''}
                        </div>
                        <div>
                          <div className="font-bold text-[#0D1F3C]">{worker.first_name} {worker.last_name}</div>
                          <div className="text-[12px] text-[#94A3C0]">{worker.phone || 'Nömrə yoxdur'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium">{worker.category || 'Təyin edilməyib'}</div>
                      <div className="text-[12px] text-[#4A5878]">{worker.experience_years || 0} il təcrübə</div>
                    </td>
                    <td className="px-5 py-4 text-[#4A5878]">
                      {new Date(worker.created_at).toLocaleDateString('az-AZ', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold ${
                        worker.status === 'active' ? 'bg-green-50 text-green-700' :
                        worker.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                        worker.status === 'rejected' ? 'bg-red-50 text-red-600' :
                        'bg-gray-100 text-[#4A5878]'
                      }`}>
                        {worker.status === 'active' ? 'Aktiv' : 
                         worker.status === 'pending' ? 'Gözləyir' : 
                         worker.status === 'suspended' ? 'Dondurulub' : 
                         worker.status === 'rejected' ? 'Rədd edilib' : worker.status || 'Naməlum'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {worker.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                           <button className="text-white bg-[#1B4FD8] hover:bg-[#2563EB] px-3 py-1.5 rounded-md text-[12px] font-bold transition-colors">
                             Təsdiqlə
                           </button>
                           <button className="text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-md text-[12px] font-bold transition-colors">
                             Rədd et
                           </button>
                        </div>
                      ) : (
                        <button className="text-[#1B4FD8] font-medium text-[13px] hover:underline">
                          Detallara bax
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}