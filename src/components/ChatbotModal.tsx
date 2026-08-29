import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, ShieldAlert, PhoneCall, Bot, User, Info, ArrowRight } from 'lucide-react';
import { isDistressMessage, searchKnowledgeBase } from '../chatbotKnowledge';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  isSafetyAlert?: boolean;
}

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSos: () => void;
}

export const ChatbotModal: React.FC<ChatbotModalProps> = ({
  isOpen,
  onClose,
  onOpenSos
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: "I can help you find your way around the app, or explain how POSH complaints and FIRs generally work. I can't tell you what to do about your specific situation or replace a counselor or legal advice — for that, I'll point you to the right place."
    }
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text) return;

    const userMsg: Message = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    // SAFETY ROUTING PRIORITY CHECK: Run distress check BEFORE AI/FAQ logic
    if (isDistressMessage(text)) {
      setTimeout(() => {
        const safetyMsg: Message = {
          id: 'bot-alert-' + Date.now(),
          sender: 'bot',
          isSafetyAlert: true,
          text: "It sounds like you might need help right now. You can reach 112 (Emergency), 181 (Women's Helpline), or 1091 (Women in Distress) immediately — tap below to open the SOS panel."
        };
        setMessages(prev => [...prev, safetyMsg]);
      }, 300);
      return;
    }

    // GROUNDED KNOWLEDGE BASE RESPONSE
    setTimeout(() => {
      const answer = searchKnowledgeBase(text);
      const botMsg: Message = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: answer
      };
      setMessages(prev => [...prev, botMsg]);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-charcoal-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-3xl w-full max-w-lg h-[580px] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-charcoal-700 bg-charcoal-850 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-teal-950 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-charcoal-100">EvidenceHer Assistant</h3>
              <span className="text-[10px] text-charcoal-400">Grounded Guidance & App Help</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-charcoal-400 hover:text-charcoal-100 rounded-full bg-charcoal-900 border border-charcoal-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-teal-700 text-white rounded-br-none'
                    : msg.isSafetyAlert
                    ? 'bg-rose-950 border border-rose-500/60 text-rose-100 rounded-bl-none shadow-lg'
                    : 'bg-charcoal-900 border border-charcoal-700 text-charcoal-200 rounded-bl-none'
                }`}
              >
                {msg.isSafetyAlert && (
                  <div className="flex items-center space-x-2 text-rose-400 font-bold uppercase text-[10px]">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Emergency Safety Routing</span>
                  </div>
                )}

                <p className="whitespace-pre-wrap">{msg.text}</p>

                {msg.isSafetyAlert && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSos();
                    }}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-md flex items-center justify-center space-x-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Open Emergency SOS Options →</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-1.5 bg-charcoal-850 border-t border-charcoal-750 flex items-center space-x-2 overflow-x-auto scrollbar-none text-[10px] shrink-0">
          {[
            'POSH 3-month window?',
            'What is Zero FIR?',
            'Call recording rules',
            'Quick Capture mode?'
          ].map((pill, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(pill)}
              className="px-2.5 py-1 rounded-full bg-charcoal-900 hover:bg-charcoal-700 text-teal-300 border border-teal-500/30 whitespace-nowrap transition"
            >
              {pill}
            </button>
          ))}
        </div>

        {/* User Input Bar */}
        <div className="p-3 border-t border-charcoal-700 bg-charcoal-850 flex items-center space-x-2 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask a question about app features, POSH, or FIRs..."
            className="flex-1 bg-charcoal-900 border border-charcoal-700 rounded-xl px-3.5 py-2.5 text-xs text-charcoal-100 placeholder-charcoal-500 focus:outline-none focus:border-teal-500 transition"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition disabled:opacity-40 shrink-0 shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
