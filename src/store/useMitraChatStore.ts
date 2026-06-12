import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'mitra' | 'bot';
  message: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  umkm_id: string;
  customer_name: string;
  messages: ChatMessage[];
  updated_at: string;
  status: 'active' | 'ended';
  hasUnread: boolean;
}

interface MitraChatState {
  sessions: Record<string, ChatSession>;
  addSession: (session: ChatSession) => void;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  endSession: (sessionId: string) => void;
  removeSession: (sessionId: string) => void;
  markAsRead: (sessionId: string) => void;
}

export const useMitraChatStore = create<MitraChatState>((set) => ({
  sessions: {},
  
  addSession: (session) => set((state) => {
    // If session already exists, don't overwrite messages
    if (state.sessions[session.id]) return state;
    return {
      sessions: {
        ...state.sessions,
        [session.id]: { ...session, hasUnread: true }
      }
    };
  }),

  addMessage: (sessionId, message) => set((state) => {
    const session = state.sessions[sessionId];
    if (!session) return state;

    return {
      sessions: {
        ...state.sessions,
        [sessionId]: {
          ...session,
          messages: [...session.messages, message],
          updated_at: new Date().toISOString(),
          hasUnread: message.sender === 'user'
        }
      }
    };
  }),

  endSession: (sessionId) => set((state) => {
    const session = state.sessions[sessionId];
    if (!session) return state;

    return {
      sessions: {
        ...state.sessions,
        [sessionId]: {
          ...session,
          status: 'ended'
        }
      }
    };
  }),

  removeSession: (sessionId) => set((state) => {
    const newSessions = { ...state.sessions };
    delete newSessions[sessionId];
    return { sessions: newSessions };
  }),

  markAsRead: (sessionId) => set((state) => {
    const session = state.sessions[sessionId];
    if (!session) return state;

    return {
      sessions: {
        ...state.sessions,
        [sessionId]: {
          ...session,
          hasUnread: false
        }
      }
    };
  }),
}));
