/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from "react";
import { Post, ForumThread, ForumCategory, SyncDevice, PilotProfile } from "./types";
import AircraftSpotterFeed from "./components/AircraftSpotterFeed";
import PilotDiscussionForum from "./components/PilotDiscussionForum";
import ConnectedDevicesHub from "./components/ConnectedDevicesHub";
import ATCAssistTerminal from "./components/ATCAssistTerminal";
import CaptspotterCaptcha from "./components/CaptspotterCaptcha";

import {
  Plane,
  Camera,
  Layers,
  BookOpen,
  Terminal as TerminalIcon,
  Heart,
  BookMarked,
  User,
  LogOut,
  LogIn,
  Sliders,
  CheckCircle2,
  Lock,
  Compass,
  Award,
  Clock,
  Menu,
  X,
  UserCheck
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"stream" | "forum" | "sync" | "atc" | "flightbag" | "auth">("stream");
  const [posts, setPosts] = useState<Post[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [devices, setDevices] = useState<SyncDevice[]>([]);
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<PilotProfile | null>(() => {
    const saved = localStorage.getItem("plen_pilot");
    return saved ? JSON.parse(saved) : null;
  });
  const [authState, setAuthState] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [callsign, setCallsign] = useState("");
  const [homeAirport, setHomeAirport] = useState("KJFK");
  const [licenseType, setLicenseType] = useState<any>("Aviation Spotter");
  const [simHours, setSimHours] = useState<number>(120);
  const [authErrorMsg, setAuthErrorMsg] = useState("");

  // CAPTCHA callback triggers
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaCallback, setCaptchaCallback] = useState<(() => void) | null>(null);

  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // System Local UTC live clock simulation
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace("GMT", "Z"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Hydrate lists from backend APIs
  const fetchAllTelemetry = async () => {
    try {
      // Parallelize REST queries
      const [postsRes, threadsRes, catRes, devRes] = await Promise.all([
        fetch("/api/posts"),
        fetch("/api/forums/threads"),
        fetch("/api/forums"),
        fetch("/api/devices")
      ]);

      if (postsRes.ok) {
        const d = await postsRes.json();
        setPosts(d.posts);
      }
      if (threadsRes.ok) {
        const d = await threadsRes.json();
        setThreads(d.threads);
      }
      if (catRes.ok) {
        const d = await catRes.json();
        setCategories(d.categories);
      }
      if (devRes.ok) {
        const d = await devRes.json();
        setDevices(d.devices);
      }
    } catch (err) {
      console.error("Link warning: Flight computers unable to hydrate, using fallback data presets.", err);
    }
  };

  useEffect(() => {
    fetchAllTelemetry();
  }, [currentUser]);

  // Handle Captcha
  const triggerCaptchaCheck = (callback: () => void) => {
    setCaptchaCallback(() => callback);
    setShowCaptcha(true);
  };

  const handleCaptchaVerifySuccess = () => {
    setShowCaptcha(false);
    if (captchaCallback) {
      captchaCallback();
      setCaptchaCallback(null);
    }
  };

  // Auth operations
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setAuthErrorMsg("Transmit credentials!");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        localStorage.setItem("plen_pilot", JSON.stringify(data.user));
        setAuthErrorMsg("");
        setUsername("");
        setPassword("");
        setActiveTab("stream");
      } else {
        const err = await res.json();
        setAuthErrorMsg(err.error || "Login denied.");
      }
    } catch (err) {
      setAuthErrorMsg("Network line dead.");
    }
  };

  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password || !callsign) {
      setAuthErrorMsg("Credentials missing!");
      return;
    }

    // Capture registration captcha before persisting
    triggerCaptchaCheck(async () => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            password,
            callsign,
            licenseType,
            homeAirport: homeAirport || "KJFK",
            simHours: Number(simHours) || 0
          })
        });

        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          localStorage.setItem("plen_pilot", JSON.stringify(data.user));
          setAuthErrorMsg("");
          setUsername("");
          setPassword("");
          setCallsign("");
          setHomeAirport("KJFK");
          setActiveTab("stream");
        } else {
          const err = await res.json();
          setAuthErrorMsg(err.error || "Aircraft registration failed.");
        }
      } catch (err) {
        setAuthErrorMsg("Aeronautical channel transmission error.");
      }
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("plen_pilot");
    setActiveTab("stream");
  };

  // Like Toggle
  const handleLikeToggle = async (postId: string) => {
    if (!currentUser) {
      alert("Authenticate license to log post likes.");
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });

      if (res.ok) {
        fetchAllTelemetry();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save/Bookmark Toggle
  const handleSaveToggle = async (postId: string) => {
    if (!currentUser) {
      alert("Please authenticate to save listings into your Flight Bag.");
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });

      if (res.ok) {
        fetchAllTelemetry();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Comment
  const handleCommentAdded = async (postId: string, content: string) => {
    if (!currentUser) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, content })
      });

      if (res.ok) {
        fetchAllTelemetry();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Device Sync
  const handleDeviceSync = async (deviceId: string) => {
    try {
      const res = await fetch("/api/devices/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deviceId })
      });

      if (res.ok) {
        const d = await res.json();
        setDevices(d.devices);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter saved posts for Flight Bag
  const savedPosts = posts.filter(post => currentUser && post.savedBy?.includes(currentUser.id));

  return (
    <div className="min-h-screen bg-[#05070A] bg-gradient-to-b from-[#0A0E14] to-[#05070A] text-slate-200 flex flex-col font-sans select-none antialiased">
      {/* Top Banner Heads-Up-Display HUD */}
      <header className="sticky top-0 z-30 bg-[#080B10]/95 backdrop-blur-md border-b border-white/5 px-4 py-3 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <Plane className="w-5 h-5 text-white font-extrabold rotate-45" />
            </div>
            <div>
              <span className="font-mono font-black text-lg tracking-widest text-white">PLEN</span>
              <span className="text-[9px] text-blue-400 font-mono tracking-wider block leading-none uppercase">IMMERSED COCKPIT LINK</span>
            </div>
          </div>

          {/* SQUAWK Telemetry UTC Clock (Middle Desktop) */}
          <div className="hidden md:flex items-center space-x-6 text-xs text-slate-400 font-mono border-x border-white/5 px-6">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>UTC : <strong className="text-white">{utcTime || "Z"}</strong></span>
            </div>
            <div>
              <span>SQUAWK : <strong className="text-blue-500">7000 (VFR)</strong></span>
            </div>
          </div>

          {/* Navigation & Controls Desktop */}
          <nav className="hidden lg:flex items-center space-x-1 p-1 bg-white/5 border border-white/5 rounded-lg">
            <button
              onClick={() => setActiveTab("stream")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-mono uppercase font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "stream" ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] border-l border-white/10" : "text-slate-400 hover:text-white"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>RADAR STREAM</span>
            </button>
            <button
              onClick={() => setActiveTab("forum")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-mono uppercase font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "forum" ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] border-l border-white/10" : "text-slate-400 hover:text-white"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>PILOT FORUM</span>
            </button>
            <button
              onClick={() => setActiveTab("atc")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-mono uppercase font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "atc" ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] border-l border-white/10" : "text-slate-400 hover:text-white"
              }`}
            >
              <TerminalIcon className="w-3.5 h-3.5" />
              <span>FMS ASSIST</span>
            </button>
            <button
              onClick={() => setActiveTab("sync")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-mono uppercase font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "sync" ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] border-l border-white/10" : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>DEVICES ({devices.length})</span>
            </button>
            {currentUser && (
              <button
                onClick={() => setActiveTab("flightbag")}
                className={`px-3.5 py-1.5 rounded-md text-xs font-mono uppercase font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "flightbag" ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] border-l border-white/10" : "text-slate-400 hover:text-white"
                }`}
              >
                <BookMarked className="w-3.5 h-3.5" />
                <span>FLIGHT BAG ({savedPosts.length})</span>
              </button>
            )}
          </nav>

          {/* Pilot Account Controls Desktop */}
          <div className="hidden lg:flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="text-right border-r border-white/5 pr-3 font-mono">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="font-bold text-white leading-none">{currentUser.username}</span>
                    <span className="p-0.5 rounded bg-blue-500/10 text-blue-400 text-[8px] tracking-widest uppercase font-bold border border-blue-500/20">
                      HUMAN
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block leading-none mt-1">
                    {currentUser.callsign} • {currentUser.licenseType}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 bg-white/5 border border-white/5 hover:border-red-500/40 hover:text-red-400 rounded-md transition-all cursor-pointer"
                  title="Logout pilot deck"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab("auth") || setAuthState("login")}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:text-blue-400 rounded-md font-mono text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <LogIn className="w-4 h-4" />
                <span>Pilot Sign-in</span>
              </button>
            )}
          </div>

          {/* Mobile menu triggers */}
          <div className="flex items-center space-x-3 lg:hidden">
            {currentUser && (
              <span className="text-[10px] font-mono font-bold text-blue-400 border border-white/10 px-2 py-0.5 rounded bg-white/5 block">
                {currentUser.username}
              </span>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-[#080B10] border border-white/5 hover:border-white/20 rounded text-slate-300 transition-all cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav className="mt-3 py-3 border-t border-white/5 grid grid-cols-2 gap-2 lg:hidden anime-fade-in">
            <button
              onClick={() => setActiveTab("stream") || setMobileMenuOpen(false)}
              className={`p-3 rounded-lg text-xs font-mono uppercase font-bold flex flex-col items-center justify-center gap-1.5 border transition-all ${
                activeTab === "stream" ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-[#080B10] text-slate-400 border-white/5"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Stream</span>
            </button>
            <button
              onClick={() => setActiveTab("forum") || setMobileMenuOpen(false)}
              className={`p-3 rounded-lg text-xs font-mono uppercase font-bold flex flex-col items-center justify-center gap-1.5 border transition-all ${
                activeTab === "forum" ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-[#080B10] text-slate-400 border-white/5"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Forum</span>
            </button>
            <button
              onClick={() => setActiveTab("atc") || setMobileMenuOpen(false)}
              className={`p-3 rounded-lg text-xs font-mono uppercase font-bold flex flex-col items-center justify-center gap-1.5 border transition-all ${
                activeTab === "atc" ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-[#080B10] text-slate-400 border-white/5"
              }`}
            >
              <TerminalIcon className="w-4 h-4" />
              <span>Assist</span>
            </button>
            <button
              onClick={() => setActiveTab("sync") || setMobileMenuOpen(false)}
              className={`p-3 rounded-lg text-xs font-mono uppercase font-bold flex flex-col items-center justify-center gap-1.5 border transition-all ${
                activeTab === "sync" ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-[#080B10] text-slate-400 border-white/5"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Devices</span>
            </button>
            {currentUser && (
              <button
                onClick={() => setActiveTab("flightbag") || setMobileMenuOpen(false)}
                className={`p-3 rounded-lg text-xs font-mono uppercase font-bold flex flex-col items-center justify-center gap-1.5 border transition-all col-span-2 ${
                  activeTab === "flightbag" ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-[#080B10] text-slate-400 border-white/5"
                }`}
              >
                <BookMarked className="w-4 h-4" />
                <span>My Bookmarked Flight Bag ({savedPosts.length})</span>
              </button>
            )}

            {!currentUser ? (
              <button
                onClick={() => { setActiveTab("auth"); setAuthState("login"); setMobileMenuOpen(false); }}
                className="p-3 bg-[#11161D] border border-white/5 rounded-lg text-xs font-mono font-bold uppercase hover:bg-white/10 text-blue-400 text-center col-span-2 cursor-pointer"
              >
                Sign-in Pilot Account
              </button>
            ) : (
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="p-3 bg-red-950/20 border border-red-500/20 rounded-lg text-xs font-mono font-bold uppercase hover:bg-red-950/40 text-red-400 text-center col-span-2 cursor-pointer"
              >
                Logout Active Pilot
              </button>
            )}
          </nav>
        )}
      </header>

      {/* Primary Cockpit Stage */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:px-8">
        
        {/* Radar Telemetry Live ticker if streaming */}
        {activeTab === "stream" && (
          <div className="mb-6 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20 text-xs font-mono text-blue-400 flex items-center justify-between animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.05)]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,1)]" />
              <span>LIVE AIRSPACE CHANNELS ONLINE • RADAR VERIFIED HUMANS ONLY</span>
            </span>
            <span className="text-[10px] uppercase">Frequency 122.8 MHz</span>
          </div>
        )}

        {/* ================= REZ CORE SCREEN ROUTING ================= */}
        
        {activeTab === "stream" && (
          <AircraftSpotterFeed
            posts={posts}
            currentUser={currentUser}
            onPostCreated={fetchAllTelemetry}
            onLikeToggle={handleLikeToggle}
            onSaveToggle={handleSaveToggle}
            onCommentAdded={handleCommentAdded}
            triggerCaptcha={triggerCaptchaCheck}
            onNavigateToAuth={(mode) => {
              setActiveTab("auth");
              setAuthState(mode);
            }}
          />
        )}

        {activeTab === "forum" && (
          <PilotDiscussionForum
            categories={categories}
            threads={threads}
            currentUser={currentUser}
            onThreadCreated={fetchAllTelemetry}
            onReplyAdded={fetchAllTelemetry}
            triggerCaptcha={triggerCaptchaCheck}
            onNavigateToAuth={(mode) => {
              setActiveTab("auth");
              setAuthState(mode);
            }}
          />
        )}

        {activeTab === "atc" && (
          <ATCAssistTerminal currentUser={currentUser} />
        )}

        {activeTab === "sync" && (
          <ConnectedDevicesHub devices={devices} onSyncDevice={handleDeviceSync} />
        )}

        {/* Saved Flight Bag Module */}
        {activeTab === "flightbag" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-white/5 bg-[#080B10]/80 font-sans shadow-md">
              <div className="flex items-center space-x-2">
                <BookMarked className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold tracking-tight text-white">Pilot Saved Flight Bag</h2>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Your private log of bookmarked spotter posts, aircraft specifications, and flight telemetry.
              </p>
            </div>

            {savedPosts.length === 0 ? (
              <div className="p-16 border border-white/5 border-dashed text-center rounded-2xl bg-white/5 text-slate-400 font-mono text-xs">
                ⚠️ Empty Flight Bag list. Bookmark/Save posts in the Radar stream to preserve them here.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                {savedPosts.map(post => (
                  <div key={post.id} className="border border-white/5 rounded-2xl bg-[#080B10]/60 overflow-hidden flex flex-col hover:border-white/10 transition-all shadow-lg">
                    {post.image && (
                      <div className="aspect-video relative overflow-hidden h-44 bg-black">
                        <img src={post.image} alt={post.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-[#05070A] text-blue-400 font-mono text-[9px] rounded border border-white/5">
                          {post.airport || "ENROUTE"}
                        </span>
                      </div>
                    )}
                    
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block mb-1">
                          Spotted by @{post.authorUsername} ({post.authorLicense})
                        </span>
                        <h4 className="text-sm font-bold text-white tracking-tight leading-snug line-clamp-2">{post.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-3 mt-2">{post.content}</p>
                      </div>

                      <div className="flex gap-2 font-mono text-[10px] text-slate-400 border-t border-white/5 pt-3 flex-wrap">
                        {post.aircraftType && <span className="bg-[#11161D] px-1.5 py-0.5 rounded text-white border border-white/5">{post.aircraftType}</span>}
                        {post.registration && <span className="bg-[#11161D] px-1.5 py-0.5 rounded text-slate-300 border border-white/5">REG: {post.registration}</span>}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => handleSaveToggle(post.id)}
                          className="text-[10px] font-mono text-red-400 hover:text-red-300 uppercase tracking-wider cursor-pointer"
                        >
                          [REMOVE BOOKMARK]
                        </button>
                        <button
                          onClick={() => setActiveTab("stream")}
                          className="text-[10px] font-mono text-blue-400 hover:text-blue-300 uppercase tracking-wider cursor-pointer"
                        >
                          [VIEW IN STREAM]
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Authentication View Screen */}
        {activeTab === "auth" && (
          <div className="max-w-md mx-auto my-12 border border-white/5 bg-[#080B10] rounded-2xl overflow-hidden shadow-2xl font-sans">
            <div className="px-6 py-5 border-b border-white/5 bg-[#11161D] text-center">
              <Plane className="w-8 h-8 mx-auto text-blue-500 rotate-45 mb-1.5 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
              <h2 className="text-white text-base font-bold font-mono tracking-widest uppercase">PLEN Dispatch Gate</h2>
              <p className="text-[10px] text-blue-400 font-mono tracking-wider">ENLIST TO TRANSMIT SPOTTING TELEMETRY</p>
            </div>

            <div className="p-6">
              {authErrorMsg && (
                <div className="p-3 mb-4 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                  ⚠️ {authErrorMsg}
                </div>
              )}

              {authState === "login" ? (
                /* LOGIN FORM */
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Pilot Flight-Log Username</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CaptainSpeedbird"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#11161D] border border-white/5 text-white rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500/50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Access Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#11161D] border border-white/5 text-white rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500/50"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 text-white hover:bg-blue-500 rounded font-mono font-bold uppercase text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20 mt-6"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Authorize Deck Session</span>
                  </button>

                  <div className="text-center pt-4 border-t border-white/5 mt-4 text-xs font-sans text-slate-400">
                    New crew member?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthState("register") || setAuthErrorMsg("")}
                      className="text-blue-400 font-mono hover:underline cursor-pointer"
                    >
                      [REGISTER FLIGHT LICENSE]
                    </button>
                  </div>
                </form>
              ) : (
                /* REGISTRATION FORM */
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Desired Spotter Username *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DreamlinerPhoto"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#11161D] border border-white/5 text-white rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500/50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Radio Callsign / Nickname *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Clipper 101"
                      value={callsign}
                      onChange={(e) => setCallsign(e.target.value)}
                      className="w-full bg-[#11161D] border border-white/5 text-white rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500/50 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Sim Hours Logged</label>
                      <input
                        type="number"
                        placeholder="150"
                        value={simHours}
                        onChange={(e) => setSimHours(Number(e.target.value))}
                        className="w-full bg-[#11161D] border border-white/5 text-white rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500/50 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Home Airport (ICAO)</label>
                      <input
                        type="text"
                        placeholder="KLAX"
                        value={homeAirport}
                        onChange={(e) => setHomeAirport(e.target.value.toUpperCase())}
                        className="w-full bg-[#11161D] border border-white/5 text-white rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500/50 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Aviator Certificate Class *</label>
                    <select
                      value={licenseType}
                      onChange={(e) => setLicenseType(e.target.value)}
                      className="w-full bg-[#11161D] border border-white/5 text-slate-100 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500/50 font-sans"
                    >
                      <option value="Aviation Spotter">Aviation Spotter / Runway Enthusiast</option>
                      <option value="Student">Student Pilot</option>
                      <option value="Private Pilot (PPL)">Private Pilot Certificate (PPL)</option>
                      <option value="Commercial Pilot (CPL)">Commercial Pilot Certificate (CPL)</option>
                      <option value="Airline Transport (ATP)">Airline Transport Pilot (ATP)</option>
                      <option value="Military Aviator">Military Aviator / Jet Fighter Instructor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Secure Deck Key Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#11161D] border border-white/5 text-white rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500/50"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 text-white hover:bg-blue-500 rounded font-mono font-bold uppercase text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20 mt-6"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Run SQUAWK CAPTCHA & Register</span>
                  </button>

                  <div className="text-center pt-4 border-t border-white/5 mt-4 text-xs font-sans text-slate-400">
                    Existing active aviator?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthState("login") || setAuthErrorMsg("")}
                      className="text-blue-400 font-mono hover:underline cursor-pointer"
                    >
                      [GOTO COCKPIT SIGN-IN]
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Playful aeronautical Captspotter Captcha Popup Overlay */}
      {showCaptcha && (
        <CaptspotterCaptcha
          onVerify={handleCaptchaVerifySuccess}
          onCancel={() => {
            setShowCaptcha(false);
            setCaptchaCallback(null);
          }}
        />
      )}

      {/* Aviation dashboard cockpit footer */}
      <footer className="mt-auto border-t border-white/5 bg-[#080B10] text-[#4F5B66] text-xs py-5 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-[10px]">
          <div>
            <span>© 2026 PLEN SOCIAL DIRECTORY. VERIFIED HUMANS ONLY.</span>
            <span className="block text-slate-500 mt-1 uppercase font-semibold">Capped with SimConnect protocols. All devices synchronized seamlessly over Secure handshakes.</span>
          </div>

          <div className="flex items-center space-x-4 text-slate-400 flex-wrap">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,1)]" />MAHO BEACH LINK ACTIVE</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />SECURE handshakes</span>
            <span className="text-[#343D46]">v1.2.0-Prod</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
