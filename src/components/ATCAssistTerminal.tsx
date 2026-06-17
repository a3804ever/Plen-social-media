/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { Terminal, Send, Compass, AlertTriangle, ShieldCheck } from "lucide-react";

interface ATCAssistProps {
  currentUser: any;
}

const PRESET_ASSISTS = [
  {
    label: "Verify Registration Codes",
    prompt: "Give me a quick reference of standard aircraft tail registration prefixes globally. E.g., N- stands for USA, G- stands for United Kingdom, what are others like F-, D-, JA-, VH-, PR-, B-? Lay them out in a neat checklist format."
  },
  {
    label: "Decode METAR Weather Reports",
    prompt: "Provide a quick, easy to understand guide on how to decode a standard aviation METAR report, focusing on variables like wind speed/gusts (e.g., 24015G25KT), ceiling conditions (e.g., BKN035), temperature/dewpoint (e.g., 18/12), and altimeter settings (A2992)."
  },
  {
    label: "Aviation Spec Quiz Assistance",
    prompt: "Tell me the core technical specifications (wing span, maximum takeoff weight MTOW, passenger capacity, cruising speed, and engine count) of the famous Aerospatiale/BAC Concorde Delta airliner."
  },
  {
    label: "Explain Wake Turbulence Guidelines",
    prompt: "Explain standard ATC wake turbulence guidelines and minimum separation times for light trainer aircraft (like Cessna 152/172) taking off immediately behind heavy category jetliners (like Boeing 777 or Airbus A380)."
  }
];

export default function ATCAssistTerminal({ currentUser }: ATCAssistProps) {
  const [promptInput, setPromptInput] = useState("");
  const [terminalOutput, setTerminalOutput] = useState<string>(
    "✈️ [SYSTEM INITIALIZED - PLEN RE-ALIGNMENT HUD]\n\nWelcome to your Flight Desk HUD & FMS Telemetry Terminal.\nInsert your aircraft spotting parameters, aircraft tail codes, METAR briefings, or engine maintenance inquiries into the cockpit transceiver.\n\nSQUAWK IDENT."
  );
  const [loading, setLoading] = useState(false);

  const handleQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    setLoading(true);
    setTerminalOutput(prev => prev + `\n\n>>> DISPATCH TRANSMITTING SIGNAL: "${queryText}"...\n`);
    
    try {
      const res = await fetch("/api/pilot/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: queryText,
          context: currentUser ? {
            username: currentUser.username,
            license: currentUser.licenseType,
            homeAirport: currentUser.homeAirport
          } : undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTerminalOutput(prev => prev + `\n----------------------- COCKPIT ATC RESPONSE -----------------------\n\n${data.response}`);
      } else {
        setTerminalOutput(prev => prev + `\n\n⚠️ ERROR: Radio link disconnected midway during dispatch. Setup actual GEMINI_API_KEY in Secrets for live assistant!`);
      }
    } catch (err) {
      console.error(err);
      setTerminalOutput(prev => prev + `\n\n⚠️ ERROR: Connection terminated. Standby for backup radio.`);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    const prompt = promptInput;
    if (!prompt.trim()) return;
    setPromptInput("");
    handleQuery(prompt);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      {/* Left sidebar widgets: shortcuts */}
      <div className="lg:col-span-4 space-y-4">
        <div className="p-5 rounded-2xl border border-white/5 bg-[#080B10]/80 backdrop-blur-sm shadow-md font-sans">
          <h3 className="text-white font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-1.5 mb-3">
            <Compass className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>ATC Flight Deck Dispatches</span>
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-4 font-sans">
            Quickly trigger standard aviation guidelines directly into your Flight computer.
          </p>

          <div className="space-y-2.5">
            {PRESET_ASSISTS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleQuery(preset.prompt)}
                disabled={loading}
                className="w-full text-left p-3 rounded-xl bg-[#11161D] hover:bg-[#18202A] border border-white/5 hover:border-blue-500/45 transition-all font-mono text-[10px] text-slate-300 flex items-start gap-2 cursor-pointer leading-tight"
              >
                <Terminal className="w-3.5 h-3.5 mt-0.5 text-blue-400 shrink-0" />
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Technical tips widgets */}
        <div className="p-5 rounded-2xl border border-white/5 bg-[#080B10]/95 font-mono text-[11px] text-slate-400 leading-relaxed shadow-sm space-y-2.5">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold uppercase text-[10px]">
            <AlertTriangle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>AI Radar Assist</span>
          </div>
          <p className="font-sans text-xs text-slate-300 leading-snug">
            Unsatisfied with mock fallback logs? Setup a real <strong>GEMINI_API_KEY</strong> in your Secrets panel to enable real-time pilot queries, airframe analytics, dynamic aviation logs and checklist calculations!
          </p>
          <div className="flex items-center justify-between border-t border-white/5 pt-2.5 text-[9px] text-slate-500 uppercase font-mono">
            <span>Model: gemini-2.5-flash</span>
            <span>Ground Station</span>
          </div>
        </div>
      </div>

      {/* Right side: terminal screen */}
      <div className="lg:col-span-8 space-y-4">
        <div className="border border-white/5 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[480px] bg-[#080B10]/80">
          {/* Terminal Screen Header */}
          <div className="px-5 py-3 border-b border-white/5 bg-[#11161D]/50 flex items-center justify-between font-mono text-[10px]">
            <div className="flex items-center space-x-2 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
              <span className="font-bold uppercase tracking-wider">PLEN COCKPIT FLIGHT DESK CO-PILOT HUD</span>
            </div>
            <div className="text-slate-400 uppercase font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>LINK ACTIVE</span>
            </div>
          </div>

          {/* Core Readout Area */}
          <div className="flex-1 p-5 overflow-y-auto font-mono text-xs text-blue-400 leading-relaxed bg-[#05070A] prose-invert scrollbar-thin select-text">
            <pre className="font-mono text-cyan-400 whitespace-pre-wrap font-medium">{terminalOutput}</pre>
            {loading && (
              <div className="flex items-center gap-2 text-cyan-400 animate-pulse mt-4">
                <span className="animate-spin text-cyan-400">⚡</span>
                <span>RECEIVING ATC TELEMETRY TRANSMISSION... STANDBY FOR RADIO PACKETS...</span>
              </div>
            )}
          </div>

          {/* Form Command bar */}
          <form onSubmit={handleFormSubmit} className="p-3 border-t border-white/5 bg-[#11161D]/80 flex gap-2">
            <input
              type="text"
              disabled={loading}
              placeholder="Inject cockpit parameter query... (e.g., 'What is standard flap setting for Boeing 737 short field takeoff?')"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              className="flex-1 bg-[#080B10] text-cyan-400 border border-white/5 rounded-lg px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-blue-500 placeholder:text-slate-600 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !promptInput.trim()}
              className="px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono font-bold uppercase text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-blue-600"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
