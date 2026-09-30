import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User as UserIcon,
  HelpCircle,
  ExternalLink,
  Zap,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  PhoneCall,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface SupportWidgetProps {
  telegramUsername?: string;
  telegramUrl?: string;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  actionButton?: {
    label: string;
    url?: string;
    action?: string;
  };
}

const FAQ_PRESETS = [
  {
    question: 'How do I recharge my account balance?',
    answer:
      'Go to Wallet or tap Recharge on Home. You can choose:\n• UPI 1: Scan custom QR code and submit 12-digit UTR reference ID.\n• UPI 2: Instant 1-click Razorpay automated checkout.\n• UPI 3: Custom Web API gateway redirect.',
  },
  {
    question: 'How long do withdrawals take?',
    answer:
      'Withdrawals are processed quickly by our finance team, typically within 15 to 45 minutes directly to your verified bank account or UPI ID. Minimum withdrawal is ₹100.',
  },
  {
    question: 'How do daily investment returns work?',
    answer:
      'Daily returns from your active plans are generated automatically every 24 hours. You can claim your daily income directly from the Orders section or Home dashboard.',
  },
  {
    question: 'My UTR is pending verification. What should I do?',
    answer:
      'Manual UPI 1 deposits are verified by administrators by matching your 12-digit UTR number with bank statements within 5-15 minutes. For immediate priority review, contact our Telegram support team!',
  },
];

export const SupportWidget: React.FC<SupportWidgetProps> = ({
  telegramUsername = 'investpro_india',
  telegramUrl = 'https://t.me/investpro_india',
}) => {
  const { user } = useAuth();
  const { activeTheme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const activeTelegramLink = telegramUrl || 'https://t.me/investpro_india';
  const activeTelegramDisplay = telegramUsername ? (telegramUsername.startsWith('@') ? telegramUsername : `@${telegramUsername}`) : '@investpro_india';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      sender: 'bot',
      text: `Hello ${user?.fullName ? user.fullName.split(' ')[0] : 'there'}! 👋 Welcome to Member Support. How can we help you today?`,
      time: 'Just now',
    },
    {
      id: 'welcome_2',
      sender: 'bot',
      text: 'For 24/7 instant priority help, deposit/withdrawal assistance, or live 1-on-1 human chat, please connect directly with our Official Telegram Support team.',
      time: 'Just now',
      actionButton: {
        label: 'Chat on Official Telegram',
        url: activeTelegramLink,
      },
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // Smart Automated Response Generation routing to Telegram
    setTimeout(() => {
      const lower = text.toLowerCase();
      let reply = "Our support team is online! For instant 1-on-1 resolution, payment verification, and all updates, please connect with our Official Telegram support chat directly.";
      let actionBtn = {
        label: '👉 Open Official Telegram Chat',
        url: activeTelegramLink,
      };

      if (lower.includes('recharge') || lower.includes('deposit') || lower.includes('upi')) {
        reply = "To recharge your balance, click the 'Recharge' button on Home or Wallet. If you completed a payment and need instant approval, send your UTR number to our Official Telegram Support team.";
      } else if (lower.includes('withdraw') || lower.includes('payout') || lower.includes('bank')) {
        reply = "Withdrawals are processed 24/7 directly to your registered bank account or UPI ID. If you need urgent priority release, message our Official Telegram Support.";
      } else if (lower.includes('utr') || lower.includes('pending') || lower.includes('not received')) {
        reply = "UTR verification is in progress. For immediate priority speed-up, please share your payment receipt on our Official Telegram Support channel right now!";
      } else if (lower.includes('telegram') || lower.includes('agent') || lower.includes('human') || lower.includes('contact') || lower.includes('help')) {
        reply = `You can chat with our official human agent directly on our Official Telegram Channel (${activeTelegramDisplay}). Click below to start chatting!`;
      } else if (lower.includes('plan') || lower.includes('earning') || lower.includes('profit') || lower.includes('product')) {
        reply = "Daily investment returns run every 24 hours. Check our Official Telegram Channel for exclusive updates, special bonus codes, and daily earning proofs!";
      }

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionButton: actionBtn,
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 500);
  };

  return (
    <>
      {/* Floating Help & Support Action Trigger Button (Bottom Right) */}
      {!isOpen && (
        <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2 px-4 py-2.5 rounded-full text-white font-bold text-xs shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              backgroundColor: activeTheme.primaryColor || '#9333EA',
              boxShadow: '0 10px 25px -5px rgba(147, 51, 234, 0.5)',
            }}
            title="Open Help & Support Desk"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <MessageCircle className="w-4 h-4 text-white" />
            <span className="font-bold">Help & Support</span>
          </button>
        </div>
      )}

      {/* Slide-Up Support Popup Window */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-[390px] max-h-[82vh] rounded-3xl shadow-2xl border flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
          style={{
            backgroundColor: activeTheme.cardColor,
            borderColor: activeTheme.mode === 'dark' ? '#334155' : '#E2E8F0',
          }}
        >
          {/* Header */}
          <div
            className="p-4 sm:p-4.5 text-white flex items-center justify-between shadow-sm relative overflow-hidden shrink-0"
            style={{ backgroundColor: activeTheme.headerColor || activeTheme.primaryColor || '#1E1B4B' }}
          >
            <div className="relative z-10 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold leading-tight">Member Support Desk</h3>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
                <p className="text-[10px] text-white/80">Online · Live Help via Official Telegram</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="relative z-10 p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Official Telegram Quick Banner */}
          <div className="p-3 bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 text-white flex items-center justify-between shrink-0 shadow-inner">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-xl bg-white text-sky-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <Send className="w-4 h-4 text-sky-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">Official Telegram Channel</div>
                <div className="text-[10px] text-sky-100 font-mono truncate">{activeTelegramDisplay}</div>
              </div>
            </div>

            <a
              href={activeTelegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white text-sky-700 hover:bg-sky-50 font-bold text-xs shadow-sm flex items-center gap-1 shrink-0 transition-transform active:scale-95 cursor-pointer"
            >
              <span>Chat / Join</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Direct Telegram Support Banner CTA */}
          <div className="px-3.5 py-2 bg-sky-50 dark:bg-sky-950/40 border-b border-sky-100 dark:border-sky-900/60 flex items-center justify-between text-[11px]">
            <span className="text-sky-800 dark:text-sky-300 font-medium">⚡ Need 1-on-1 human help?</span>
            <a
              href={activeTelegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
            >
              Open Telegram Chat <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Chat Messages Container */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 min-h-[220px] max-h-[360px] text-xs">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-br-xs font-medium'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.actionButton && (
                    <a
                      href={msg.actionButton.url || activeTelegramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all"
                    >
                      <Send className="w-3 h-3" />
                      <span>{msg.actionButton.label}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      msg.sender === 'user' ? 'text-purple-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-center text-slate-400 text-xs">
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick FAQ Preset Suggestions */}
          <div className="p-2 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {FAQ_PRESETS.map((faq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  handleSendMessage(faq.question);
                }}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                {faq.question}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Ask for help or type message..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
