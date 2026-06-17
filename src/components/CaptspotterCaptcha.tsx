/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Check, ShieldAlert, Award, Plane, Camera, HelpCircle } from "lucide-react";

interface CaptchaProps {
  onVerify: () => void;
  onCancel: () => void;
}

interface AirplaneQuiz {
  question: string;
  options: { id: string; name: string; isCorrect: boolean; desc: string; image: string }[];
}

const AIRPLANE_QUIZZES: AirplaneQuiz[] = [
  {
    question: "Identify the 'Queen of the Skies' - Boeing 747 with its signature upper-deck hump:",
    options: [
      {
        id: "a320",
        name: "Airbus A320-200",
        desc: "Single-aisle workhorse, twin engines, flat tail design.",
        isCorrect: false,
        image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=300"
      },
      {
        id: "b747",
        name: "Boeing 747-8i",
        desc: "Vast quad-jet airliner featuring the legendary partial double-deck hump.",
        isCorrect: true,
        image: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=300"
      },
      {
        id: "f35",
        name: "Lockheed F-35 Lightning II",
        desc: "Fifth-generation single-engine supersonic stealth fighter jet.",
        isCorrect: false,
        image: "https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?auto=format&fit=crop&q=80&w=300"
      }
    ]
  },
  {
    question: "Identify the supersonic Concorde, featuring its iconic droop nose and delta wings:",
    options: [
      {
        id: "concorde",
        name: "Aérospatiale/BAC Concorde",
        desc: "Supersonic passenger delta-wing airliner with a steerable droop-snoot nose.",
        isCorrect: true,
        image: "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&q=80&w=300"
      },
      {
        id: "c172",
        name: "Cessna 172 Skyhawk",
        desc: "High-wing, single-engine light general aviation aircraft.",
        isCorrect: false,
        image: "https://images.unsplash.com/photo-1508849789987-4e5333c12b78?auto=format&fit=crop&q=80&w=300"
      },
      {
        id: "b777",
        name: "Boeing 777-300ER",
        desc: "World's largest twin-engine widebody, huge GE90 turbofans.",
        isCorrect: false,
        image: "https://images.unsplash.com/photo-1517999144091-3d9dca6d1e43?auto=format&fit=crop&q=80&w=300"
      }
    ]
  }
];

export default function CaptspotterCaptcha({ onVerify, onCancel }: CaptchaProps) {
  const [selectedQuizIndex] = useState(() => Math.floor(Math.random() * AIRPLANE_QUIZZES.length));
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const quiz = AIRPLANE_QUIZZES[selectedQuizIndex];

  const handleSubmit = () => {
    if (!selectedOption) {
      setErrorMsg("Please select an aircraft to prove you are an AvGeek human.");
      return;
    }

    const choice = quiz.options.find(o => o.id === selectedOption);
    if (choice && choice.isCorrect) {
      setErrorMsg(null);
      setIsDone(true);
      setTimeout(() => {
        onVerify();
      }, 1200);
    } else {
      setErrorMsg("Negative contact, pilot! That is the wrong airframe. Try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl border bg-slate-900 border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Header HUD */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-amber-500 font-mono tracking-wider">
            <Camera className="w-5 h-5 text-amber-500" />
            <span className="font-bold uppercase text-sm">CapSpotter™ Human Radar Verification</span>
          </div>
          <span className="px-2 py-0.5 text-xs rounded bg-amber-500/10 text-amber-500 font-mono">
            SQUAWK 7001
          </span>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4 text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800/60 pb-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>Anti-Bot Cockpit Integration • Real Humans Only</span>
          </div>

          <h3 className="text-white font-medium text-base mb-4 font-sans text-slate-100 flex items-start gap-1.5">
            <HelpCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <span>{quiz.question}</span>
          </h3>

          <div className="grid grid-cols-1 gap-3.5 mb-6">
            {quiz.options.map((option) => (
              <label
                key={option.id}
                className={`relative flex items-center gap-4 p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedOption === option.id
                    ? "border-amber-500 bg-slate-800/75 ring-1 ring-amber-500/40"
                    : "border-slate-800 bg-slate-950 hover:bg-slate-800/40"
                }`}
              >
                <input
                  type="radio"
                  name="airplane-spot"
                  value={option.id}
                  checked={selectedOption === option.id}
                  onChange={() => setSelectedOption(option.id)}
                  className="sr-only"
                />

                <img
                  src={option.image}
                  alt={option.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded object-cover border border-slate-800 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-mono font-semibold text-xs leading-none ${selectedOption === option.id ? "text-amber-500" : "text-white"}`}>
                      {option.name}
                    </p>
                    {selectedOption === option.id && (
                      <span className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 shrink-0">
                        <Check className="w-3 h-3 stroke-[3px]" />
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs mt-1 text-slate-300 font-sans leading-relaxed">
                    {option.desc}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {errorMsg && (
            <div className="p-3 mb-4 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isDone && (
            <div className="p-3 mb-4 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center gap-2 animate-pulse">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Identity Verified. Transponder Squawking Normal. Welcome aboard!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800/80">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-xs font-mono font-medium rounded hover:bg-slate-800 text-slate-400 transition-all border border-transparent hover:border-slate-800"
            >
              Cancel Clearance
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-mono font-bold uppercase rounded flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
              disabled={isDone}
            >
              <Award className="w-4 h-4" />
              <span>Submit Captspotter Verification</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
