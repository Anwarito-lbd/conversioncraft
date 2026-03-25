'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const QUICK_REPLIES = [
    'How does it work?',
    'What\'s included?',
    'How much does it cost?',
    'Do I need Shopify?',
];

interface Message {
    role: 'user' | 'bot';
    content: string;
}

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'bot',
            content:
                'Hey! 👋 I\'m the ConversionCraft assistant. Ask me anything about launching your dropshipping store — pricing, features, how it works, or getting started!',
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = { role: 'user', content: text.trim() };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text.trim() }),
            });
            const data = await res.json();
            setMessages((prev) => [...prev, { role: 'bot', content: data.reply || data.response || 'Sorry, I couldn\'t process that. Try again!' }]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'bot',
                    content:
                        'I\'m having trouble connecting right now. Here\'s what I can tell you:\n\n' +
                        '• **Pricing**: Starter $49/mo, Growth $149/mo, Enterprise $349/mo\n' +
                        '• **You need**: Shopify ($39/mo), domain (~$12/yr), Stripe (free)\n' +
                        '• **We automate**: Product sourcing, AI content, ads, email, fulfillment\n\n' +
                        'Email us at support@conversioncraft.com for more help!',
                },
            ]);
        }

        setIsLoading(false);
    };

    return (
        <>
            {/* Floating trigger button */}
            <button
                className="chatbot-trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle chatbot"
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </button>

            {/* Chat window */}
            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <h4>
                            <MessageCircle className="h-4 w-4" /> ConversionCraft AI
                        </h4>
                        <button onClick={() => setIsOpen(false)}>×</button>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`chat-msg ${msg.role === 'user' ? 'chat-user' : 'chat-bot'}`}>
                                {msg.content}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="chat-msg chat-bot" style={{ opacity: 0.6 }}>
                                Thinking...
                            </div>
                        )}
                        <div ref={messagesEndRef} />

                        {/* Quick replies — show only if just the welcome message */}
                        {messages.length === 1 && (
                            <div className="quick-replies">
                                {QUICK_REPLIES.map((qr) => (
                                    <button key={qr} className="quick-reply" onClick={() => sendMessage(qr)}>
                                        {qr}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="chatbot-input">
                        <input
                            type="text"
                            placeholder="Ask me anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                        />
                        <button onClick={() => sendMessage(input)}>
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
