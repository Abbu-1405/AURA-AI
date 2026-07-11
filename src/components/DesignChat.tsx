import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare, Compass, RefreshCw } from 'lucide-react';
import { ChatMessage, CreativeDirectorReport } from '../types';

interface DesignChatProps {
  report: CreativeDirectorReport;
}

const CHAT_SUGGESTIONS = [
  "How can I make this layout feel more luxury?",
  "Recommend concrete premium Google fonts.",
  "Which background colors match this direction?",
  "How can I resolve the typographic overlap?"
];

export default function DesignChat({ report }: DesignChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Greetings. I have analyzed your design in the context of our "${report.styleSelected}" creative direction. Ask me any follow-up questions about adjusting hierarchy, refined spacing, specific color theory, or font selections.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/design-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: [...messages, userMessage],
          report: report
        })
      });

      if (!response.ok) {
        throw new Error('Chat API network error');
      }

      const data = await response.json();
      if (data.success && data.answer) {
        const assistantMessage: ChatMessage = {
          id: Math.random().toString(),
          sender: 'assistant',
          text: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      console.error("DesignChat: Failed to fetch reply:", error);
      // Fallback response
      const errMessage: ChatMessage = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: "I experienced an interruption. I advise inspecting the alignment coordinates and ensuring your border lines are restricted to thin 1px dimensions while we stabilize the stream.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] md:h-[600px] bg-[#121212] rounded-none border border-white/5 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-[#1A1A1A] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-none border border-[#C9A227]/30 flex items-center justify-center bg-[#121212]">
            <span className="text-[#C9A227] font-display text-xs">◇</span>
          </div>
          <div>
            <h4 className="text-sm font-display font-light text-[#F5F5F5] tracking-wide">
              AI Design Assistant Chat
            </h4>
            <p className="font-mono text-[9px] text-[#C9A227] uppercase tracking-wider">
              Aura Creative Director
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => setMessages([messages[0]])}
          title="Reset Conversation"
          className="p-1.5 rounded-none hover:bg-white/5 text-[#666666] hover:text-[#A3A3A3] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-none p-3 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#1A1A1A] text-[#F5F5F5] border border-white/10'
                    : 'bg-[#181818] text-[#D1D1D1] border-l-2 border-[#C9A227] font-sans'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className="font-mono text-[8px] tracking-widest text-[#C9A227] uppercase">
                      Creative Director
                    </span>
                  </div>
                )}
                <p className="whitespace-pre-line font-light">{msg.text}</p>
                <span className="block text-[8px] font-mono text-[#666666] text-right mt-1.5">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#181818] text-[#D1D1D1] border-l-2 border-[#C9A227]/40 rounded-none p-3 max-w-[80%] space-y-2">
              <span className="font-mono text-[8px] tracking-widest text-[#C9A227]/60 uppercase animate-pulse">
                Aura AI is evaluating...
              </span>
              <div className="space-y-1.5 w-48">
                <div className="h-2 bg-white/5 rounded-none animate-pulse w-full"></div>
                <div className="h-2 bg-white/5 rounded-none animate-pulse w-5/6"></div>
                <div className="h-2 bg-white/5 rounded-none animate-pulse w-2/3"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Recommended Quick Actions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="font-mono text-[8px] text-[#666666] tracking-widest uppercase mb-1.5">
            Suggested Follow-ups:
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {CHAT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSend(suggestion)}
                className="text-[11px] text-[#A3A3A3] bg-[#1A1A1A] hover:bg-[#252525] border border-white/5 hover:border-[#C9A227]/30 px-2.5 py-1 rounded-none transition-all duration-200 cursor-pointer text-left"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 bg-[#1A1A1A] border-t border-white/5 flex items-center space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Aura AI for specific changes..."
          disabled={loading}
          className="flex-1 bg-[#121212] border border-white/10 rounded-none px-3 py-2 text-sm text-[#F5F5F5] placeholder-[#666666] focus:outline-none focus:border-[#C9A227] transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2 bg-[#C9A227] text-[#050505] hover:bg-[#E5B92D] disabled:opacity-30 disabled:hover:bg-[#C9A227] rounded-none transition-all flex items-center justify-center cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
