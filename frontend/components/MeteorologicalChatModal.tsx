"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MessageSquare, Send, Bot, User, Sparkles, X, ShieldAlert, CheckCircle2, RotateCcw, Cpu } from "lucide-react";
import { askMeteorologicalCopilot } from "@/services/api";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStationId?: number;
  initialQuery?: string;
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
  activeStationId,
  initialQuery
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and handle Escape key while Copilot is open
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);
  const initialGreeting: Message = {
    role: "assistant",
    content: "Welcome to the **WEATHERFUSION AI Meteorological Copilot**, powered by **Google Gemini 3.6 Flash**.\n\nI am grounded in available application data from **NOAA GFS**, **ECMWF IFS**, and **ECMWF AIFS**, synthesized with official **IMD advisories** and **ERA5** historical reanalysis. Ask any operational forecast or multi-model blending question.",
    citations: [
      "NOAA NCEP GFS 0.25° Physics Run",
      "ECMWF IFS 0.25° Physics Run & AIFS Deep Learning Model",
      "IMD Regional Meteorological Telemetry",
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

  // Handle optional initialQuery trigger
  useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim()) {
      handleSend(initialQuery.trim());
    }
  }, [isOpen, initialQuery]);

  if (!isOpen || !mounted) return null;

  const portalTarget = typeof document !== "undefined"
    ? (document.getElementById("copilot-modal-root") || document.body)
    : null;

  if (!portalTarget) return null;

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
        content: data.response || "I don't currently have verified forecast data for this location.",
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
          content: "I don't currently have verified forecast data for this location. Please check backend service connectivity on port 8000.",
          model_used: "service-offline",
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
          <h4 key={lIdx} className="text-[#0B1F33] font-bold text-xs mt-3 mb-1 tracking-wide uppercase">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={lIdx} className="text-[#0B1F33] font-bold text-sm mt-3 mb-1 tracking-wide">
            {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("---")) {
        return <hr key={lIdx} className="border-[#EDF2F7] my-2" />;
      }

      // Format bold markdown
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-semibold text-[#0B1F33]">
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
            <span className="text-[#1769AA] mt-1 shrink-0 text-[10px]">•</span>
            <span className="flex-1 text-[#334155]">{formattedParts}</span>
          </div>
        );
      }

      return (
        <p key={lIdx} className={line.trim() === "" ? "h-2" : "my-0.5 text-[#334155]"}>
          {formattedParts}
        </p>
      );
    });
  };

  return createPortal(
    <div 
      className="copilot-modal-root fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6"
      style={{ isolation: "isolate" }}
    >
      {/* Full Viewport Dark/Blurred Backdrop */}
      <div 
        className="copilot-backdrop fixed inset-0 transition-opacity duration-200"
        style={{
          backgroundColor: "rgba(8, 20, 35, 0.70)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)"
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Copilot Dialog */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="copilot-modal-title"
        className="copilot-dialog relative z-10 w-full max-w-3xl h-[680px] max-h-[92vh] bg-white border border-[#D9E0E7] rounded-2xl flex flex-col justify-between shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#D9E0E7] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#1769AA]/10 border border-[#1769AA]/20 flex items-center justify-center text-[#1769AA]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 id="copilot-modal-title" className="font-bold text-sm tracking-wide text-[#0B1F33] flex items-center gap-1.5">
                  WEATHERFUSION AI COPILOT
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1769AA]/10 text-[#1769AA] border border-[#1769AA]/20 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-[#1769AA]" />
                  Gemini 3.6 Flash
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  GROUNDED IN APP DATA
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] font-mono mt-0.5">
                METEOROLOGICAL DECISION SUPPORT · GROUNDED IN AVAILABLE NWP & OBSERVATIONS
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleClearChat}
              title="Reset Conversation"
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0B1F33] hover:bg-[#EDF2F7] transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close Copilot (Esc)"
              aria-label="Close Copilot"
              className="p-1.5 rounded-lg text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs leading-relaxed bg-[#F8FAFC]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${m.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                m.role === "user" 
                  ? "bg-[#1769AA] text-white" 
                  : "bg-white text-[#1769AA] border border-[#D9E0E7]"
              }`}>
                {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                m.role === "user" 
                  ? "bg-[#1769AA] text-white rounded-tr-none" 
                  : "bg-white text-[#0B1F33] border border-[#D9E0E7] rounded-tl-none"
              }`}>
                <div className={`text-[12px] ${m.role === "user" ? "text-white" : "text-[#0B1F33]"}`}>
                  {m.role === "user" ? m.content : renderFormattedContent(m.content)}
                </div>
                
                {/* Citations & Metadata */}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#EDF2F7] text-[10px] font-mono text-[#64748B] space-y-1">
                    <div className="flex items-center justify-between text-[#64748B] font-semibold mb-1">
                      <span className="flex items-center gap-1 text-[#1769AA]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Grounded Meteorological Citations:
                      </span>
                      {m.model_used && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-[#1769AA] border border-blue-200">
                          {m.model_used}
                        </span>
                      )}
                    </div>
                    {m.citations.map((c, cIdx) => (
                      <div key={cIdx} className="text-[#64748B] flex items-start space-x-1">
                        <span className="text-[#1769AA] shrink-0">›</span>
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-3 text-[#1769AA] font-mono text-xs pl-11 py-2">
              <div className="w-4 h-4 border-2 border-[#1769AA] border-t-transparent rounded-full animate-spin" />
              <span className="animate-pulse">
                Querying multi-model NWP runs & meteorological telemetry...
              </span>
            </div>
          )}
        </div>

        {/* Suggested Quick Queries */}
        <div className="px-4 py-2 bg-white border-t border-[#EDF2F7] flex flex-wrap gap-1.5">
          <span className="text-[10px] font-mono text-[#64748B] self-center mr-1">QUICK QUERIES:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#1769AA]/10 text-[#0B1F33] hover:text-[#1769AA] border border-[#D9E0E7] transition"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-[#D9E0E7] bg-white flex items-center space-x-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask meteorological questions grounded in active data (e.g. Why is rainfall risk high in Assam?)..."
            className="flex-1 bg-[#F8FAFC] border border-[#D9E0E7] rounded-xl px-4 py-2.5 text-xs text-[#0B1F33] placeholder-[#94A3B8] focus:outline-none focus:border-[#1769AA] focus:ring-1 focus:ring-[#1769AA] transition"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-[#1769AA] hover:bg-[#155d97] disabled:opacity-40 text-white font-semibold transition shadow-sm flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="text-xs">Ask</span>
          </button>
        </div>
      </div>
    </div>,
    portalTarget
  );
};

