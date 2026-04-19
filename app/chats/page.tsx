"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChatModal, getInitials } from "@/components/ChatModal";

type ChatItem = {
  jobId: string;
  offerId: string;
  categoryName: string;
  categoryIcon: string;
  workerName: string;
  workerId: string;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
  isArchived: boolean;
};

function formatId(id: string): string {
  return "#PRN-" + id.slice(0, 4).toUpperCase();
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "İndi";
  if (diff < 3600) return `${Math.floor(diff / 60)} dəq`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat`;
  return d.toLocaleDateString("az-AZ", { day: "numeric", month: "short" });
}

function ChatCard({ chat, onClick }: { chat: ChatItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl px-4 py-3 transition-all active:scale-[0.99]"
      style={{
        border: chat.isArchived
          ? "1px solid var(--border)"
          : chat.unreadCount > 0
          ? "1.5px solid #1B4FD8"
          : "1px solid var(--border)",
        boxShadow: chat.unreadCount > 0 && !chat.isArchived
          ? "0 4px 16px rgba(27,79,216,0.08)"
          : "none",
        opacity: chat.isArchived ? 0.85 : 1,
      }}
    >
      <div className="flex items-center gap-3">
        <div style={{
          width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
          background: chat.isArchived
            ? "linear-gradient(135deg,#94A3C0,#4A5878)"
            : "linear-gradient(135deg,#1B4FD8,#2563EB)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, fontWeight: 700, color: "#fff",
          fontFamily: "'Playfair Display', serif",
          position: "relative",
        }}>
          {getInitials(chat.workerName)}
          {!chat.isArchived && (
            <span style={{
              position: "absolute", bottom: 1, right: 1,
              width: 11, height: 11, borderRadius: "50%",
              background: "#10B981", border: "2px solid #fff",
            }} />
          )}
          {chat.isArchived && (
            <span style={{
              position: "absolute", bottom: 0, right: 0,
              width: 16, height: 16, borderRadius: "50%",
              background: "#94A3C0", border: "2px solid #fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 8,
            }}>🔒</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-[13px] font-bold text-[var(--navy)] truncate">
              {chat.workerName}
            </p>
            <span className="text-[10px] text-[var(--gray-400)] flex-shrink-0">
              {chat.lastMessageTime ? timeAgo(chat.lastMessageTime) : ""}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-[var(--gray-400)] truncate">
              {chat.lastMessage ?? (
                <span className="italic">{chat.categoryIcon} {chat.categoryName}</span>
              )}
            </p>
            {chat.unreadCount > 0 && !chat.isArchived && (
              <span style={{
                minWidth: 18, height: 18, borderRadius: 999,
                background: "linear-gradient(135deg,#1B4FD8,#2563EB)",
                fontSize: 9, color: "#fff", fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 5px", flexShrink: 0,
              }}>
                {chat.unreadCount}
              </span>
            )}
          </div>
          <div className="mt-1.5">
            <span style={{
              fontSize: 9, fontWeight: 600,
              color: chat.isArchived ? "#94A3C0" : "#1B4FD8",
              background: chat.isArchived ? "#F1F5FE" : "#EFF4FF",
              padding: "2px 8px", borderRadius: 999,
            }}>
              {chat.categoryIcon} {chat.categoryName} · {formatId(chat.jobId)}
              {chat.isArchived && " · Tamamlandı"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function ChatsPage() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<ChatItem | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { router.push("/login"); return; }

      const { data: jobs } = await supabase
        .from("job_requests")
        .select("id, category_id, status")
        .eq("customer_id", user.id)
        .in("status", ["in_progress", "done"])
        .order("created_at", { ascending: false });

      if (!jobs || jobs.length === 0) { setLoading(false); return; }

      const jobIds = jobs.map((j: any) => j.id);
      const catIds = [...new Set(jobs.map((j: any) => j.category_id).filter(Boolean))];

      const { data: catsData } = catIds.length > 0
        ? await supabase.from("categories").select("id, name_az, icon").in("id", catIds)
        : { data: [] };
      const catMap: Record<string, any> = {};
      (catsData ?? []).forEach((c: any) => { catMap[c.id] = c; });

      const { data: offers } = await supabase
        .from("offers")
        .select("id, job_id, worker_id")
        .in("job_id", jobIds)
        .eq("status", "accepted");

      if (!offers || offers.length === 0) { setLoading(false); return; }

      // Ödənişi olan offer-lər (held veya released)
      const offerIds = offers.map((o: any) => o.id);
      const { data: payments } = await supabase
        .from("payments")
        .select("offer_id, status")
        .in("offer_id", offerIds)
        .in("status", ["held", "released"]);
      const paidOfferIds = new Set((payments ?? []).map((p: any) => p.offer_id));

      // in_progress → yalnız ödənişlə; done → həmişə
      const filteredOffers = offers.filter((o: any) => {
        const job = jobs.find((j: any) => j.id === o.job_id);
        if (job?.status === "done") return true;
        return paidOfferIds.has(o.id);
      });

      if (filteredOffers.length === 0) { setLoading(false); return; }

      const workerIds = [...new Set(filteredOffers.map((o: any) => o.worker_id))];
      const { data: workerNames } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", workerIds);
      const wnMap: Record<string, string> = {};
      (workerNames ?? []).forEach((p: any) => { wnMap[p.id] = p.full_name; });

      const chatItems: ChatItem[] = await Promise.all(
        filteredOffers.map(async (offer: any) => {
          const job = jobs.find((j: any) => j.id === offer.job_id);
          const isArchived = job?.status === "done";

          const { data: lastMsgData } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("job_id", offer.job_id)
            .order("created_at", { ascending: false })
            .limit(1);

          let unreadCount = 0;
          if (!isArchived) {
            const { count } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("job_id", offer.job_id)
              .neq("sender_id", user.id)
              .is("read_at", null);
            unreadCount = count ?? 0;
          }

          const lastMsg = lastMsgData?.[0] ?? null;
          const cat = catMap[job?.category_id] ?? null;

          return {
            jobId: offer.job_id,
            offerId: offer.id,
            categoryName: cat?.name_az ?? "Xidmət",
            categoryIcon: cat?.icon ?? "🔧",
            workerName: wnMap[offer.worker_id] ?? "Usta",
            workerId: offer.worker_id,
            lastMessage: lastMsg?.content ?? null,
            lastMessageTime: lastMsg?.created_at ?? null,
            unreadCount,
            isArchived,
          };
        })
      );

      chatItems.sort((a, b) => {
        if (a.isArchived !== b.isArchived) return a.isArchived ? 1 : -1;
        if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

      setChats(chatItems);
      setLoading(false);
    };

    load();
  }, []);

  const activeChats   = chats.filter(c => !c.isArchived);
  const archivedChats = chats.filter(c => c.isArchived);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        <div className="h-7 w-32 bg-[var(--gray-100)] rounded-xl animate-pulse mb-6" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-[80px] bg-[var(--gray-100)] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 sm:px-5 py-6">
        <div className="mb-5">
          <h1 className="font-serif text-[20px] font-bold text-[var(--navy)]">Mesajlar</h1>
          <p className="text-[12px] text-[var(--gray-400)] mt-0.5">
            {chats.length === 0
              ? "Aktiv söhbət yoxdur"
              : `${activeChats.length} aktiv · ${archivedChats.length} arxiv`}
          </p>
        </div>

        {chats.length === 0 && (
          <div className="bg-white border border-[var(--border)] rounded-2xl p-10 text-center mt-4">
            <div className="text-5xl mb-4">💬</div>
            <p className="text-[15px] font-bold text-[var(--navy)] mb-2">Aktiv söhbət yoxdur</p>
            <p className="text-[12px] text-[var(--gray-400)] mb-5">
              Usta seçib ödənişi təsdiqləyin — chat avtomatik açılacaq
            </p>
            <button
              onClick={() => router.push("/request/new")}
              className="inline-flex items-center gap-2 bg-[var(--primary)] text-white text-[13px] font-bold px-6 py-3 rounded-xl hover:bg-[var(--primary-light)] transition-colors"
            >
              + Yeni Sifariş
            </button>
          </div>
        )}

        {activeChats.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-[var(--navy)] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block animate-pulse" />
                Aktiv
              </p>
              <span className="text-[10px] font-bold text-[#10B981] bg-[#D1FAE5] px-2.5 py-0.5 rounded-full">
                {activeChats.length}
              </span>
            </div>
            <div className="space-y-2">
              {activeChats.map(chat => (
                <ChatCard key={chat.jobId} chat={chat} onClick={() => setActiveChat(chat)} />
              ))}
            </div>
          </div>
        )}

        {archivedChats.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-[var(--gray-400)] uppercase tracking-wider">
                🔒 Keçmiş
              </p>
              <span className="text-[10px] font-bold text-[var(--gray-400)] bg-[var(--gray-100)] px-2.5 py-0.5 rounded-full">
                {archivedChats.length}
              </span>
            </div>
            <div className="space-y-2">
              {archivedChats.map(chat => (
                <ChatCard key={chat.jobId} chat={chat} onClick={() => setActiveChat(chat)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {activeChat && (
        <ChatModal
          jobId={activeChat.jobId}
          offerId={activeChat.offerId}
          workerName={activeChat.workerName}
          readOnly={activeChat.isArchived}
          onClose={() => setActiveChat(null)}
        />
      )}
    </>
  );
}