"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// QA_AUDIT Tələbi: ID-ləri #PRN-XXXX formatına salan funksiya (Sifarişlər üçün)
const formatOrderId = (uuid: string) => {
  if (!uuid) return '-';
  return `#PRN-${uuid.substring(0, 4).toUpperCase()}`;
};

// Tranzaksiya ID-lərini qısaltmaq üçün funksiya (məs: TXN-8A2F)
const formatTxnId = (uuid: string) => {
  if (!uuid) return '#TXN-0000';
  return `#TXN-${uuid.substring(0, 4).toUpperCase()}`;
};

export default function PaymentsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const supabase = createClient();
        // Bazanızdakı ödənişlər cədvəlinin adının 'payments' olduğunu fərz edirik
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          // Əgər cədvəl yoxdursa və ya xəta varsa, konsolda görək, amma proqram çökməsin
          console.error("Supabase xətası (Ödənişlər):", error.message);
        }
        
        if (data) setPayments(data);
      } catch (error) {
        console.error("Ödənişləri çəkərkən xəta baş verdi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // Axtarış və Filtrasiya məntiqi
  const filteredPayments = payments.filter((payment) => {
    const txnId = formatTxnId(payment.id).toLowerCase();
    const orderId = formatOrderId(payment.order_id).toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = txnId.includes(searchLower) || orderId.includes(searchLower);
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sadə hesablama: Uğurlu ödənişlərin ümumi cəmi (Əgər bazada 'amount' sütunu varsa)
  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#E4EAFB] border-t-[#1B4FD8] rounded-full animate-spin"></div>
          <p className="text-[#4A5878] font-medium animate-pulse">Ödənişlər yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      
      {/* Səhifə Başlığı və Filtrlər */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0D1F3C]">Ödənişlər</h1>
          <p className="text-[#4A5878] mt-1 text-sm">Platforma üzərindən edilən bütün tranzaksiyalar</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            placeholder="Tranzaksiya və ya Sifariş ID..." 
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
            <option value="completed">Uğurlu</option>
            <option value="pending">Gözləyir</option>
            <option value="refunded">Qaytarılıb</option>
            <option value="failed">Uğursuz</option>
          </select>
        </div>
      </div>

      {/* Maliyyə Xülasəsi (Üst Kartlar) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
        <div className="bg-[#1B4FD8] text-white p-5 rounded-xl shadow-sm">
          <p className="text-white/70 text-[12px] font-bold uppercase tracking-wider">Ümumi Dövriyyə (Uğurlu)</p>
          <h3 className="text-3xl font-bold mt-1">{totalRevenue.toFixed(2)} ₼</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E4EAFB] shadow-sm">
          <p className="text-[#94A3C0] text-[12px] font-bold uppercase tracking-wider">Ümumi Tranzaksiya Sayı</p>
          <h3 className="text-3xl font-bold text-[#0D1F3C] mt-1">{payments.length}</h3>
        </div>
      </div>

      {/* Ödənişlər Cədvəli */}
      <div className="bg-white rounded-xl border border-[#E4EAFB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px] whitespace-nowrap">
            <thead className="bg-[#F8FAFF] text-[#4A5878] text-[13px] font-medium border-b border-[#E4EAFB]">
              <tr>
                <th className="px-5 py-4 font-medium">Tranzaksiya ID</th>
                <th className="px-5 py-4 font-medium">Sifariş ID</th>
                <th className="px-5 py-4 font-medium">Tarix</th>
                <th className="px-5 py-4 font-medium">Metod</th>
                <th className="px-5 py-4 font-medium">Məbləğ</th>
                <th className="px-5 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAFB] text-[#0D1F3C]">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#4A5878]">
                    Axtarışa uyğun ödəniş tapılmadı. (Və ya bazada 'payments' cədvəli boşdur/yoxdur).
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-[#F8FAFF] transition-colors">
                    <td className="px-5 py-4 font-bold text-[#0D1F3C]">{formatTxnId(payment.id)}</td>
                    <td className="px-5 py-4 text-[#1B4FD8] hover:underline cursor-pointer">
                      {formatOrderId(payment.order_id)}
                    </td>
                    <td className="px-5 py-4 text-[#4A5878]">
                      {new Date(payment.created_at).toLocaleDateString('az-AZ', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-[#4A5878]">
                        {payment.payment_method === 'card' ? '💳 Kart' : '💵 Nağd'}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold">
                      {Number(payment.amount || 0).toFixed(2)} ₼
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold ${
                        payment.status === 'completed' ? 'bg-green-50 text-green-700' :
                        payment.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                        payment.status === 'refunded' ? 'bg-gray-100 text-[#4A5878]' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {payment.status === 'completed' ? 'Uğurlu' : 
                         payment.status === 'pending' ? 'Gözləyir' : 
                         payment.status === 'refunded' ? 'Qaytarılıb' : 
                         payment.status === 'failed' ? 'Uğursuz' : payment.status || 'Naməlum'}
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