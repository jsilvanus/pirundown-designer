import React, { useState, useRef, useEffect } from "react";
import type { AgentChatMessage } from "../types/index.js";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Zap,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sliders,
  Tv,
  Layers,
  Music,
  Maximize2,
} from "lucide-react";

interface AgentChatPanelProps {
  chatHistory: AgentChatMessage[];
  isThinking: boolean;
  onSendMessage: (message: string) => Promise<void>;
  onClearHistory?: () => void;
  className?: string;
}

export const AgentChatPanel: React.FC<AgentChatPanelProps> = ({
  chatHistory,
  isThinking,
  onSendMessage,
  onClearHistory,
  className = "",
}) => {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isThinking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isThinking) return;
    setInputText("");
    await onSendMessage(text);
  };

  const handleChipClick = (suggestion: string) => {
    if (isThinking) return;
    onSendMessage(suggestion);
  };

  const QUICK_SUGGESTIONS = [
    { label: "✨ Saarnaan pulpit & grafiikat", prompt: "Lisää saarnaan pulpit ja grafiikat" },
    { label: "🎵 Aseta virret 332, 450, 228", prompt: "Aseta virret 332, 450, 228" },
    { label: "📖 Tekstinlukuun ambo", prompt: "Aseta tekstinluvulle ambo ja raamattugrafiikka" },
    { label: "⛪ Tarkista herätteet", prompt: "Tarkista herätteet ja muuttujat" },
    { label: "📋 Lataa messu-pohja", prompt: "Lataa messu" },
  ];

  // Helper to render markdown-like formatting (bold, backticks, bullet lines)
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      // Process bullets
      const isBullet = line.startsWith("- ") || line.startsWith("* ");
      const rawText = isBullet ? line.substring(2) : line;

      // Tokenize bold and code snippets
      const parts = rawText.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-semibold text-primary-fixed-dim">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={pIdx}
              className="bg-surface-container-highest px-1.5 py-0.5 rounded text-xs font-mono text-tertiary"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-1.5 my-0.5 pl-2 text-xs">
            <span className="text-primary font-bold">•</span>
            <span className="flex-1">{formattedParts}</span>
          </div>
        );
      }

      if (line.trim() === "") {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="my-0.5 text-xs leading-relaxed">
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <div
      className={`flex flex-col h-full bg-surface-container-low/95 rounded-xl border border-outline-variant/30 overflow-hidden shadow-lg ${className}`}
    >
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-surface-container/80 border-b border-outline-variant/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-sm">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-on-surface">Ajolista-agentti</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/15 text-primary-fixed-dim border border-primary/30">
                piagent
              </span>
            </div>
            <span className="text-[10px] text-outline">Liturginen Rundown v2 -arkkitehti</span>
          </div>
        </div>

        {onClearHistory && (
          <button
            type="button"
            onClick={onClearHistory}
            className="p-1 text-outline hover:text-on-surface hover:bg-surface-container-highest rounded transition-colors"
            title="Tyhjennä keskusteluhistoria"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {chatHistory.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`flex gap-2 max-w-[92%] ${
                  isUser ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px] ${
                    isUser
                      ? "bg-primary text-on-primary font-bold shadow-sm"
                      : "bg-surface-container-highest text-primary border border-primary/30"
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-3 py-2 text-xs shadow-sm ${
                    isUser
                      ? "bg-primary text-on-primary rounded-tr-xs"
                      : "bg-surface-container-high/90 text-on-surface border border-outline-variant/30 rounded-tl-xs"
                  }`}
                >
                  {isUser ? (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div>{renderFormattedContent(msg.content)}</div>
                  )}

                  {/* Actions Executed Badge / Cards */}
                  {!isUser && msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-outline-variant/30 space-y-1.5">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-tertiary">
                        <Zap className="w-3 h-3 text-tertiary" />
                        <span>Suoritetut toimenpiteet ajolistaan:</span>
                      </div>
                      {msg.actions.map((act, aIdx) => (
                        <div
                          key={aIdx}
                          className="bg-surface-container-highest/80 rounded-lg p-2 border border-outline-variant/40 flex items-start gap-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-medium text-on-surface">
                              {act.description}
                            </div>
                            {act.type && (
                              <div className="text-[9px] font-mono text-outline mt-0.5">
                                MCP: {act.type}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[9px] text-outline/60 mt-1 px-8">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex items-start gap-2 max-w-[85%]">
            <div className="w-6 h-6 rounded-full bg-surface-container-highest text-primary border border-primary/30 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="bg-surface-container-high/90 border border-outline-variant/30 rounded-2xl rounded-tl-xs px-3.5 py-2.5 flex items-center gap-2 text-xs text-outline">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
              </div>
              <span className="text-[11px]">Suunnitellaan ajolistan muutoksia...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-3 py-1.5 border-t border-outline-variant/20 bg-surface-container/40 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {QUICK_SUGGESTIONS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isThinking}
              onClick={() => handleChipClick(item.prompt)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface border border-outline-variant/30 hover:border-primary/50 whitespace-nowrap transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSubmit}
        className="p-2.5 bg-surface-container/90 border-t border-outline-variant/30 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ohjaa agenttia (esim. 'Lisää saarnaan pulpit ja grafiikat')..."
          disabled={isThinking}
          className="flex-1 bg-surface-container-highest/90 border border-outline-variant/40 rounded-xl px-3 py-2 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isThinking}
          className="px-3 py-2 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-on-primary rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition-all cursor-pointer shrink-0"
          title="Lähetä pyyntö agentille"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Lähetä</span>
        </button>
      </form>
    </div>
  );
};
