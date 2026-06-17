/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { SyncDevice } from "../types";
import { Laptop, Smartphone, Monitor, Globe, RefreshCw, Layers, CheckCircle2, QrCode, Download, ShieldCheck, Wifi } from "lucide-react";

interface SyncHubProps {
  devices: SyncDevice[];
  onSyncDevice: (deviceId: string) => void;
}

export default function ConnectedDevicesHub({ devices, onSyncDevice }: SyncHubProps) {
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncCode] = useState(() => "PLEN-" + Math.floor(1000 + Math.random() * 9000) + "-AV");
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  const runSyncSimulation = (id: string) => {
    setSyncingId(id);
    setTimeout(() => {
      onSyncDevice(id);
      setSyncingId(null);
    }, 1500);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "PC":
        return <Monitor className="w-5 h-5 text-blue-400" />;
      case "Mac":
        return <Laptop className="w-5 h-5 text-cyan-400" />;
      case "iOS":
      case "Android":
        return <Smartphone className="w-5 h-5 text-emerald-400" />;
      default:
        return <Globe className="w-5 h-5 text-blue-400" />;
    }
  };

  const handleDownloadSimulation = (platform: string) => {
    setDownloadMsg(`Initializing simulated download: ${platform} package container with SimConnect bridges is compiling...`);
    setTimeout(() => {
      setDownloadMsg(null);
    }, 3800);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl border border-white/5 bg-[#080B10]/80 backdrop-blur-md shadow-md">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold tracking-tight text-white">Full-Stack Device Synchronization Hub</h2>
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1 leading-relaxed">
          Active cockpit accounts sync profile, post, and saved flight bag telemetry across PC, Mac, iOS, Android, and Web clients.
        </p>
      </div>

      {downloadMsg && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-white rounded-xl text-xs font-mono animate-pulse flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{downloadMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Device Sync List Panel */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-4 border border-white/5 bg-[#080B10]/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span>Cockpit synchronization connections</span>
            </span>
            <span className="px-2 py-0.5 text-[9px] rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono uppercase text-center sm:text-left">
              Server link: Established (0.0.0.0:3000)
            </span>
          </div>

          <div className="space-y-3">
            {devices.map((device) => {
              const isSyncing = syncingId === device.id;
              return (
                <div
                  key={device.id}
                  className="p-5 rounded-2xl border border-white/5 bg-[#080B10]/80 hover:bg-[#11161D]/80 hover:border-blue-500/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#05070A] rounded-xl border border-white/5 shrink-0">
                      {getPlatformIcon(device.platform)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white leading-none">{device.name}</h4>
                        <span className={`px-1.5 py-0.5 text-[9px] rounded font-mono uppercase font-bold ${
                          device.status === "Online"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}>
                          {device.status}
                        </span>
                      </div>
                      
                      <div className="text-[11px] font-mono text-slate-400 space-x-3">
                        <span>Platform: <strong className="text-slate-300">{device.platform}</strong></span>
                        <span>IP: <strong className="text-slate-300">{device.ipAddress}</strong></span>
                      </div>

                      <p className="text-[10px] text-slate-400 font-mono">
                        Last Handshake Check: <span className="text-blue-400">{new Date(device.lastSync).toLocaleTimeString()}</span> ({new Date(device.lastSync).toLocaleDateString()})
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => runSyncSimulation(device.id)}
                    disabled={isSyncing}
                    className={`px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all border shrink-0 cursor-pointer ${
                      isSyncing
                        ? "bg-slate-800 text-slate-500 border-slate-700 animate-pulse"
                        : "bg-[#11161D] hover:bg-blue-600 hover:border-blue-500 text-blue-400 hover:text-white border-white/5 shadow"
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                    <span>{isSyncing ? "Aligning Gears..." : "Request Instant Sync"}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Synchronizer telemetry stats */}
          <div className="p-5 rounded-2xl border border-white/5 bg-[#080B10]/95 flex flex-col md:flex-row items-start md:items-center gap-4 shadow-md">
            <QrCode className="w-16 h-16 text-slate-400 shrink-0 border border-white/5 p-2.5 rounded-xl bg-[#05070A]" />
            <div className="space-y-1.5 flex-1">
              <h4 className="text-white text-xs font-mono uppercase tracking-wider font-semibold">Instant Flight Sync Link Code</h4>
              <p className="text-[11px] text-slate-400 font-sans leading-normal">
                Enter this sequence code on any secondary desktop or mobile client runtime (PC/Mac/iOS/Android) to hook into this live cloud database.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 bg-[#11161D] border border-white/5 text-blue-400 font-mono font-bold text-xs rounded-lg tracking-widest">{syncCode}</span>
                <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest animate-pulse flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Generating tokens...</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sync technology info card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-5 rounded-2xl border border-white/5 bg-[#080B10]/90 space-y-4 shadow-md">
            <h3 className="text-white font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Multiplatform Client Builders</span>
            </h3>
            
            <p className="text-slate-300 text-xs font-sans leading-relaxed">
              PLEN architecture compiles natively across multiple targets utilizing the cross-platform electron shell and customized PWA app containers.
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#11161D] rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-white font-mono font-bold block text-[11px]">PLEN Desktop (PC/Mac)</span>
                  <span className="text-[10px] text-slate-400 block font-mono">v1.2.0 • Electron • SimConnect</span>
                </div>
                <button
                  onClick={() => handleDownloadSimulation("PLEN Desktop (PC/Mac)")}
                  className="p-2 bg-[#05070A] rounded-lg border border-white/5 hover:border-blue-500 text-blue-400 hover:text-white cursor-pointer transition-all"
                  title="Simulate PC/Mac Build"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 bg-[#11161D] rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-white font-mono font-bold block text-[11px]">PLEN Mobile (iOS/Android)</span>
                  <span className="text-[10px] text-slate-400 block font-mono">v1.1.5 • Capacitor SDK • GPS</span>
                </div>
                <button
                  onClick={() => handleDownloadSimulation("PLEN Mobile (iOS/Android)")}
                  className="p-2 bg-[#05070A] rounded-lg border border-white/5 hover:border-blue-500 text-emerald-400 hover:text-white cursor-pointer transition-all"
                  title="Simulate Mobile Build"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-3 bg-[#05070A] rounded-xl border border-white/5 text-[10px] font-mono text-slate-400 leading-relaxed">
              <strong>Offline-First Synchronization</strong>: If a device loses internet coverage during mid-flight climbs, coordinates can be saved locally and pushed instantly to the global database as soon as transponder links reconnect.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
