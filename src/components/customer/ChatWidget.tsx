import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, Store, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from '@/store/useAuthStore';
import { formatTime } from '@/utils/format';

interface ChatMessage {
  id: string;
  sender: 'user' | 'mitra' | 'bot';
  message: string;
  created_at: string;
}

interface ChatWidgetProps {
  umkm: any;
}

export default function ChatWidget({ umkm }: ChatWidgetProps) {
  const profile = useAuthStore(s => s.profile);
  const [isOpen, setIsOpen] = useState(false);
  const [isLiveChat, setIsLiveChat] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isMitraJoined, setIsMitraJoined] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize Chatbot greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: uuidv4(),
          sender: 'bot',
          message: umkm.chatbot_active && umkm.chatbot_greeting 
            ? umkm.chatbot_greeting 
            : `Halo! Selamat datang di ${umkm.name}. Ada yang bisa dibantu?`,
          created_at: new Date().toISOString()
        }
      ]);
    }
  }, [isOpen]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup on unmount or session end
  const cleanupSession = () => {
    if (channelRef.current) {
      if (sessionId) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'end_chat',
          payload: { sessionId }
        });
      }
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setIsLiveChat(false);
    setSessionId(null);
    setIsMitraJoined(false);
    setMessages([]);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  useEffect(() => {
    return cleanupSession;
  }, []);

  // Idle timeout (1 minute)
  const resetTimeout = () => {
    if (!isLiveChat) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      setMessages(prev => [...prev, {
        id: uuidv4(),
        sender: 'bot',
        message: 'Sesi chat berakhir otomatis karena tidak ada aktivitas.',
        created_at: new Date().toISOString()
      }]);
      cleanupSession();
    }, 60000); // 1 minute
  };

  const startLiveChat = () => {
    if (!profile) return;
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    setIsLiveChat(true);

    const greetingMsg: ChatMessage = {
      id: uuidv4(),
      sender: 'bot',
      message: 'Meneruskan pesan ke Mitra. Mohon tunggu...',
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, greetingMsg]);

    // Send NEW_CHAT to Mitra Inbox
    const inboxChannel = supabase.channel(`chat_inbox:${umkm.id}`);
    inboxChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        inboxChannel.send({
          type: 'broadcast',
          event: 'new_chat',
          payload: {
            session: {
              id: newSessionId,
              umkm_id: umkm.id,
              customer_name: profile.full_name || 'Pelanggan',
              messages: messages.filter(m => m.sender === 'user'),
              updated_at: new Date().toISOString(),
              status: 'active'
            }
          }
        });
        setTimeout(() => supabase.removeChannel(inboxChannel), 1000);
      }
    });

    // Subscribe to Session Channel
    const sessionChannel = supabase.channel(`chat:${newSessionId}`);
    channelRef.current = sessionChannel;

    sessionChannel
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        setMessages(prev => [...prev, payload.message]);
        resetTimeout();
      })
      .on('broadcast', { event: 'mitra_joined' }, () => {
        setIsMitraJoined(true);
        setMessages(prev => [...prev, {
          id: uuidv4(),
          sender: 'bot',
          message: 'Mitra telah bergabung dalam obrolan.',
          created_at: new Date().toISOString()
        }]);
        resetTimeout();
      })
      .on('broadcast', { event: 'end_chat' }, () => {
        setMessages(prev => [...prev, {
          id: uuidv4(),
          sender: 'bot',
          message: 'Mitra telah mengakhiri obrolan.',
          created_at: new Date().toISOString()
        }]);
        cleanupSession();
      })
      .subscribe();

    resetTimeout();
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: uuidv4(),
      sender: 'user',
      message: inputValue.trim(),
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    if (isLiveChat) {
      resetTimeout();
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'new_message',
          payload: { message: userMsg }
        });
      }
    } else {
      // Simple Chatbot Engine
      const text = userMsg.message.toLowerCase();
      setTimeout(() => {
        let reply = '';
        if (text.includes('buka') || text.includes('jam')) {
          reply = umkm.is_open ? 'Toko kami sedang buka! Silakan pesan.' : 'Maaf, toko kami sedang tutup.';
        } else if (text.includes('ongkir') || text.includes('pengiriman')) {
          reply = `Kami melayani pengiriman maksimal ${umkm.max_delivery_distance} km dengan tarif Rp ${umkm.delivery_fee_per_km}/km.`;
        } else {
          reply = 'Terima kasih atas pesan Anda. Silakan hubungi langsung ke Mitra untuk informasi lebih lanjut.';
        }

        setMessages(prev => [...prev, {
          id: uuidv4(),
          sender: 'bot',
          message: reply,
          created_at: new Date().toISOString()
        }]);
      }, 500);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-primary-500 text-white rounded-full shadow-xl shadow-primary-500/30 flex items-center justify-center hover:scale-105 transition-transform z-40 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageCircle size={28} />
      </button>

      {isOpen && (
        <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-[calc(100vw-32px)] md:w-96 bg-surface-primary rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-5 h-[500px] max-h-[80vh]">
          {/* Header */}
          <div className="bg-primary-500 p-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                {isLiveChat && isMitraJoined ? <Store size={20} /> : <Bot size={20} />}
              </div>
              <div>
                <h3 className="font-bold leading-tight">{isLiveChat && isMitraJoined ? umkm.name : 'Asisten Digital'}</h3>
                <p className="text-xs text-white/80">
                  {isLiveChat ? (isMitraJoined ? 'Online' : 'Menunggu mitra...') : 'Otomatis'}
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-secondary/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${
                  msg.sender === 'user' 
                    ? 'bg-primary-500 text-white rounded-br-sm' 
                    : msg.sender === 'bot'
                    ? 'bg-surface-primary border border-border text-content-primary rounded-bl-sm shadow-sm'
                    : 'bg-primary-50 text-primary-900 border border-primary-200 rounded-bl-sm shadow-sm'
                }`}>
                  <p className="text-sm">{msg.message}</p>
                </div>
                <span className="text-[10px] text-content-placeholder mt-1 mx-1">
                  {formatTime(msg.created_at)}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Connect to Mitra Button */}
          {!isLiveChat && messages.length >= 2 && profile && (
            <div className="p-3 bg-surface-primary border-t border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs text-amber-600 font-medium">
                <AlertCircle size={14} />
                <span>Butuh bantuan manusia?</span>
              </div>
              <button
                onClick={startLiveChat}
                className="px-3 py-1.5 bg-surface-secondary hover:bg-surface-tertiary border border-border rounded-lg text-xs font-bold text-content-primary transition-colors"
              >
                Chat Mitra
              </button>
            </div>
          )}
          {!profile && !isLiveChat && messages.length >= 2 && (
             <div className="p-3 bg-amber-50 text-amber-700 text-xs text-center border-t border-amber-200">
               Silakan login untuk chat langsung dengan Mitra.
             </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-surface-primary border-t border-border shrink-0">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ketik pesan..."
                className="w-full pl-4 pr-12 py-3 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                disabled={isLiveChat && !isMitraJoined && messages[messages.length-1]?.sender === 'bot'}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="absolute right-2 p-2 text-primary-500 hover:bg-primary-50 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
