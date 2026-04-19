"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function getInitials(name: string) {
  return name.trim().split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

export function ChatModal({
  jobId,
  offerId,
  workerName,
  onClose,
  readOnly = false,
}: {
  jobId: string;
  offerId: string;
  workerName: string;
  onClose: () => void;
  readOnly?: boolean;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (user) setUserId(user.id);

      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });
      setMessages(data ?? []);

      if (user && !readOnly) {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("job_id", jobId)
          .neq("sender_id", user.id)
          .is("read_at", null);
      }
    };
    init();

    if (readOnly) return;

    const channel = supabase
      .channel(`chat-${jobId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `job_id=eq.${jobId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [jobId, readOnly]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || !userId || sending || readOnly) return;
    setSending(true);
    const msg = text.trim();
    setText("");
    await supabase.from("messages").insert({
      job_id: jobId,
      sender_id: userId,
      content: msg,
    });
    setSending(false);
  };

  function timeStr(d: string) {
    const dt = new Date(d);
    return `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
  }

  const initials = getInitials(workerName);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 60,
      display: "flex",
      flexDirection: "column",
      background: "#F8FAFF",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0B1D3A 0%, #0F2D5C 50%, #0D2554 100%)",
        padding: "0 16px",
        paddingTop: "env(safe-area-inset-top, 12px)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: "calc(64px + env(safe-area-inset-top, 0px))",
        flexShrink: 0,
        boxShadow: "0 2px 16px rgba(11,29,58,0.4)",
      }}>
        {/* Geri düyməsi */}
        <button
          onClick={onClose}
          style={{
            width: 38, height: 38, borderRadius: 12,
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Avatar */}
        <div style={{
          width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
          background: readOnly
            ? "linear-gradient(135deg,#94A3C0,#4A5878)"
            : "linear-gradient(135deg,#3B82F6,#1B4FD8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, color: "#fff",
          fontFamily: "'Playfair Display', serif",
          border: "2px solid rgba(255,255,255,0.2)",
          position: "relative",
        }}>
          {initials}
          {!readOnly && (
            <span style={{
              position: "absolute", bottom: 0, right: 0,
              width: 10, height: 10, borderRadius: "50%",
              background: "#10B981", border: "2px solid #0B1D3A",
            }} />
          )}
        </div>

        {/* Ad + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.2 }}>
            {workerName}
          </p>
          <p style={{
            fontSize: 11, marginTop: 2,
            color: readOnly ? "rgba(255,255,255,0.45)" : "#34D399",
          }}>
            {readOnly ? "🔒 Arxivləşib · Oxunur" : "● Aktiv sifariş · Yolda"}
          </p>
        </div>
      </div>

      {/* Arxiv banneri */}
      {readOnly && (
        <div style={{
          padding: "10px 16px",
          background: "#FFF7ED",
          borderBottom: "1px solid #FED7AA",
          display: "flex", alignItems: "center", gap: 8,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 16 }}>🔒</span>
          <p style={{ fontSize: 12, color: "#92400E", margin: 0, fontWeight: 500 }}>
            Bu sifariş tamamlanıb. Söhbət yalnız oxumaq üçündür.
          </p>
        </div>
      )}

      {/* Mesajlar */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <p style={{ fontSize: 13, color: "#94A3C0", fontWeight: 500 }}>
              {readOnly ? "Bu söhbətdə mesaj yoxdur." : "Söhbəti başladın 👋"}
            </p>
            {!readOnly && (
              <p style={{ fontSize: 11, color: "#B8C5D6", marginTop: 6 }}>
                Usta ilə birbaşa əlaqə saxlayın
              </p>
            )}
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === userId;
          return (
            <div key={msg.id} style={{
              display: "flex",
              justifyContent: isMe ? "flex-end" : "flex-start",
              alignItems: "flex-end",
              gap: 8,
            }}>
              {!isMe && (
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: readOnly
                    ? "linear-gradient(135deg,#94A3C0,#4A5878)"
                    : "linear-gradient(135deg,#3B82F6,#1B4FD8)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: "#fff",
                  flexShrink: 0,
                  fontFamily: "'Playfair Display', serif",
                }}>
                  {initials}
                </div>
              )}
              <div style={{ maxWidth: "75%" }}>
                <div style={{
                  padding: "11px 14px",
                  borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: isMe
                    ? (readOnly ? "#94A3C0" : "linear-gradient(135deg,#1B4FD8,#2563EB)")
                    : "#fff",
                  color: isMe ? "#fff" : "#0D1F3C",
                  fontSize: 14,
                  lineHeight: 1.5,
                  boxShadow: isMe
                    ? "0 2px 8px rgba(27,79,216,0.25)"
                    : "0 1px 4px rgba(13,31,60,0.08)",
                }}>
                  {msg.content}
                </div>
                <p style={{
                  fontSize: 10, color: "#94A3C0", marginTop: 4,
                  textAlign: isMe ? "right" : "left",
                  paddingRight: isMe ? 2 : 0,
                  paddingLeft: isMe ? 0 : 2,
                }}>
                  {timeStr(msg.created_at)}{isMe && !readOnly ? " ✓✓" : ""}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input sahəsi */}
      <div style={{
        background: "#fff",
        borderTop: "1px solid #E4EAFB",
        padding: "10px 12px",
        paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))",
        display: "flex",
        gap: 10,
        alignItems: "flex-end",
        flexShrink: 0,
      }}>
        {readOnly ? (
          <>
            <div style={{
              flex: 1,
              background: "#F1F5FE",
              border: "1px solid #E4EAFB",
              borderRadius: 22,
              padding: "12px 16px",
            }}>
              <p style={{ fontSize: 13, color: "#94A3C0", margin: 0 }}>
                Mesaj göndərmək mümkün deyil
              </p>
            </div>
            <div style={{
              width: 42, height: 42, borderRadius: "50%",
              background: "#E4EAFB",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 8L2 2l2 6-2 6 12-6z" fill="#94A3C0"/>
              </svg>
            </div>
          </>
        ) : (
          <>
            <div style={{
              flex: 1,
              background: "#F8FAFF",
              border: "1px solid #E4EAFB",
              borderRadius: 22,
              padding: "10px 16px",
              minHeight: 42,
              display: "flex", alignItems: "center",
            }}>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Mesaj yazın..."
                rows={1}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  color: "#0D1F3C",
                  resize: "none",
                  maxHeight: 100,
                  fontFamily: "inherit",
                  lineHeight: 1.5,
                }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!text.trim() || sending}
              style={{
                width: 42, height: 42, borderRadius: "50%",
                background: "linear-gradient(135deg,#1B4FD8,#2563EB)",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "none", cursor: "pointer", flexShrink: 0,
                opacity: !text.trim() || sending ? 0.4 : 1,
                transition: "opacity 0.15s, transform 0.1s",
                boxShadow: "0 4px 12px rgba(27,79,216,0.35)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 8L2 2l2 6-2 6 12-6z" fill="white"/>
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}