"use client";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, LoaderCircle, MessageSquareText, Search, Send } from "lucide-react";

import { InitialsAvatar } from "@/components/shared/initials-avatar";

type ChatMessage = {
  id: string;
  senderRole: "brand" | "creator" | "system";
  message: string;
  createdAt: string;
  editedAt: string | null;
  readAt: string | null;
};

type Participant = { role: string; name: string; username: string; avatar?: string };

const MESSAGE_LIMIT = 2000;

function dayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

function highlighted(text: string, search: string) {
  if (!search) return text;
  const terms = text.split(new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return terms.map((term, index) =>
    term.toLowerCase() === search.toLowerCase() ? (
      <mark key={`${term}-${index}`} className="rounded bg-violet-300 px-0.5 text-slate-950">{term}</mark>
    ) : term,
  );
}

export function CollaborationChat({
  collaborationId,
  campaignTitle,
  status,
  deadline,
  budget,
}: {
  collaborationId: string;
  campaignTitle: string;
  status: string;
  deadline: string;
  budget: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [viewerRole, setViewerRole] = useState<"brand" | "creator">("brand");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const loadMessages = useCallback(async (options?: { older?: boolean; quiet?: boolean; query?: string }) => {
    const older = Boolean(options?.older);
    if (older) setLoadingMore(true);
    else if (!options?.quiet) setLoading(true);
    const params = new URLSearchParams();
    const query = options?.query ?? activeSearch;
    if (query) params.set("search", query);
    if (older && cursor) params.set("before", cursor);
    try {
      const response = await fetch(`/api/collaborations/${collaborationId}/chat?${params}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load messages.");
      setViewerRole(data.conversation.viewerRole);
      setParticipants(data.conversation.participants);
      setMessages((current) => older ? [...data.messages, ...current] : data.messages);
      setHasMore(data.hasMore);
      setCursor(data.nextCursor);
      setError("");
      if (!older && !initialized.current) {
        initialized.current = true;
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load messages.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeSearch, collaborationId, cursor]);

  useEffect(() => {
    void loadMessages();
    const timer = window.setInterval(() => void loadMessages({ quiet: true }), 5000);
    return () => window.clearInterval(timer);
  }, [loadMessages]);

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const message = draft.trim();
    if (!message || sending) return;
    setSending(true);
    try {
      const response = await fetch(`/api/collaborations/${collaborationId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not send message.");
      setDraft("");
      setMessages((current) => [...current, data.message]);
      setError("");
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setActiveSearch(search.trim());
    setCursor(null);
    initialized.current = false;
  }

  const otherParticipant = participants.find((participant) => participant.role !== viewerRole);

  return (
    <section id="chat" aria-label="Collaboration chat" className="scroll-mt-24">
      <div className="grid min-w-0 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <details className="group h-fit min-w-0 rounded-[8px] border border-white/10 bg-white/[0.04] p-5 lg:block" open>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 lg:cursor-default">
            <div>
              <p className="bridge-eyebrow">Campaign Summary</p>
              <h2 className="mt-2 font-display text-xl font-bold">{campaignTitle}</h2>
            </div>
            <ChevronDown className="shrink-0 transition group-open:rotate-180 lg:hidden" size={18} />
          </summary>
          <dl className="mt-5 grid gap-3 text-sm">
            {[["Status", status], ["Deadline", deadline], ["Budget", budget]].map(([label, value]) => (
              <div key={label} className="rounded-[8px] border border-white/10 bg-black/20 p-3">
                <dt className="text-xs font-semibold uppercase text-[var(--text-muted)]">{label}</dt>
                <dd className="mt-1 break-words text-[var(--text-primary)]">{value}</dd>
              </div>
            ))}
          </dl>
        </details>

        <div className="min-w-0 overflow-hidden rounded-[8px] border border-violet-300/20 bg-white/[0.04]">
          <header className="flex min-w-0 flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <InitialsAvatar imageUrl={otherParticipant?.avatar} name={otherParticipant?.name} username={otherParticipant?.username} className="h-10 w-10 shrink-0 rounded-full" />
              <div className="min-w-0">
                <p className="truncate font-semibold">{otherParticipant?.name ?? "Collaboration partner"}</p>
                <p className="text-xs text-[var(--text-secondary)]">Private collaboration chat</p>
              </div>
            </div>
            <form onSubmit={submitSearch} className="flex min-w-0 gap-2">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search this conversation</span>
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="bridge-input w-full pl-9" placeholder="Search messages" maxLength={120} />
              </label>
              <button className="bridge-button-secondary shrink-0 px-3" type="submit">Search</button>
            </form>
          </header>

          <div role="log" aria-live="polite" className="h-[min(58vh,560px)] min-h-[360px] overflow-y-auto overscroll-contain p-4">
            {loading ? (
              <div aria-label="Loading messages" className="grid gap-4">
                {[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-[8px] bg-white/[0.06]" />)}
              </div>
            ) : (
              <>
                {hasMore ? (
                  <button onClick={() => void loadMessages({ older: true })} disabled={loadingMore} className="bridge-button-secondary mx-auto mb-5 flex">
                    {loadingMore ? <LoaderCircle className="animate-spin" size={16} /> : null} Load More
                  </button>
                ) : null}
                {!messages.length ? (
                  <div className="flex h-64 flex-col items-center justify-center text-center text-[var(--text-secondary)]">
                    <MessageSquareText size={30} className="text-violet-200" />
                    <p className="mt-3 font-semibold text-[var(--text-primary)]">{activeSearch ? "No matching messages" : "Start the collaboration conversation"}</p>
                    <p className="mt-1 text-sm">{activeSearch ? "Try a different search term." : "Messages are private to this accepted collaboration."}</p>
                  </div>
                ) : null}
                {messages.map((message, index) => {
                  const previous = messages[index - 1];
                  const own = message.senderRole === viewerRole;
                  const system = message.senderRole === "system";
                  return (
                    <div key={message.id}>
                      {!previous || dayLabel(previous.createdAt) !== dayLabel(message.createdAt) ? (
                        <div className="my-5 flex items-center gap-3 text-xs text-[var(--text-muted)]"><span className="h-px flex-1 bg-white/10" />{dayLabel(message.createdAt)}<span className="h-px flex-1 bg-white/10" /></div>
                      ) : null}
                      {system ? (
                        <div className="mx-auto my-3 w-fit max-w-full rounded-full border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-center text-xs font-semibold text-violet-100">{highlighted(message.message, activeSearch)}</div>
                      ) : (
                        <div className={`my-3 flex items-end gap-2 ${own ? "justify-end" : "justify-start"}`}>
                          {!own ? <InitialsAvatar imageUrl={otherParticipant?.avatar} name={otherParticipant?.name} username={otherParticipant?.username} className="h-8 w-8 shrink-0 rounded-full" /> : null}
                          <div className={`max-w-[82%] rounded-[14px] px-4 py-3 ${own ? "rounded-br-sm bg-violet-500 text-white" : "rounded-bl-sm border border-white/10 bg-white/[0.07]"}`}>
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">{highlighted(message.message, activeSearch)}</p>
                            <time className={`mt-1 block text-[10px] ${own ? "text-violet-100" : "text-[var(--text-muted)]"}`}>{new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(message.createdAt))}</time>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          <form onSubmit={sendMessage} className="border-t border-white/10 p-4">
            {error ? <p role="alert" className="mb-2 text-sm text-rose-300">{error}</p> : null}
            <div className="flex min-w-0 items-end gap-2">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Message</span>
                <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKeyDown} className="bridge-input min-h-12 max-h-32 w-full resize-y whitespace-pre-wrap" rows={1} maxLength={MESSAGE_LIMIT} placeholder="Type a message… Enter to send, Shift+Enter for a new line" />
              </label>
              <button type="submit" disabled={!draft.trim() || sending} className="bridge-button-primary h-12 shrink-0 px-4" aria-label="Send message">
                {sending ? <LoaderCircle className="animate-spin" size={17} /> : <Send size={17} />}<span className="hidden sm:inline">Send</span>
              </button>
            </div>
            <p className="mt-2 text-right text-xs text-[var(--text-muted)]">{draft.length}/{MESSAGE_LIMIT}</p>
          </form>
        </div>
      </div>
    </section>
  );
}
