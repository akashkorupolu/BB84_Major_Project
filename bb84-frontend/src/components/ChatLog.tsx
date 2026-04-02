import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/types/bb84";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, User, Eye, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatLogProps {
  messages: ChatMessage[];
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export const ChatLog = ({
  messages,
  isCollapsed = false,
  onToggle,
}: ChatLogProps) => {
  const getSenderIcon = (sender: ChatMessage["sender"]) => {
    switch (sender) {
      case "alice":
        return <User className="w-4 h-4 text-alice" />;
      case "bob":
        return <User className="w-4 h-4 text-bob" />;
      case "eve":
        return <Eye className="w-4 h-4 text-eve" />;
      case "system":
        return <Bot className="w-4 h-4 text-primary" />;
    }
  };

  const getSenderName = (sender: ChatMessage["sender"]) => {
    return sender.charAt(0).toUpperCase() + sender.slice(1);
  };

  const getMessageClass = (sender: ChatMessage["sender"]) => {
    switch (sender) {
      case "alice":
        return "chat-alice";
      case "bob":
        return "chat-bob";
      case "eve":
        return "chat-eve";
      case "system":
        return "chat-system";
    }
  };

  if (isCollapsed) {
    return (
      <Card
        className="border-primary/15 cursor-pointer hover:border-primary/30 transition-colors"
        onClick={onToggle}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-sm">Protocol Log ({messages.length})</span>
            <Badge variant="outline" className="ml-auto">
              Click to expand
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/15">
      <CardHeader className="pb-3 cursor-pointer" onClick={onToggle}>
        <CardTitle className="flex items-center gap-2 text-primary">
          <MessageSquare className="w-5 h-5" />
          Protocol Communication Log
          <Badge variant="outline" className="ml-auto">
            {messages.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-3">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "p-3 rounded-lg max-w-xs relative",
                    getMessageClass(message.sender)
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getSenderIcon(message.sender)}
                    <span className="text-xs font-medium">
                      {getSenderName(message.sender)}
                    </span>
                    {message.round !== undefined && (
                      <Badge variant="outline" className="text-xs py-0 px-1">
                        Round {message.round + 1}
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm leading-relaxed">
                    {message.message}
                  </div>

                  <div className="text-xs opacity-60 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                Protocol communication will appear here
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
