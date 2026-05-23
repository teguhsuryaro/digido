import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { MessageCircle, X, Bot, Send } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ChatMessage {
  id: string;
  message: string;
  sender_role: 'customer' | 'bot' | 'mitra';
  created_at: string;
}

interface ChatbotWidgetProps {
  umkmId: string;
  umkmName: string;
}

export default function ChatbotWidget({ umkmId, umkmName }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [faqAnswers, setFaqAnswers] = useState<string[]>([]);
  const [mode, setMode] = useState<'bot' | 'live'>('bot');
  const [botCount, setBotCount] = useState(0);
  const [chatId, setChatId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);

  // 1. Initial Data Load
  useEffect(() => {
    if (isOpen && user) {
      const loadData = async () => {
        // Load FAQ
        const { data: faqs } = await supabase
          .from('umkm_faq')
          .select('answer')
          .eq('umkm_id', umkmId);
        if (faqs) setFaqAnswers((faqs as any[]).map((faq) => faq.answer));

        // Load Chat Session
        const { data: existingChat } = await supabase
          .from('chats')
          .select('id')
          .eq('customer_id', user.id)
          .eq('umkm_id', umkmId)
          .single();

        if (existingChat) {
          const currentChatId = (existingChat as any).id;
          setChatId(currentChatId);

          const { data: msgs } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('chat_id', currentChatId)
            .order('created_at', { ascending: true });
          
          if (msgs) {
            const parsedMsgs = (msgs as any[]).map(m => ({
              id: m.id,
              message: m.message,
              sender_role: m.sender_role as any,
              created_at: m.created_at
            }));
            setMessages(parsedMsgs);

            // Check if there are any mitra messages or if bot count is high
            const hasMitra = parsedMsgs.some(m => m.sender_role === 'mitra');
            if (hasMitra) setMode('live');

            const botMsgs = parsedMsgs.filter(m => m.sender_role === 'bot');
            setBotCount(botMsgs.length);
          }
        }
      };
      loadData();
    }
  }, [isOpen, umkmId, user]);

  // 2. Real-time Subscription for Mitra Replies
  useEffect(() => {
    if (isOpen && chatId && mode === 'live') {
      const channel = supabase
        .channel(`chat-widget-${chatId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `chat_id=eq.${chatId}` },
          (payload: any) => {
            if (payload.new.sender_role === 'mitra') {
              setMessages((prev) => [...prev, {
                id: payload.new.id,
                message: payload.new.message,
                sender_role: 'mitra',
                created_at: payload.new.created_at
              }]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, chatId, mode]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const switchToLive = async () => {
    if (!chatId || !user) return;
    setMode('live');
    
    const systemMsg = "Pelanggan meminta untuk berbicara langsung dengan penjual.";
    const botMessage: ChatMessage = {
      id: crypto.randomUUID(),
      message: systemMsg,
      sender_role: 'bot',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, botMessage]);

    await supabase.from('chat_messages').insert({
      chat_id: chatId,
      sender_id: null,
      message: systemMsg,
      sender_role: 'bot',
      is_from_bot: true,
    } as any);
  };

  const sendMessage = async () => {
    if (!input.trim() || !user) return;

    const userText = input.trim();
    const userMsgId = crypto.randomUUID();
    const isKeywordFallback = /penjual|manual|orang|manusia|bantu|admin/i.test(userText);
    
    const userMessage: ChatMessage = {
      id: userMsgId,
      message: userText,
      sender_role: 'customer',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let currentChatId = chatId;
      if (!currentChatId) {
        const { data: newChat } = await supabase
          .from('chats')
          .insert({ customer_id: user.id, umkm_id: umkmId })
          .select()
          .single();
        currentChatId = (newChat as any).id;
        setChatId(currentChatId);
      }

      await supabase.from('chat_messages').insert({
        chat_id: currentChatId,
        sender_id: user.id,
        message: userText,
        sender_role: 'customer',
        is_from_bot: false,
      } as any);

      if (mode === 'bot' && !isKeywordFallback) {
        await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1000));

        const randomAnswer = faqAnswers.length > 0
          ? faqAnswers[Math.floor(Math.random() * faqAnswers.length)]
          : 'Maaf, saya belum bisa menjawab itu secara mendetail. Silakan tinggalkan pesan atau klik tombol "Chat Langsung" di bawah.';

        const botMessage: ChatMessage = {
          id: crypto.randomUUID(),
          message: randomAnswer,
          sender_role: 'bot',
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, botMessage]);
        setBotCount(prev => prev + 1);

        await supabase.from('chat_messages').insert({
          chat_id: currentChatId,
          sender_id: null,
          message: randomAnswer,
          sender_role: 'bot',
          is_from_bot: true,
        } as any);
      } else if (isKeywordFallback && mode === 'bot') {
        await switchToLive();
      }

      await supabase
        .from('chats')
        .update({ last_message_at: new Date().toISOString() } as any)
        .eq('id', currentChatId);

    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 active:scale-95
          ${isOpen ? 'bg-error text-white rotate-90' : 'bg-accent-500 text-white hover:bg-accent-600'}
        `}
        aria-label={isOpen ? "Tutup Chatbot" : "Buka Chatbot"}
      >
        {isOpen ? (
          <X size={20} />
        ) : (
          <MessageCircle size={24} />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-44 right-6 z-50 w-[320px] max-w-[90vw] bg-surface-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className={`p-4 text-white transition-colors duration-500 ${mode === 'live' ? 'bg-accent-600' : 'bg-primary-500'}`}>
            <h3 className="font-bold text-sm">
              {mode === 'live' ? `Live Chat: ${umkmName}` : `Asisten AI ${umkmName}`}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[10px] text-primary-100 uppercase tracking-widest font-bold">
                {mode === 'live' ? 'Terhubung dengan Penjual' : 'Online & Siap Membantu'}
              </span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-surface-secondary/30">
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-10 opacity-40">
                <Bot size={36} className="mx-auto text-primary-500 mb-2" />
                <p className="text-xs font-medium text-content-primary">Halo! Ada yang bisa saya bantu?</p>
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.sender_role === 'customer';
              const isMitra = msg.sender_role === 'mitra';
              const isBot = msg.sender_role === 'bot';
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`
                    max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm relative
                    ${isMe 
                      ? 'bg-primary-500 text-white rounded-tr-none' 
                      : isMitra 
                        ? 'bg-accent-100 border border-accent-200 text-accent-900 rounded-tl-none'
                        : 'bg-surface-card border border-border text-content-primary rounded-tl-none'}
                  `}>
                    {isBot && (
                      <span className="flex items-center gap-0.5 text-[8px] font-black uppercase text-primary-500 mb-1">
                        <Bot size={10} /> AI Helper
                      </span>
                    )}
                    {msg.message}
                  </div>
                </div>
              );
            })}
            
            {/* Fallback Suggestion */}
            {mode === 'bot' && botCount >= 3 && (
              <div className="bg-primary-50 dark:bg-primary-950/20 p-3 rounded-xl border border-primary-100 dark:border-primary-900/30 text-center space-y-2 animate-in fade-in zoom-in-95 duration-500">
                <p className="text-[10px] text-primary-700 dark:text-primary-400 font-medium leading-relaxed">
                  Belum menemukan jawaban yang dicari? Silakan berbicara langsung dengan penjual.
                </p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  fullWidth 
                  className="bg-white dark:bg-surface-card text-primary-600 border-primary-200 text-[10px] h-8 flex items-center justify-center gap-1.5"
                  onClick={switchToLive}
                >
                  <Send size={10} /> Chat Penjual Langsung
                </Button>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-surface-card border border-border px-3 py-2 rounded-2xl rounded-tl-none flex gap-1">
                  <span className="w-1 h-1 bg-content-placeholder rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1 h-1 bg-content-placeholder rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1 h-1 bg-content-placeholder rounded-full animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-surface-card border-t border-border flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={mode === 'live' ? "Kirim pesan ke penjual..." : "Tanya stok, menu, dll..."}
              className="flex-1 bg-surface-secondary border-none rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 outline-none"
              aria-label="Isi pesan chatbot"
            />
            <Button 
              variant="primary" 
              size="sm" 
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className={`!rounded-xl px-4 transition-colors ${mode === 'live' ? '!bg-accent-600' : ''} flex items-center justify-center`}
              aria-label="Kirim pesan"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
