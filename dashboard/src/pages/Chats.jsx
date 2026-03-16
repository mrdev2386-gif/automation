import { useState, useEffect } from 'react';
import { MessageCircle, Search, Send, User } from 'lucide-react';
import { getMessages, getClients, sendMessage } from '../services/firebase';

const Chats = () => {
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadClients();
    }, []);

    useEffect(() => {
        if (selectedClient) {
            loadMessages();
        }
    }, [selectedClient]);

    const loadClients = async () => {
        try {
            const data = await getClients();
            setClients(data);
            if (data.length > 0) {
                setSelectedClient(data[0].id);
            }
        } catch (error) {
            console.error('Error loading clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async () => {
        try {
            const data = await getMessages(selectedClient);
            setMessages(data);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedChat) return;

        setSending(true);
        try {
            await sendMessage(selectedClient, selectedChat, replyText);
            setReplyText('');
            loadMessages();
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    // Group messages by phone number
    const groupedMessages = messages.reduce((acc, msg) => {
        const key = msg.from;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(msg);
        return acc;
    }, {});

    const chatList = Object.keys(groupedMessages).map(phone => ({
        phone,
        lastMessage: groupedMessages[phone][0],
        unread: groupedMessages[phone].filter(m => m.direction === 'incoming').length
    }));

    if (loading) {
        return (
            <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight mb-8">Chats</h1>
                <div className="card-modern p-4 mb-6 animate-pulse">
                    <div className="h-12 bg-slate-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight mb-8">Chats</h1>

            {/* Client Selector */}
            <div className="card-modern p-4 mb-6">
                <label className="label-modern">Select Client</label>
                <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="select-modern w-full"
                >
                    <option value="">Choose a client...</option>
                    {clients.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.profile?.name || r.name || 'Unnamed Client'}
                        </option>
                    ))}
                </select>
            </div>

            {!selectedClient ? (
                <div className="card-modern p-8 sm:p-12 text-center">
                    <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-600 font-semibold text-lg mb-2">Select a client to view chats</p>
                    <p className="text-sm text-slate-500">Choose a client from the dropdown above</p>
                </div>
            ) : chatList.length === 0 ? (
                <div className="card-modern p-8 sm:p-12 text-center">
                    <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-600 font-semibold text-lg mb-2">No chats yet</p>
                    <p className="text-sm text-slate-500">Conversations will appear here when customers message</p>
                </div>
            ) : (
                <div className="card-modern overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-3 h-[600px]">
                        {/* Chat List */}
                        <div className="border-r border-slate-200 overflow-y-auto">
                            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                                <h3 className="font-semibold text-slate-900 text-sm">Conversations</h3>
                                <p className="text-xs text-slate-500 mt-1">{chatList.length} active chats</p>
                            </div>
                            {chatList.map((chat) => (
                                <button
                                    key={chat.phone}
                                    onClick={() => setSelectedChat(chat.phone)}
                                    className={`w-full p-4 text-left border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                                        selectedChat === chat.phone 
                                            ? 'bg-green-50 border-l-4 border-l-green-500' 
                                            : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                                            <User className="w-5 h-5 text-slate-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900 truncate">{chat.phone}</p>
                                            <p className="text-sm text-slate-500 truncate">
                                                {chat.lastMessage?.text || 'No messages'}
                                            </p>
                                        </div>
                                        {chat.unread > 0 && (
                                            <span className="badge badge-success flex-shrink-0">
                                                {chat.unread}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Chat Messages */}
                        <div className="col-span-2 flex flex-col">
                            {selectedChat ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-slate-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">{selectedChat}</p>
                                                <p className="text-xs text-slate-500">Active conversation</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 p-4 overflow-y-auto bg-slate-50">
                                        <div className="space-y-4">
                                            {groupedMessages[selectedChat]
                                                .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0))
                                                .map((msg) => (
                                                    <div
                                                        key={msg.id}
                                                        className={`flex ${msg.direction === 'incoming' ? 'justify-start' : 'justify-end'}`}
                                                    >
                                                        <div
                                                            className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
                                                                msg.direction === 'incoming'
                                                                    ? 'bg-white text-slate-900 border border-slate-200'
                                                                    : 'bg-green-500 text-white'
                                                            }`}
                                                        >
                                                            <p className="text-sm leading-relaxed">{msg.text}</p>
                                                            <p className={`text-xs mt-1.5 ${
                                                                msg.direction === 'incoming' 
                                                                    ? 'text-slate-400' 
                                                                    : 'text-green-100'
                                                            }`}>
                                                                {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString() : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    {/* Message Input */}
                                    <div className="p-4 border-t border-slate-200 bg-white">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Type a message..."
                                                className="input-modern flex-1"
                                                onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                                            />
                                            <button
                                                onClick={handleSendReply}
                                                disabled={sending || !replyText.trim()}
                                                className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Send className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-slate-500 bg-slate-50">
                                    <div className="text-center">
                                        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                        <p className="font-medium">Select a chat to view messages</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chats;
