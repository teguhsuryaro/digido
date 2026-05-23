import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDate } from '@/utils/format';
import { toast } from '@/components/ui/Toast';
import { MessageCircle, ArrowLeft, Bot, Send } from 'lucide-react';
import PageTransition from '@/components/ui/PageTransition';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Skeleton from '@/components/ui/Skeleton';

export default function LiveChatPage() {
  const user = useAuthStore((s) => s.user);
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // 1. Get UMKM
      const { data: umkmData } = await supabase
        .from('umkm')
        .select('id, name')
        .eq('owner_id', user.id)
        .single();
      
      if (!umkmData) return;

      // 2. Get Chats with customer info
      const { data: chatData, error } = await supabase
        .from('chats')
        .select('*, customer:profiles(full_name, avatar_url)')
        .eq('umkm_id', (umkmData as any).id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setChats(chatData || []);
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to new chats
    const chatChannel = supabase
      .channel('mitra-chats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [user]);

  useEffect(() => {
    if (!selectedChat) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', selectedChat.id)
        .order('created_at', { ascending: true });
      
      setMessages(data || []);
    };

    fetchMessages();

    // Subscribe to messages for selected chat
    const msgChannel = supabase
      .channel(`chat-msg-${selectedChat.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `chat_id=eq.${selectedChat.id}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
    };
  }, [selectedChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !user) return;

    setIsSending(true);
    const text = newMessage.trim();
    setNewMessage('');

    try {
      // 1. Insert message
      const { error: msgError } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: selectedChat.id,
          sender_id: user.id,
          message: text,
          sender_role: 'mitra',
          is_from_bot: false
        } as any);

      if (msgError) throw msgError;

      // 2. Update last_message_at in chats
      await supabase
        .from('chats')
        .update({ last_message_at: new Date().toISOString() } as any)
        .eq('id', selectedChat.id);

    } catch (err) {
      toast.error('Gagal mengirim pesan.');
      setNewMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-240px)] md:h-[calc(100vh-120px)] gap-4">
        <Skeleton className="w-80 h-full rounded-card" />
        <Skeleton className="flex-1 h-full rounded-card" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-240px)] md:h-[calc(100vh-120px)] gap-4 overflow-hidden">
        {/* Chat List (Left Panel) */}
        <Card className={`
          w-full md:w-80 flex flex-col overflow-hidden border-border
          ${selectedChat ? 'hidden md:flex' : 'flex'}
        `}>
          <div className="p-4 border-b border-border bg-surface-secondary">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-primary-500" />
              <h2 className="font-extrabold text-content-primary uppercase tracking-widest text-xs">Pesan Masuk</h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {chats.length > 0 ? (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`
                    w-full p-4 flex items-center gap-3 transition-colors text-left
                    ${selectedChat?.id === chat.id ? 'bg-primary-500/10' : 'hover:bg-surface-secondary'}
                  `}
                >
                  <Avatar 
                    src={chat.customer?.avatar_url} 
                    fallback={chat.customer?.full_name?.charAt(0)} 
                    size="md"
                    className="border border-border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-content-primary truncate">
                        {chat.customer?.full_name}
                      </p>
                      <span className="text-[10px] text-content-placeholder">
                        {formatDate(chat.last_message_at).split(',')[0]}
                      </span>
                    </div>
                    <p className="text-xs text-content-secondary truncate mt-0.5">
                      Klik untuk membalas...
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-content-placeholder text-xs italic">
                Belum ada percakapan.
              </div>
            )}
          </div>
        </Card>

        {/* Chat Window (Right Panel) */}
        <Card className={`
          flex-1 flex flex-col overflow-hidden border-border
          ${!selectedChat ? 'hidden md:flex items-center justify-center bg-surface-secondary/50' : 'flex'}
        `}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b border-border bg-surface-card flex items-center gap-3">
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-2 -ml-2 text-content-secondary hover:text-primary-500"
                  aria-label="Back to chat list"
                >
                  <ArrowLeft size={20} />
                </button>
                <Avatar 
                  src={selectedChat.customer?.avatar_url} 
                  fallback={selectedChat.customer?.full_name?.charAt(0)} 
                  size="sm"
                />
                <h3 className="font-bold text-content-primary">{selectedChat.customer?.full_name}</h3>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-secondary/30">
                {messages.map((msg) => {
                  const isMe = msg.sender_role === 'mitra';
                  const isBot = msg.sender_role === 'bot';

                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`
                        max-w-[80%] p-3 rounded-2xl text-sm relative group
                        ${isMe 
                          ? 'bg-primary-500 text-white rounded-tr-none' 
                          : 'bg-surface-card border border-border text-content-primary rounded-tl-none'}
                      `}>
                        {isBot && (
                          <span className="absolute -top-5 left-0 text-[8px] font-black uppercase tracking-widest text-primary-500 bg-primary-100 dark:bg-primary-950/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Bot size={10} /> AI Helper
                          </span>
                        )}
                        <p className="leading-relaxed">{msg.message}</p>
                        <p className={`
                          text-[9px] mt-1 opacity-50
                          ${isMe ? 'text-right' : 'text-left'}
                        `}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-surface-card flex gap-2">
                <div className="flex-1">
                  <Input 
                    placeholder="Tulis balasan..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="!bg-surface-secondary !border-none"
                    autoFocus
                  />
                </div>
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={!newMessage.trim() || isSending}
                  isLoading={isSending}
                  className="px-6 flex items-center gap-2"
                >
                  <Send size={16} />
                  <span className="hidden sm:inline">Kirim</span>
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-4 opacity-40">
              <MessageCircle size={48} className="mx-auto text-content-placeholder" />
              <div className="space-y-1">
                <p className="font-bold text-content-primary">Pilih Percakapan</p>
                <p className="text-xs text-content-secondary">Klik pada salah satu pelanggan untuk membalas chat.</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
