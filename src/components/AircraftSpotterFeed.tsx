/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { Post, PilotProfile } from "../types";
import { Camera, MapPin, Tag, Heart, MessageSquare, BookMarked, User, Send, Compass, PlusCircle, Globe, Sparkles } from "lucide-react";

interface FeedProps {
  posts: Post[];
  currentUser: PilotProfile | null;
  onPostCreated: () => void;
  onLikeToggle: (postId: string) => void;
  onSaveToggle: (postId: string) => void;
  onCommentAdded: (postId: string, commentContent: string) => void;
  triggerCaptcha: (callback: () => void) => void;
  onNavigateToAuth?: (mode: "login" | "register") => void;
}

const PRESET_HIGH_RES_IMAGES = [
  {
    name: "Emirates Airbus A380 Flying Above of Clouds",
    url: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=1200",
    specs: "Airbus A380-800 • GP7200 Quad-Turbofans",
  },
  {
    name: "Cessna 172 Skyhawk Taxiing at Sunset",
    url: "https://images.unsplash.com/photo-1508849789987-4e5333c12b78?auto=format&fit=crop&q=80&w=1200",
    specs: "Cessna 172SP • Lycoming IO-360-L2A",
  },
  {
    name: "Eurofighter Typhoon Fighter Jet Banking Left",
    url: "https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?auto=format&fit=crop&q=80&w=1200",
    specs: "Eurofighter Typhoon • EJ200 Afterburners",
  },
  {
    name: "F-16 Fighting Falcon Supersonic Break",
    url: "https://images.unsplash.com/photo-1512288094938-363287817259?auto=format&fit=crop&q=80&w=1200",
    specs: "F-16C Fighting Falcon • Pratt & Whitney F100",
  },
  {
    name: "Boeing 787-9 Dreamliner Takeoff Cruise",
    url: "https://images.unsplash.com/photo-1520437358207-3dbf587803c7?auto=format&fit=crop&q=80&w=1200",
    specs: "Boeing 787-9 • Rolls-Royce Trent 1000",
  }
];

export default function AircraftSpotterFeed({
  posts,
  currentUser,
  onPostCreated,
  onLikeToggle,
  onSaveToggle,
  onCommentAdded,
  triggerCaptcha,
  onNavigateToAuth
}: FeedProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageIndex, setImageIndex] = useState(0);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [aircraftType, setAircraftType] = useState("");
  const [registration, setRegistration] = useState("");
  const [airline, setAirline] = useState("");
  const [airport, setAirport] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState("");

  const selectedImage = PRESET_HIGH_RES_IMAGES[imageIndex];

  // Handle post creation
  const handleCreatePost = (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setErrorMsg("Must be authenticated in the flight computer to post.");
      return;
    }
    if (!title.trim() || !content.trim()) {
      setErrorMsg("Title and content description required!");
      return;
    }

    // Trigger aviation captcha validation
    triggerCaptcha(async () => {
      try {
        const payload = {
          authorId: currentUser.id,
          type: "photo",
          title,
          content,
          image: customImageUrl.trim() || selectedImage.url,
          aircraftType: aircraftType || selectedImage.specs.split(" • ")[0],
          registration: registration || "N" + Math.floor(100 + Math.random() * 900) + "AV",
          airline: airline || "General Aviation",
          airport: airport || "KLAX"
        };

        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          setTitle("");
          setContent("");
          setAircraftType("");
          setRegistration("");
          setAirline("");
          setAirport("");
          setCustomImageUrl("");
          setShowAddModal(false);
          setErrorMsg("");
          onPostCreated();
        } else {
          const err = await res.json();
          setErrorMsg(err.error || "Failed to catalog spotting report.");
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Network link disconnected.");
      }
    });
  };

  const submitComment = (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    if (!currentUser) {
      alert("Authenticate to join cockpit discussions!");
      return;
    }

    onCommentAdded(postId, text);
    setCommentInputs(prev => ({ ...prev, [postId]: "" }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Feed Controls */}
      <div className="p-6 rounded-2xl border border-white/5 bg-[#080B10]/80 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold tracking-tight text-white font-sans">Radar Photo Stream</h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Displaying high-resolution avgeek photography with flight track telemetry.
          </p>
        </div>

        {currentUser ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-500 text-xs font-mono font-bold uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Spotting Log</span>
          </button>
        ) : (
          <button
            onClick={() => onNavigateToAuth?.("login")}
            className="px-4 py-2 border border-blue-500/30 rounded-lg bg-[#11161D] hover:bg-[#18202A] text-blue-400 hover:text-blue-300 text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/5 hover:border-blue-500/50"
          >
            <span>⚠️ Click to Sign-in & Post Spotting Logs</span>
          </button>
        )}
      </div>

      {/* Main Stream Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Photos Column */}
        <div className="lg:col-span-8 space-y-6">
          {posts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-white/5 bg-[#080B10]/30 font-mono text-slate-400">
              No flight spotting telemetry reports logged. Be the first to log a sighting!
            </div>
          ) : (
            posts.map((post) => {
              const isLiked = currentUser ? post.likes.includes(currentUser.id) : false;
              const isSaved = currentUser ? post.savedBy?.includes(currentUser.id) : false;

              return (
                <div
                  key={post.id}
                  className="bg-[#080B10]/90 border border-white/5 rounded-2xl overflow-hidden shadow-xl hover:border-white/10 transition-all font-sans"
                >
                  {/* Photo Head */}
                  <div className="p-4 border-b border-white/5 bg-[#05070A]/60 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                        <User className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white text-xs font-mono font-bold">@{post.authorUsername}</span>
                          <span className="text-[10px] uppercase px-1 rounded bg-[#11161D] text-slate-400 font-mono border border-white/5">
                            {post.authorCallsign}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">{post.authorLicense}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-400 block">
                        {new Date(post.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] font-mono text-blue-400 block">
                        {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* High-Res Photo Container */}
                  {post.image && (
                    <div className="relative group overflow-hidden bg-black aspect-video max-h-[420px] flex items-center justify-center border-b border-white/5">
                      <img
                        src={post.image}
                        alt={post.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      />
                      {/* Telemetry HUD overlay */}
                      <div className="absolute top-3 left-3 px-3 py-1.5 bg-[#05070A]/90 backdrop-blur-md rounded-lg border border-white/5 font-mono text-[10px] text-slate-350 space-y-0.5 shadow-md">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-blue-400" />
                          <span className="font-bold text-blue-400">{post.airport || "ENROUTE"}</span>
                        </div>
                        {post.aircraftType && (
                          <div className="text-white">TYPE: <span className="font-bold">{post.aircraftType}</span></div>
                        )}
                        {post.registration && (
                          <div className="text-slate-400">REG: <span className="text-slate-200">{post.registration}</span></div>
                        )}
                      </div>

                      {post.airline && (
                        <div className="absolute bottom-3 right-3 px-2 py-1 bg-blue-600 text-white font-mono font-bold text-[10px] uppercase tracking-wider rounded-md shadow-md shadow-blue-600/30">
                          {post.airline}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight leading-snug">{post.title}</h3>
                      <p className="text-slate-350 text-xs mt-2 leading-relaxed">{post.content}</p>
                    </div>

                    {/* Interactive Stats Panel */}
                    <div className="flex items-center space-x-6 py-2.5 px-4 rounded-xl bg-[#11161D] border border-white/5 font-mono text-xs">
                      <button
                        onClick={() => onLikeToggle(post.id)}
                        className={`flex items-center space-x-1.5 transition-colors cursor-pointer ${
                          isLiked ? "text-red-500 font-bold" : "text-slate-400 hover:text-red-500"
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500" : ""}`} />
                        <span>{post.likes.length} Likes</span>
                      </button>

                      <div className="flex items-center space-x-1.5 text-slate-400">
                        <MessageSquare className="w-4 h-4 text-blue-400" />
                        <span>{post.comments.length} Pilot Comments</span>
                      </div>

                      <button
                        onClick={() => onSaveToggle(post.id)}
                        className={`flex items-center space-x-1.5 transition-colors cursor-pointer ml-auto ${
                          isSaved ? "text-blue-400 font-bold" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <BookMarked className={`w-4 h-4 ${isSaved ? "fill-blue-500 text-blue-400" : "text-slate-400"}`} />
                        <span>{isSaved ? "Flight Bag Saved" : "Save Flight Bag"}</span>
                      </button>
                    </div>

                    {/* Comments section */}
                    <div className="border-t border-white/5 pt-4 space-y-3">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Cockpit Crew Logbook entries</h4>
                      <div className="max-h-[180px] overflow-y-auto space-y-2.5 pr-1 text-xs">
                        {post.comments.length === 0 ? (
                          <p className="text-slate-500 italic font-mono text-[11px]">No pilot deck comments. Initiate first communication.</p>
                        ) : (
                          post.comments.map((comment) => (
                            <div key={comment.id} className="p-2.5 rounded-lg bg-[#11161D]/50 border border-white/5">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5 font-mono text-[10px]">
                                  <span className="font-bold text-blue-400">@{comment.authorUsername}</span>
                                  <span className="text-slate-500 font-normal">({comment.authorCallsign})</span>
                                </div>
                                <span className="text-[9px] text-slate-400 font-mono">
                                  {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-350 font-sans text-xs">{comment.content}</p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Comment Input */}
                      {currentUser ? (
                        <div className="flex space-x-2 pt-2">
                          <input
                            type="text"
                            placeholder="Add logbook comment... (e.g. Squawk, flaps, runway info)"
                            value={commentInputs[post.id] || ""}
                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                            className="flex-1 bg-[#05070A] border border-white/5 text-white rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") submitComment(post.id);
                            }}
                          />
                          <button
                            onClick={() => submitComment(post.id)}
                            className="px-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 font-mono italic text-center py-2.5 border border-dashed border-white/5 rounded-lg bg-[#05070A]/25">
                          Please log in to leave cockpit feedback.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Spotting Guidelines Info Desk (Right) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-5 rounded-2xl border border-white/5 bg-[#080B10]/80 font-sans shadow-md">
            <h3 className="text-white font-bold text-sm tracking-wide mb-3 flex items-center gap-1.5 uppercase font-mono">
              <Compass className="w-4 h-4 text-blue-400" />
              <span>Spotter Checklist</span>
            </h3>
            <ul className="space-y-3.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <span><strong>No Telemetry Noise</strong>: PLEN focuses entirely on pure high-resolution actual aircraft spotted and captured by humans.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <span><strong>Provide Registrations</strong>: Aviation enthusiasts love tags. Be sure to catalog standard tail codes (like <em>N787UA</em>, <em>G-STBD</em>) for tail tracking.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <span><strong>Airport Airport Codes</strong>: Write standard 4-letter ICAO codes (e.g. <em>KJFK</em>, <em>EGLL</em>, <em>KLAX</em>, <em>RJTT</em>) for terminal databases.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <span><strong>Human Verified Policy</strong>: All logins are subjected to CAPTCHA cockpit checks. Real human posts only! No commercial spam.</span>
              </li>
            </ul>
          </div>

          {/* Quick Stats Widget */}
          <div className="p-5 rounded-2xl border border-white/5 bg-[#080B10]/80 font-mono text-xs shadow-md">
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">SQUAWK TELEMETRY HUB</h4>
            <div className="grid grid-cols-2 gap-3 text-white">
              <div className="p-2.5 rounded-xl bg-[#11161D] border border-white/5">
                <p className="text-slate-400 text-[10px] uppercase">Active Spotters</p>
                <p className="text-lg font-bold text-blue-400 mt-1">{posts.map(p => p.authorUsername).filter((v, i, a) => a.indexOf(v) === i).length + 3}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#11161D] border border-white/5">
                <p className="text-slate-400 text-[10px] uppercase">Total Logs</p>
                <p className="text-lg font-bold text-blue-400 mt-1">{posts.length}</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-[#11161D]/65 rounded-xl border border-white/5 text-[11px] text-slate-300 leading-relaxed font-sans">
              ✈️ <strong>Active Airspace</strong>: KJFK (New York Kennedy), EGLL (London Heathrow), KSMO (Santa Monica), KLAX (Los Angeles).
            </div>
          </div>
        </div>
      </div>

      {/* Spotting Submission Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#05070A]/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl border bg-[#080B10] border-white/10 rounded-2xl overflow-hidden shadow-2xl my-8">
            <div className="px-6 py-4.5 border-b border-white/5 bg-[#11161D] flex items-center justify-between">
              <h3 className="text-white text-base font-bold font-mono uppercase tracking-wide flex items-center gap-1.5">
                <Camera className="w-5 h-5 text-blue-400" />
                <span>Log New Aircraft Spotting</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-[10px] font-mono cursor-pointer uppercase tracking-wider"
              >
                [CANCEL]
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-xs font-mono">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Title & Description */}
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">Spot Sighting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SFO Final Approach - Singapore Airlines Airbus A350-901"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#11161D] border border-white/5 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">Spot description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Capture notes, flap settings, camera gear, runways, weather details..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-[#11161D] border border-white/5 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              {/* Photo Options */}
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">High-Res Aviation Image Preset</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-3.5">
                  {PRESET_HIGH_RES_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setImageIndex(idx);
                        setCustomImageUrl("");
                      }}
                      className={`relative aspect-video rounded-lg overflow-hidden border transition-all cursor-pointer ${
                        imageIndex === idx && !customImageUrl
                          ? "border-blue-500 ring-2 ring-blue-500/30 ring-offset-2 ring-offset-[#080B10] scale-95"
                          : "border-white/5 hover:border-white/20"
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-[#05070A]/40 hover:bg-transparent" />
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400">Current preset specs: </span>
                  <span className="text-[11px] font-mono font-bold text-blue-400">{PRESET_HIGH_RES_IMAGES[imageIndex].name}</span>
                </div>

                {/* Custom Image URL fallback */}
                <div className="mt-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400">Or custom High-Res Photo URL</span>
                  </div>
                  <input
                    type="url"
                    placeholder="Enter valid image URL (https://...)"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    className="w-full bg-[#11161D] border border-white/5 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Fields: Category Details */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#11161D]/50 p-4 rounded-xl border border-white/5">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-blue-400 shrink-0" />
                    <span>Aircraft Type</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Boeing 777"
                    value={aircraftType}
                    onChange={(e) => setAircraftType(e.target.value)}
                    className="w-full bg-[#05070A] border border-white/5 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <span className="font-bold text-blue-405 text-[10px]">T-</span>
                    <span>Tail Number</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. N104UA"
                    value={registration}
                    onChange={(e) => setRegistration(e.target.value)}
                    className="w-full bg-[#05070A] border border-white/5 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <span>Airline</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. United Airlines"
                    value={airline}
                    onChange={(e) => setAirline(e.target.value)}
                    className="w-full bg-[#05070A] border border-white/5 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                    <span>ICAO Airport</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KSFO"
                    value={airport}
                    onChange={(e) => setAirport(e.target.value)}
                    className="w-full bg-[#05070A] border border-white/5 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Submit panel */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-3">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 uppercase">
                  <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                  <span>Enforcing cockpit validation checks</span>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 font-mono text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 text-white font-mono font-bold uppercase rounded-lg hover:bg-blue-500 flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Catalog Spotting Log</span>
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
