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
          <h4 key={lIdx} className="text-white font-bold text-xs mt-3 mb-1 tracking-wide uppercase">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={lIdx} className="text-white font-bold text-sm mt-3 mb-1 tracking-wide">
            {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("---")) {
        return <hr key={lIdx} className="border-[#1E293B] my-2" />;
      }

      // Format bold markdown
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-semibold text-white">
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
            <span className="text-[#00B8E6] mt-1 shrink-0 text-[10px]">•</span>
            <span className="flex-1 text-[#F4F8FC]">{formattedParts}</span>
          </div>
        );
      }

      return (
        <p key={lIdx} className={line.trim() === "" ? "h-2" : "my-0.5 text-[#F4F8FC]"}>
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
        className="copilot-dialog relative z-10 w-full max-w-3xl h-[680px] max-h-[92vh] bg-[#0D1B2E] border border-[#1E293B] rounded-2xl flex flex-col justify-between shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-[#F4F8FC]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#1E293B] flex items-center justify-between bg-[#081426]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#00B8E6]/20 border border-[#00B8E6]/40 flex items-center justify-center text-[#00B8E6]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 id="copilot-modal-title" className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
                  METEOROLOGICAL AI COPILOT
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00B8E6]/20 text-[#00B8E6] border border-[#00B8E6]/40 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-[#00B8E6]" />
                  Gemini 3.6 Flash
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  GROUNDED IN APP DATA
                </span>
              </div>
              <p className="text-[11px] text-[#9DAFC4] font-mono mt-0.5">
                METEOROLOGICAL DECISION SUPPORT · GROUNDED IN AVAILABLE NWP & OBSERVATIONS
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleClearChat}
              title="Reset Conversation"
              className="p-1.5 rounded-lg text-[#9DAFC4] hover:text-[#F4F8FC] hover:bg-[#14243A] transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close Copilot (Esc)"
              aria-label="Close Copilot"
              className="p-1.5 rounded-lg text-[#9DAFC4] hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs leading-relaxed bg-[#081426]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${m.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                m.role === "user" 
                  ? "bg-gradient-to-r from-[#00B8E6] to-[#1687FF] text-white" 
                  : "bg-[#0D1B2E] text-[#00B8E6] border border-[#233852]"
              }`}>
                {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-md ${
                m.role === "user" 
                  ? "bg-gradient-to-r from-[#00B8E6] to-[#1687FF] text-white rounded-tr-none" 
                  : "bg-[#0D1B2E] text-[#F4F8FC] border border-[#233852] rounded-tl-none"
              }`}>
                <div className={`text-[12px] ${m.role === "user" ? "text-white" : "text-[#F4F8FC]"}`}>
                  {m.role === "user" ? m.content : renderFormattedContent(m.content)}
                </div>
                
                {/* Citations & Metadata */}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#1E293B] text-[10px] font-mono text-[#9DAFC4] space-y-1">
                    <div className="flex items-center justify-between text-[#9DAFC4] font-semibold mb-1">
                      <span className="flex items-center gap-1 text-[#00B8E6]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Grounded Meteorological Citations:
                      </span>
                      {m.model_used && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00B8E6]/20 text-[#00B8E6] border border-[#00B8E6]/40">
                          {m.model_used}
                        </span>
                      )}
                    </div>
                    {m.citations.map((c, cIdx) => (
                      <div key={cIdx} className="text-[#9DAFC4] flex items-start space-x-1">
                        <span className="text-[#00B8E6] shrink-0">›</span>
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-3 text-[#00B8E6] font-mono text-xs pl-11 py-2">
              <div className="w-4 h-4 border-2 border-[#00B8E6] border-t-transparent rounded-full animate-spin" />
              <span className="animate-pulse">
                Querying multi-model NWP runs & meteorological telemetry...
              </span>
            </div>
          )}
        </div>

        {/* Suggested Quick Queries */}
        <div className="px-4 py-2 bg-[#081426] border-t border-[#1E293B] flex flex-wrap gap-1.5">
          <span className="text-[10px] font-mono text-[#667B94] self-center mr-1">QUICK QUERIES:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#0D1B2E] hover:bg-[#14243A] text-[#9DAFC4] hover:text-[#F4F8FC] border border-[#233852] hover:border-[#00B8E6] transition shadow-sm"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-[#1E293B] bg-[#081426] flex items-center space-x-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask meteorological questions grounded in active data (e.g. Why is rainfall risk high in Assam?)..."
            className="flex-1 bg-[#0D1B2E] border border-[#233852] rounded-xl px-4 py-2.5 text-xs text-[#F4F8FC] placeholder-[#667B94] focus:outline-none focus:border-[#00B8E6] transition"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00B8E6] to-[#1687FF] hover:brightness-110 disabled:opacity-40 text-white font-semibold transition shadow-md flex items-center gap-1.5"
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

