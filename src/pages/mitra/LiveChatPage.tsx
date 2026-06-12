import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useMitraChatStore, ChatSession, ChatMessage } from '@/store/useMitraChatStore';
import { toast } from '@/components/ui/Toast';
import { MessageCircle, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import PageTransition from '@/components/ui/PageTransition';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';

export default function LiveChatPage() {
  const sessionsMap = useMitraChatStore(s => s.sessions);
  const addMessage = useMitraChatStore(s => s.addMessage);
  const markAsRead = useMitraChatStore(s => s.markAsRead);
  const endSessionStore = useMitraChatStore(s => s.endSession);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  const sessions = Object.values(sessionsMap).sort((a, b) => 
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  const selectedSession = selectedSessionId ? sessionsMap[selectedSessionId] : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedSession?.messages]);

  // Subscribe to selected session channel
  useEffect(() => {
    if (!selectedSessionId) return;

    markAsRead(selectedSessionId);

    const channel = supabase.channel(`chat:${selectedSessionId}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        addMessage(selectedSessionId, payload.message);
        markAsRead(selectedSessionId);
      })
      .on('broadcast', { event: 'end_chat' }, () => {
        endSessionStore(selectedSessionId);
        toast.info('Pelanggan telah mengakhiri obrolan.');
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Tell customer we joined
          channel.send({
            type: 'broadcast',
            event: 'mitra_joined',
            payload: {}
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [selectedSessionId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedSessionId || !channelRef.current) return;
    if (selectedSession?.status === 'ended') {
      toast.error('Sesi obrolan ini sudah berakhir.');
      return;
    }

    const text = newMessage.trim();
    const msg: ChatMessage = {
      id: uuidv4(),
      sender: 'mitra',
      message: text,
      created_at: new Date().toISOString()
    };

    addMessage(selectedSessionId, msg);
    setNewMessage('');

    channelRef.current.send({
      type: 'broadcast',
      event: 'new_message',
      payload: { message: msg }
    });
  };

  const handleEndSession = () => {
    if (!selectedSessionId || !channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'end_chat',
      payload: { sessionId: selectedSessionId }
    });
    endSessionStore(selectedSessionId);
    toast.success('Sesi chat diakhiri.');
  };

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-240px)] md:h-[calc(100vh-120px)] gap-4 overflow-hidden">
        {/* Chat List (Left Panel) */}
        <Card className={`
          w-full md:w-80 flex flex-col overflow-hidden border-border
          ${selectedSession ? 'hidden md:flex' : 'flex'}
        `}>
          <div className="p-4 border-b border-border bg-surface-secondary">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-primary-500" />
              <h2 className="font-extrabold text-content-primary uppercase tracking-widest text-xs">Pesan Masuk (Realtime)</h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {sessions.length > 0 ? (
              sessions.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedSessionId(chat.id)}
                  className={`
                    w-full p-4 flex items-center gap-3 transition-colors text-left relative
                    ${selectedSession?.id === chat.id ? 'bg-primary-500/10' : 'hover:bg-surface-secondary'}
                  `}
                >
                  <Avatar 
                    fallback={chat.customer_name.charAt(0)} 
                    size="md"
                    className="border border-border shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-content-primary truncate">
                        {chat.customer_name}
                      </p>
                      <span className="text-[10px] text-content-placeholder">
                        {new Date(chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <p className="text-xs text-content-secondary truncate">
                        {chat.status === 'ended' ? 'Sesi berakhir' : 'Sedang aktif...'}
                      </p>
                      {chat.hasUnread && (
                        <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-content-placeholder text-xs italic">
                Belum ada percakapan realtime aktif.
              </div>
            )}
          </div>
        </Card>

        {/* Chat Window (Right Panel) */}
        <Card className={`
          flex-1 flex flex-col overflow-hidden border-border relative
          ${!selectedSession ? 'hidden md:flex items-center justify-center bg-surface-secondary/50' : 'flex'}
        `}>
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b border-border bg-surface-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedSessionId(null)}
                    className="md:hidden p-2 -ml-2 text-content-secondary hover:text-primary-500"
                    aria-label="Back to chat list"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <Avatar 
                    fallback={selectedSession.customer_name.charAt(0)} 
                    size="sm"
                  />
                  <div>
                    <h3 className="font-bold text-content-primary leading-tight">{selectedSession.customer_name}</h3>
                    <p className="text-[10px] text-content-secondary">
                      {selectedSession.status === 'active' ? 'Aktif' : 'Telah Berakhir'}
                    </p>
                  </div>
                </div>
                {selectedSession.status === 'active' && (
                  <Button variant="ghost" size="sm" onClick={handleEndSession} className="text-red-500 hover:bg-red-50 hover:text-red-600 font-medium text-xs">
                    Selesai
                  </Button>
                )}
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-secondary/30">
                {selectedSession.messages.map((msg) => {
                  const isMe = msg.sender === 'mitra';
                  const isBot = msg.sender === 'bot';

                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`
                        max-w-[80%] p-3 rounded-2xl text-sm relative group shadow-sm
                        ${isMe 
                          ? 'bg-primary-500 text-white rounded-tr-none' 
                          : isBot 
                            ? 'bg-primary-50 text-primary-900 border border-primary-200 rounded-tl-none'
                            : 'bg-surface-card border border-border text-content-primary rounded-tl-none'}
                      `}>
                        <p className="leading-relaxed text-xs sm:text-sm">{msg.message}</p>
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
                    placeholder={selectedSession.status === 'active' ? "Tulis pesan balasan..." : "Sesi telah berakhir."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="!bg-surface-secondary !border-none"
                    disabled={selectedSession.status === 'ended' || isBotSession(selectedSession)}
                    autoFocus
                  />
                </div>
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={!newMessage.trim() || selectedSession.status === 'ended'}
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
                <p className="font-bold text-content-primary">Tidak Ada Obrolan Aktif</p>
                <p className="text-xs text-content-secondary">Pesan realtime akan otomatis hilang jika Anda me-refresh halaman.</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}

function isBotSession(session: ChatSession) {
  // Just a helper if we want to disable input on bot only sessions, but actually mitra can take over anytime
  return false;
}
