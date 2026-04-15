import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle } from "lucide-react";
import { format } from "date-fns";

interface Props {
  otherUserId: string;
  otherUserName: string;
}

const DoctorPatientChat = ({ otherUserId, otherUserName }: Props) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadMessages();

    const channel = supabase
      .channel(`chat-${[user.id, otherUserId].sort().join("-")}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const msg = payload.new as any;
          if (
            (msg.sender_id === user.id && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === user.id)
          ) {
            setMessages((prev) => [...prev, msg]);
            // Mark as read if received
            if (msg.receiver_id === user.id && !msg.is_read) {
              supabase.from("chat_messages").update({ is_read: true }).eq("id", msg.id).then();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, otherUserId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });
    setMessages(data || []);

    // Mark unread as read
    if (data) {
      const unread = data.filter((m) => m.receiver_id === user.id && !m.is_read);
      if (unread.length > 0) {
        await supabase
          .from("chat_messages")
          .update({ is_read: true })
          .in("id", unread.map((m) => m.id));
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !user || sending) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      sender_id: user.id,
      receiver_id: otherUserId,
      content: input.trim(),
    });
    if (!error) setInput("");
    setSending(false);
  };

  return (
    <Card className="shadow-card flex flex-col h-[400px]">
      <CardHeader className="py-3 px-4 border-b border-border">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          Chat with {otherUserName}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">No messages yet. Start the conversation!</p>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-xl px-3 py-1.5 text-sm ${
                  msg.sender_id === user?.id
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-0.5 ${msg.sender_id === user?.id ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {format(new Date(msg.created_at), "h:mm a")}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border p-2 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="text-sm"
            disabled={sending}
          />
          <Button size="icon" onClick={sendMessage} disabled={sending || !input.trim()} className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorPatientChat;
