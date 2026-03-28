"use client";

import { useState, useEffect } from 'react';
// Supabase müştəri bağlantısını çağırırıq (Yol layihənizə görə fərqlənə bilər, adətən '@/lib/supabase/client' olur)
import { createClient } from '@/lib/supabase/client';

// QA_AUDIT Tələbi: ID-ləri #PRN-XXXX formatına salan funksiya
const formatOrderId = (uuid: string) => {
  if (!uuid) return '#PRN-0000';
  return `#PRN-${uuid.substring(0, 4).toUpperCase()}`;
};

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalOrders: 0, activeWorkers: 0, pending: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [pendingWorkers, setPendingWorkers] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const supabase = createClient();

        // 1. Ümumi Sifarişlərin sayı (job_request cədvəlindən)
        const { count: totalOrders } = await supabase
          .from('job_request')
          .select('*', { count: 'exact', head: true });

        // 2. Aktiv Ustaların sayı (worker_profiles cədvəlindən)
        const { count: activeWorkers } = await supabase
          .from('worker_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'); 

        // 3. Gözləyən Ustalar siyahısı (status = 'pending')
        const { data: pendingData, count: pendingCount } = await supabase
          .from('worker_profiles')
          .select('*', { count: 'exact' })
          .eq('status', 'pending')
          .limit(3);

        // 4. Son Sifarişlər
        const { data: recentOrders } = await supabase
          .from('job_request')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        // State-ləri yeniləyirik
        setStats({
          totalOrders: totalOrders || 0,
          activeWorkers: activeWorkers || 0,
          pending: pendingCount || 0
        });
        
        if (pendingData) setPendingWorkers(pendingData);
        if (recentOrders) setOrders(recentOrders);

      } catch (error) {
        console.error("Məlumatları çəkərkən xəta baş verdi:", error);
      } finally {
        setIsLoading(false); // Nəticə nə olursa olsun, yüklənməni dayandır
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#E4EAFB] border-t-[#1B4FD8] rounded-full animate-spin"></div>
          <p className="text-[#4A5878] font-medium animate-pulse">Məlumatlar bazadan çəkilir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      
      {/* 1. Səhifə Başlığı */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0D1F3C]">İdarə Paneli</h1>
        <p className="text-[#4A5878] mt-1 text-sm">Platformanın ümumi statistikası və son fəaliyyətlər</p>
      </div>

      {/* 2. Statistika Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-xl border border-[#E4EAFB] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#94A3C0] text-[11px] font-bold uppercase tracking-wider">Ümumi Sifarişlər</p>
              <h3 className="text-2xl font-bold text-[#0D1F3C] mt-1">{stats.totalOrders}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#EFF4FF] flex items-center justify-center text-[#1B4FD8]">📋</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E4EAFB] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#94A3C0] text-[11px] font-bold uppercase tracking-wider">Aktiv Ustalar</p>
              <h3 className="text-2xl font-bold text-[#0D1F3C] mt-1">{stats.activeWorkers}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#EFF4FF] flex items-center justify-center text-[#1B4FD8]">👷</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E4EAFB] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#94A3C0] text-[11px] font-bold uppercase tracking-wider">Gözləyən Təsdiqlər</p>
              <h3 className="text-2xl font-bold text-[#0D1F3C] mt-1">{stats.pending}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">⏳</div>
          </div>
        </div>
      </div>

      {/* 3. Gözləyən usta müraciətləri */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-[#0D1F3C]">Gözləyən usta müraciətləri</h2>
        </div>
        
        {pendingWorkers.length === 0 ? (
           <p className="text-[#4A5878] text-sm bg-white p-4 rounded-xl border border-[#E4EAFB]">Gözləyən usta müraciəti yoxdur.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {pendingWorkers.map((worker) => (
              <div key={worker.id} className="bg-white p-5 rounded-xl border border-[#E4EAFB] shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#BFCFFE] flex items-center justify-center text-[#1B4FD8] font-bold shrink-0">
                    {worker.first_name?.charAt(0) || 'U'}{worker.last_name?.charAt(0) || ''}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0D1F3C] text-[15px]">{worker.first_name} {worker.last_name}</h4>
                    <p className="text-[#4A5878] text-[13px]">{worker.category || 'Təyin edilməyib'} · {worker.experience_years || 0} il təcrübə</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button className="flex-1 bg-[#1B4FD8] text-white py-2 rounded-lg text-[13px] font-bold hover:bg-[#2563EB] transition-colors">✓ Təsdiqlə</button>
                  <button className="flex-1 bg-white border border-red-200 text-red-600 py-2 rounded-lg text-[13px] font-bold hover:bg-red-50 transition-colors">✗ Rədd et</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Son Sifarişlər Cədvəli */}
      <div className="bg-white rounded-xl border border-[#E4EAFB] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E4EAFB] flex justify-between items-center">
          <h2 className="text-lg font-bold text-[#0D1F3C]">Son Sifarişlər</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px] whitespace-nowrap">
            <thead className="bg-[#F8FAFF] text-[#4A5878] text-[13px] font-medium border-b border-[#E4EAFB]">
              <tr>
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Kateqoriya</th>
                <th className="px-5 py-3 font-medium">Tarix</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAFB] text-[#0D1F3C]">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-4 text-center text-[#4A5878]">Sifariş tapılmadı</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#F8FAFF] transition-colors">
                    <td className="px-5 py-4 font-bold">{formatOrderId(order.id)}</td>
                    <td className="px-5 py-4">{order.category || 'Təyin edilməyib'}</td>
                    <td className="px-5 py-4 text-[#4A5878]">
                      {new Date(order.created_at).toLocaleDateString('az-AZ')}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold bg-[#EFF4FF] text-[#1B4FD8]">
                        {order.status || 'Açıq'}
                      </span>
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