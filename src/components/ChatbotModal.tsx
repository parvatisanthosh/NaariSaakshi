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
    <div className="fixed inset-0 z-50 bg-bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-black/10 rounded-3xl w-full max-w-lg h-[600px] flex flex-col shadow-2xl relative overflow-hidden text-cream-ink">
        
        {/* Header */}
        <div className="p-5 border-b border-black/10 bg-cream flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-magenta text-bg-black font-bold flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-2xl text-cream-ink leading-none">NAARISAAKSHI ASSISTANT</h3>
              <span className="text-xs font-mono font-bold text-cream-ink/60 block mt-0.5">GROUNDED GUIDANCE & APP HELP</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-cream-ink/60 hover:text-cream-ink transition rounded-full hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-cream/20">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-cream text-cream-ink border border-black/10'
                  : 'bg-magenta text-bg-black'
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`p-4 rounded-2xl max-w-[82%] text-xs sm:text-sm font-medium leading-relaxed shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-cream text-cream-ink rounded-tr-none border border-black/10'
                  : msg.isSafetyAlert
                  ? 'bg-amber-100 border border-amber-300 text-amber-950 rounded-tl-none font-semibold'
                  : 'bg-white text-cream-ink rounded-tl-none border border-black/10'
              }`}>
                <p>{msg.text}</p>

                {/* Safety Alert Action CTA */}
                {msg.isSafetyAlert && (
                  <div className="mt-3 pt-3 border-t border-amber-300/60">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenSos();
                      }}
                      className="w-full py-2.5 rounded-full bg-magenta text-bg-black font-display font-bold text-sm tracking-wider uppercase transition shadow-md flex items-center justify-center space-x-1.5"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>OPEN EMERGENCY SOS NOW →</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-cream border-t border-black/5 flex items-center space-x-2 overflow-x-auto scrollbar-none text-[11px] shrink-0">
          {[
            'How do I file a POSH complaint?',
            'Where is my data stored?',
            'What is the Zero FIR rule?',
            'How does pattern detection work?'
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-magenta hover:text-bg-black border border-black/10 font-bold whitespace-nowrap text-cream-ink transition shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-4 border-t border-black/10 bg-white flex items-center space-x-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a question about the app, POSH, or FIR rules..."
            className="flex-1 bg-cream/40 border border-black/10 rounded-full px-4 py-3 text-xs sm:text-sm font-medium text-cream-ink placeholder:text-cream-ink/50 focus:outline-none focus:border-magenta focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-full bg-magenta text-bg-black font-bold flex items-center justify-center transition disabled:opacity-40 shrink-0 shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};