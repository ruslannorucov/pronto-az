import Link from 'next/link';
import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen min-h-[700px] bg-[#F8FAFF] font-sans overflow-hidden">
      
      {/* Sol Menyu (Sidebar) */}
      <aside className="w-[220px] bg-[#0D1F3C] flex flex-col shrink-0 hidden md:flex">
        
        {/* Loqo Hissəsi */}
        <div className="p-5 border-b border-white/10">
          <span className="font-serif text-lg font-bold text-white">
            Pronto.az <em className="text-[#1B4FD8] not-italic">Admin</em>
          </span>
          <small className="block text-[10px] text-white/30 mt-0.5 tracking-wider uppercase">
            İdarəetmə Paneli
          </small>
        </div>

        {/* Naviqasiya Linkləri */}
        <nav className="p-3 flex-1 flex flex-col gap-1">
          <Link 
            href="/admin" 
            className="flex items-center gap-2 p-2.5 rounded-lg text-[13px] font-medium text-white bg-white/10"
          >
            📊 Statistika
          </Link>
          <Link 
            href="/admin/orders" 
            className="flex items-center gap-2 p-2.5 rounded-lg text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            📋 Sifarişlər
          </Link>
          <Link 
            href="/admin/workers" 
            className="flex items-center gap-2 p-2.5 rounded-lg text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            👷 Ustalar
            <span className="ml-auto bg-[#1B4FD8] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              3
            </span>
          </Link>
          <Link 
            href="/admin/payments" 
            className="flex items-center gap-2 p-2.5 rounded-lg text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            💳 Ödənişlər
          </Link>
          <Link 
            href="/admin/settings" 
            className="flex items-center gap-2 p-2.5 rounded-lg text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            ⚙️ Tənzimləmələr
          </Link>
        </nav>

        {/* İstifadəçi Profili Hissəsi */}
        <div className="p-4 border-t border-white/10 hover:bg-white/5 transition-colors cursor-pointer">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-[#1B4FD8] flex items-center justify-center text-white text-xs font-bold">
               AD
             </div>
             <div className="flex-1">
               <div className="text-[13px] font-medium text-white">Admin User</div>
               <div className="text-[11px] text-white/40 hover:text-white">Çıxış et</div>
             </div>
           </div>
        </div>
      </aside>

      {/* Əsas Məzmun Sahəsi (Main Content) */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobil menyu üçün kiçik başlıq (Hamburger menusu gələcəkdə bura əlavə edilə bilər) */}
        <div className="md:hidden p-4 bg-[#0D1F3C] text-white font-bold flex justify-between items-center">
           <span>Pronto.az Admin</span>
           <button className="p-1 bg-white/10 rounded">☰</button>
        </div>
        {children}
      </main>

    </div>
  );
}