import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, User, Trash2 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface ChatMessage {
  id: string;
  message: string;
  response: string | null;
  isFromUser: boolean;
  createdAt: string;
}

export const ChatPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fetchMessages = async () => {
    try {
      const response = await api.get('/chat/history');
      setMessages(response.data.data);
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);

    // Add user message optimistically
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      message: userMessage,
      response: null,
      isFromUser: true,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await api.post('/chat/message', { message: userMessage });
      const { userMessage: savedUserMsg, aiMessage } = response.data.data;

      // Replace temp message with saved message and add AI response
      setMessages((prev) =>
        prev
          .filter((msg) => msg.id !== tempUserMessage.id)
          .concat([savedUserMsg, aiMessage])
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMessage.id));
    } finally {
      setSending(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear chat history?')) return;

    try {
      await api.delete('/chat/history');
      setMessages([]);
      toast({
        title: 'Success',
        description: 'Chat history cleared',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear chat history',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Chat Assistant</h1>
          <p className="text-muted-foreground">
            Get financial advice and insights from your AI assistant
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" onClick={handleClearHistory}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear History
          </Button>
        )}
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                  <p className="text-muted-foreground">
                    Ask me anything about your finances, spending patterns, or get advice!
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.isFromUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!message.isFromUser && (
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg p-4 ${
                        message.isFromUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.isFromUser ? message.message : message.response || message.message}
                      </p>
                      <p
                        className={`text-xs mt-2 ${
                          message.isFromUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {formatDateTime(message.createdAt)}
                      </p>
                    </div>
                    {message.isFromUser && (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about your finances..."
                disabled={sending}
                className="flex-1"
              />
              <Button type="submit" disabled={sending || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
