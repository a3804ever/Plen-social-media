/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { ForumThread, ForumReply, PilotProfile, ForumCategory } from "../types";
import { MessageSquare, Users, Award, BookOpen, PlusCircle, Search, Calendar, ChevronRight, AlertCircle, ArrowLeft, Send } from "lucide-react";

interface ForumProps {
  categories: ForumCategory[];
  threads: ForumThread[];
  currentUser: PilotProfile | null;
  onThreadCreated: () => void;
  onReplyAdded: (threadId: string, replyContent: string) => void;
  triggerCaptcha: (callback: () => void) => void;
  onNavigateToAuth?: (mode: "login" | "register") => void;
}

export default function PilotDiscussionForum({
  categories,
  threads,
  currentUser,
  onThreadCreated,
  onReplyAdded,
  triggerCaptcha,
  onNavigateToAuth
}: ForumProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [showAddThreadModal, setShowAddThreadModal] = useState(false);
  
  // Custom states
  const [threadTitle, setThreadTitle] = useState("");
  const [threadContent, setThreadContent] = useState("");
  const [newThreadCategoryId, setNewThreadCategoryId] = useState("commercial");
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const activeThread = threads.find(t => t.id === activeThreadId);

  // Filter threads
  const filteredThreads = threads.filter(thread => {
    const matchesCategory = activeCategoryId === "all" || thread.categoryId === activeCategoryId;
    const matchesSearch = searchQuery === "" || 
      thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.authorUsername.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateThread = (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!threadTitle.trim() || !threadContent.trim()) {
      setStatusMsg("Identify flight metrics! Title and content must be filled.");
      return;
    }

    triggerCaptcha(async () => {
      try {
        const payload = {
          categoryId: newThreadCategoryId,
          title: threadTitle,
          content: threadContent,
          authorUsername: currentUser.username,
          authorCallsign: currentUser.callsign,
          authorLicense: currentUser.licenseType
        };

        const res = await fetch("/api/forums/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          setThreadTitle("");
          setThreadContent("");
          setShowAddThreadModal(false);
          setStatusMsg("");
          onThreadCreated();
        } else {
          const err = await res.json();
          setStatusMsg(err.error || "Failed to catalog thread flight plan.");
        }
      } catch (err) {
        console.error(err);
        setStatusMsg("Communications line broken. Check sync status.");
      }
    });
  };

  const submitReply = async () => {
    if (!activeThreadId || !replyText.trim() || !currentUser) return;

    try {
      const payload = {
        authorUsername: currentUser.username,
        authorCallsign: currentUser.callsign,
        authorLicense: currentUser.licenseType,
        content: replyText
      };

      const res = await fetch(`/api/forums/threads/${activeThreadId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setReplyText("");
        onReplyAdded(activeThreadId, replyText);
      } else {
        alert("Communications issue. Unable to post flight response.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* HUD Header */}
      <div className="p-6 rounded-2xl border border-white/5 bg-[#080B10]/80 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans shadow-md">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">Pilot Discussion Forums</h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Exchange aviation knowledge, licensing guidelines, MSFS simulations, and checkride briefs.
          </p>
        </div>

        {currentUser ? (
          <button
            onClick={() => setShowAddThreadModal(true)}
            className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-500 text-xs font-mono font-bold uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Brief New Thread</span>
          </button>
        ) : (
          <button
            onClick={() => onNavigateToAuth?.("login")}
            className="px-4 py-2 border border-blue-500/30 rounded-lg bg-[#11161D] hover:bg-[#18202A] text-blue-400 hover:text-blue-300 text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/5"
          >
            <span>⚠️ Click to Sign-in & Brief New Threads</span>
          </button>
        )}
      </div>

      {activeThreadId && activeThread ? (
        /* ========== THREAD DETAILED VIEW ========== */
        <div className="space-y-6 font-sans">
          <button
            onClick={() => setActiveThreadId(null)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#11161D] hover:bg-[#18202A] border border-white/5 text-xs text-blue-400 font-mono transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>[BACK TO DISPATCH LIST]</span>
          </button>

          {/* Core Thread Post Card */}
          <div className="border border-white/5 rounded-2xl bg-[#080B10]/80 overflow-hidden shadow-xl">
            {/* Header */}
            <div className="p-5 border-b border-white/5 bg-[#11161D]/40 flex items-center justify-between font-mono text-[11px] text-slate-400">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#11161D] border border-white/10 flex items-center justify-center text-blue-400 font-bold">
                  ATC
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold">{activeThread.authorUsername}</span>
                    <span className="text-[9px] uppercase px-1 rounded bg-[#11161D] text-slate-300">
                      {activeThread.authorCallsign}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{activeThread.authorLicense}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="block">{new Date(activeThread.timestamp).toLocaleDateString()}</span>
                <span className="block text-blue-400/80">
                  {new Date(activeThread.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Title & Body */}
            <div className="p-6">
              <h3 className="text-xl font-bold font-sans text-white leading-normal tracking-tight">{activeThread.title}</h3>
              <p className="text-slate-300 text-sm mt-4 font-sans whitespace-pre-wrap leading-relaxed border-l-2 border-blue-500 pl-4">
                {activeThread.content}
              </p>
            </div>
          </div>

          {/* Replies list */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest pl-1">
              Flight Briefing Responses ({activeThread.replies.length})
            </h4>

            {activeThread.replies.length === 0 ? (
              <div className="p-8 border border-white/5 border-dashed text-center text-slate-500 rounded-2xl bg-[#080B10]/20 text-xs font-mono">
                No telemetry responses yet. Connect to radio and transmit answer!
              </div>
            ) : (
              <div className="space-y-3">
                {activeThread.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="p-5 rounded-2xl border border-white/5 bg-[#11161D]/60 relative hover:border-blue-500/20 transition-all"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 pb-2 border-b border-white/5 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-400">{reply.authorUsername}</span>
                        <span className="px-1 py-0.5 rounded bg-[#05070A] text-slate-300 text-[8px] uppercase">
                          {reply.authorCallsign}
                        </span>
                        <span className="text-slate-500">{reply.authorLicense}</span>
                      </div>
                      <span>
                        {new Date(reply.timestamp).toLocaleDateString()} {new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed pl-1">{reply.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Input Form */}
            {currentUser ? (
              <div className="p-5 border border-white/5 rounded-2xl bg-[#080B10]/90 space-y-4 shadow-lg">
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Transmit New Response to Dispatch
                </label>
                <textarea
                  rows={3}
                  placeholder="Insert professional pilot feedback, simulated metrics, aeronautical advice..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full bg-[#11161D] border border-white/5 text-white rounded-lg p-3 text-xs focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                />
                <div className="flex justify-end">
                  <button
                    onClick={submitReply}
                    className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-500 font-mono text-xs font-bold uppercase rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-500/10"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Transmit Dispatch Reply</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => onNavigateToAuth?.("login")}
                className="w-full p-4 border border-blue-500/10 border-dashed rounded-2xl text-center text-blue-400 hover:text-blue-300 font-mono text-xs bg-[#080B10]/20 hover:bg-[#11161D]/50 transition-all cursor-pointer"
              >
                ⚠️ Authenticate flight log here to reply to this forum topic dispatch.
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
          {/* Categorical sidebar filter */}
          <div className="lg:col-span-3 space-y-2">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider px-2 pb-1.5 border-b border-white/5">
              DISCIPLINE DECK
            </h3>
            <button
              onClick={() => setActiveCategoryId("all")}
              className={`w-full text-left px-3.5 py-2.5 text-xs rounded-xl transition-all font-mono uppercase flex items-center justify-between border cursor-pointer ${
                activeCategoryId === "all"
                  ? "bg-blue-600 text-white border-blue-600 font-bold shadow-md shadow-blue-500/15"
                  : "bg-[#080B10]/80 hover:bg-[#11161D] text-slate-400 border-white/5"
              }`}
            >
              <span>🌐 All Dispatch Categories</span>
              <span className="text-[10px] bg-[#05070A] text-blue-400 px-1 rounded-md border border-white/5">
                {threads.length}
              </span>
            </button>
            {categories.map((cat) => {
              const count = threads.filter((t) => t.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`w-full text-left p-3 text-xs rounded-xl transition-all font-sans flex flex-col gap-1 border shadow-sm cursor-pointer ${
                    activeCategoryId === cat.id
                      ? "bg-[#11161D] border-blue-500 text-white font-bold"
                      : "bg-[#080B10]/80 hover:bg-[#11161D] text-slate-400 border-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between w-full font-mono text-slate-200">
                    <span className="text-blue-400 font-bold uppercase">{cat.name}</span>
                    <span className="text-[9px] px-1 py-0.5 rounded bg-[#05070A] border border-white/5 text-slate-400 font-mono">
                      {count}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans font-normal mt-1 leading-relaxed text-left">
                    {cat.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Threads stream list */}
          <div className="lg:col-span-9 space-y-4">
            {/* Search HUD */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search cockpit forum threads, topics, pilot licenses, flight questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#080B10]/80 border border-white/5 rounded-xl px-10 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
            </div>

            {filteredThreads.length === 0 ? (
              <div className="p-16 border border-white/5 border-dashed text-center rounded-2xl bg-[#080B10]/10 text-slate-500 font-mono text-xs">
                ⚠️ Zero active aeronautical dispatches matches query list.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredThreads.map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className="p-5 border border-white/5 rounded-2xl bg-[#080B10]/80 hover:border-blue-500/30 hover:bg-[#11161D]/80 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-sm"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2 flex-wrap font-sans">
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#11161D] border border-white/5 text-blue-400 font-mono font-bold">
                          {categories.find((c) => c.id === thread.categoryId)?.name || "Lounge"}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          by <strong className="text-slate-200">{thread.authorUsername}</strong> ({thread.authorCallsign})
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white tracking-tight leading-snug group-hover:text-blue-400 transition-colors font-sans">
                        {thread.title}
                      </h4>
                      <p className="text-slate-400 text-xs line-clamp-1 font-sans">
                        {thread.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 font-mono text-[10px] text-slate-400 text-right">
                      <div>
                        <span className="block text-xs font-bold text-slate-200">{thread.replies.length} replies</span>
                        <span className="block text-slate-500 text-[9px] mt-0.5">{new Date(thread.timestamp).toLocaleDateString()}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1.5 transition-all shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Brief New Thread Modal */}
      {showAddThreadModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#05070A]/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl border bg-[#080B10] border-white/10 rounded-2xl overflow-hidden shadow-2xl my-8 font-sans">
            <div className="px-6 py-4.5 border-b border-white/5 bg-[#11161D] flex items-center justify-between">
              <h3 className="text-white text-base font-bold font-mono uppercase tracking-wide flex items-center gap-1.5">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <span>Brief New Discussion Dispatch</span>
              </h3>
              <button
                onClick={() => setShowAddThreadModal(false)}
                className="text-slate-400 hover:text-white text-[10px] font-mono cursor-pointer uppercase tracking-wider"
              >
                [CANCEL]
              </button>
            </div>

            <form onSubmit={handleCreateThread} className="p-6 space-y-4">
              {statusMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-xs font-mono">
                  ⚠️ {statusMsg}
                </div>
              )}

              {/* Select Category */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                  Aeronautical Category / Discipline
                </label>
                <select
                  value={newThreadCategoryId}
                  onChange={(e) => setNewThreadCategoryId(e.target.value)}
                  className="w-full bg-[#11161D] border border-white/5 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 uppercase font-mono cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-[#11161D] text-white">
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title & Content */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                  Briefing Dispatch Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Preparing for PPL checkride oral exam - flight plan tips"
                  value={threadTitle}
                  onChange={(e) => setThreadTitle(e.target.value)}
                  className="w-full bg-[#11161D] border border-white/5 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                  Core Dispatch Content *
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Insert flight metrics, questions, checkride setups, software specs, engine metrics..."
                  value={threadContent}
                  onChange={(e) => setThreadContent(e.target.value)}
                  className="w-full bg-[#11161D] border border-white/5 text-white rounded-lg p-3 text-xs focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              {/* Submit panel */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-3">
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  Subject to standard PLEN human checks
                </span>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddThreadModal(false)}
                    className="px-4 py-2 font-mono text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold uppercase rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/25 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Launch New Thread</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
