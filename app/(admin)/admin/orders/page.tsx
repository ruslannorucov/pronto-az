"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// QA_AUDIT Tələbi: ID-ləri #PRN-XXXX formatına salan funksiya
const formatOrderId = (uuid: string) => {
  if (!uuid) return '#PRN-0000';
  return `#PRN-${uuid.substring(0, 4).toUpperCase()}`;
};

export default function OrdersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('job_request')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setOrders(data);
      } catch (error) {
        console.error("Sifarişləri çəkərkən xəta baş verdi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Axtarış və Filtrasiya məntiqi
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      formatOrderId(order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.category && order.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#E4EAFB] border-t-[#1B4FD8] rounded-full animate-spin"></div>
          <p className="text-[#4A5878] font-medium animate-pulse">Sifarişlər yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      
      {/* Səhifə Başlığı və Filtrlər */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0D1F3C]">Bütün Sifarişlər</h1>
          <p className="text-[#4A5878] mt-1 text-sm">Platformadakı bütün sifarişlərin siyahısı və idarəedilməsi</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            placeholder="ID və ya Kateqoriya axtar..." 
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
            <option value="open">Açıq</option>
            <option value="in_progress">Davam edir</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">Ləğv edildi</option>
          </select>
        </div>
      </div>

      {/* Sifarişlər Cədvəli */}
      <div className="bg-white rounded-xl border border-[#E4EAFB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px] whitespace-nowrap">
            <thead className="bg-[#F8FAFF] text-[#4A5878] text-[13px] font-medium border-b border-[#E4EAFB]">
              <tr>
                <th className="px-5 py-4 font-medium">Sifariş ID</th>
                <th className="px-5 py-4 font-medium">Kateqoriya</th>
                <th className="px-5 py-4 font-medium">Tarix</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAFB] text-[#0D1F3C]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#4A5878]">
                    Axtarışa uyğun sifariş tapılmadı.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#F8FAFF] transition-colors">
                    <td className="px-5 py-4 font-bold text-[#0D1F3C]">{formatOrderId(order.id)}</td>
                    <td className="px-5 py-4">
                      {order.category || 'Təyin edilməyib'}
                    </td>
                    <td className="px-5 py-4 text-[#4A5878]">
                      {new Date(order.created_at).toLocaleDateString('az-AZ', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold ${
                        order.status === 'completed' ? 'bg-green-50 text-green-700' :
                        order.status === 'in_progress' ? 'bg-[#EFF4FF] text-[#1B4FD8]' :
                        order.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                        'bg-gray-100 text-[#4A5878]'
                      }`}>
                        {order.status === 'open' ? 'Açıq' : 
                         order.status === 'completed' ? 'Tamamlandı' : 
                         order.status === 'in_progress' ? 'Davam edir' : 
                         order.status === 'cancelled' ? 'Ləğv edildi' : order.status || 'Açıq'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="text-[#1B4FD8] font-medium text-[13px] hover:underline">
                        Detallara bax
                      </button>
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