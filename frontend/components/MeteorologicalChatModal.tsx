"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User, Sparkles, X, ShieldAlert, CheckCircle2, RotateCcw, Cpu } from "lucide-react";
import { askMeteorologicalCopilot } from "@/services/api";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStationId?: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: string[];
  model_used?: string;
  is_ai_agent?: boolean;
}

export const MeteorologicalChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  activeStationId
}) => {
  const initialGreeting: Message = {
    role: "assistant",
    content: "Welcome to the **WEATHERFUSION AI Autonomous Copilot**, powered by **Google Gemini 3.6 Flash**.\n\nI am grounded in live telemetry from **NOAA GFS**, **ECMWF IFS**, and **ECMWF AIFS Deep Learning**, alongside real-time **IMD warnings**. Ask any operational disaster response or forecast blending question.",
    citations: [
      "NOAA NCEP GFS 0.25° Physics Run",
      "ECMWF IFS 0.25° Physics Run & AIFS Deep Learning Model",
      "IMD Mausam Live Station Feed",
      "ECMWF ERA5 Historical Validation Archive"
    ],
    model_used: "gemini-3.6-flash",
    is_ai_agent: true
  };

  const [messages, setMessages] = useState<Message[]>([initialGreeting]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const quickQuestions = [
    "Why trust the blended forecast over GFS for Guwahati today?",
    "Which model is weighted highest for Meghalaya and why?",
    "What are the active flood or squall warnings in the North East?",
    "Explain how ECMWF AIFS deep learning compares to IFS physics.",
    "Recommend NDRF deployment actions for high rainfall zones."
  ];

  const handleClearChat = () => {
    setMessages([initialGreeting]);
  };

  const handleSend = async (queryText?: string) => {
    const text = queryText || input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    // Build history for multi-turn dialogue (skipping initial greeting)
    const historyPayload = messages.slice(1).map(m => ({
      role: m.role,
      content: m.content
    }));

    try {
      const data = await askMeteorologicalCopilot(text, activeStationId || 1, historyPayload);
      const botMsg: Message = {
        role: "assistant",
        content: data.response || "No response received.",
        citations: data.citations || [],
        model_used: data.model_used,
        is_ai_agent: data.is_ai_agent ?? true
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ **Service Communication Notice**: Unable to reach the meteorological intelligence backend. Please verify that `python scripts/run_server.py` is active on port 8000.",
          model_used: "system-offline",
          is_ai_agent: false
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, lIdx) => {
      // Headers
      if (line.startsWith("### ")) {
        return (
          <h4 key={lIdx} className="text-cyan-300 font-bold text-xs mt-3 mb-1 tracking-wide uppercase">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={lIdx} className="text-cyan-200 font-bold text-sm mt-3 mb-1 tracking-wide">
            {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("---")) {
        return <hr key={lIdx} className="border-slate-800 my-2" />;
      }

      // Format bold markdown
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-semibold text-cyan-200">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      // Bullets
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return (
          <div key={lIdx} className="flex items-start space-x-1.5 ml-2 my-0.5">
            <span className="text-cyan-400 mt-1 shrink-0 text-[10px]">•</span>
            <span className="flex-1">{formattedParts}</span>
          </div>
        );
      }

      return (
        <p key={lIdx} className={line.trim() === "" ? "h-2" : "my-0.5"}>
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl h-[700px] bg-[#0b111e] border border-cyan-500/30 rounded-2xl flex flex-col justify-between shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#1b273d] flex items-center justify-between bg-gradient-to-r from-[#0d1627] via-[#111c33] to-[#0d1627]">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm tracking-wide text-slate-100 flex items-center gap-1.5">
                  WEATHERFUSION AI COPILOT
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  Gemini 3.6 Flash
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  REAL-DATA GROUNDED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                AUTONOMOUS DISASTER INTELLIGENCE AGENT · ZERO HALLUCINATION · IMD & NWP TELEMETRY
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleClearChat}
              title="Reset Conversation"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1a263d] transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close Copilot"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs leading-relaxed custom-scrollbar">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${m.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                m.role === "user" 
                  ? "bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-cyan-600/30" 
                  : "bg-[#111c30] text-cyan-400 border border-cyan-500/30 shadow-black/50"
              }`}>
                {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-lg ${
                m.role === "user" 
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-50 border border-cyan-400/30 rounded-tr-none" 
                  : "bg-[#0e172a] text-slate-200 border border-[#1e2f4f] rounded-tl-none"
              }`}>
                <div className="text-[12px]">{renderFormattedContent(m.content)}</div>
                
                {/* Citations & Metadata */}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#1b2b45] text-[10px] font-mono text-slate-400 space-y-1">
                    <div className="flex items-center justify-between text-slate-500 font-semibold mb-1">
                      <span className="flex items-center gap-1 text-cyan-400/80">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Grounded Meteorological Citations:
                      </span>
                      {m.model_used && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                          {m.model_used}
                        </span>
                      )}
                    </div>
                    {m.citations.map((c, cIdx) => (
                      <div key={cIdx} className="text-slate-400/90 flex items-start space-x-1">
                        <span className="text-cyan-500 shrink-0">›</span>
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-3 text-cyan-300 font-mono text-xs pl-11 py-2">
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="animate-pulse">
                Gemini 3.6 Flash synthesizing multi-model NWP runs & IMD radar telemetry...
              </span>
            </div>
          )}
        </div>

        {/* Suggested Quick Queries */}
        <div className="px-4 py-2 bg-[#080d17] border-t border-[#162238] flex flex-wrap gap-1.5">
          <span className="text-[9px] font-mono text-slate-500 self-center mr-1">QUICK QUERIES:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-[#101a2e] hover:bg-cyan-500/20 text-cyan-300 border border-[#1b2a47] hover:border-cyan-500/50 transition duration-150"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-[#1b273d] bg-[#0a101d] flex items-center space-x-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask meteorological & disaster intelligence questions (e.g. Why is rainfall risk high in Assam?)..."
            className="flex-1 bg-[#10192b] border border-[#1d2d4a] rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-40 text-slate-950 font-bold transition shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="text-xs">Ask</span>
          </button>
        </div>
      </div>
    </div>
  );
};
