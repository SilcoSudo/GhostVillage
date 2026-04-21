import { useState, useContext, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../app/context/AuthContext";
import { ChatContext } from "../../app/context/ChatContext.jsx";
import {
  useSendMessage,
  useGetConversation,
} from "../../shared/hooks/useMessage";
import { useFriendPresence } from "../../shared/hooks/useFriendPresence.js";
import { getAvatarUrl } from "../../shared/utils/avatarCache";
import { io } from "socket.io-client";
import "./ChatModal.css";

const MAX_MESSAGE_LENGTH = 2000;

const ChatModal = () => {
  const { t, i18n } = useTranslation();
  const { user } = useContext(AuthContext);
  const { token } = useContext(AuthContext);
  const { isOpen, selectedFriend, closeChat } = useContext(ChatContext);
  const presenceByUserId = useFriendPresence();
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const isFriendOnline = selectedFriend
    ? (presenceByUserId.get(String(selectedFriend._id)) ??
      selectedFriend.isOnline ??
      false)
    : false;

  // Get conversation history
  const { data: conversationData, isLoading } = useGetConversation(
    selectedFriend?._id,
  );

  // Send message mutation
  const { mutate: sendMessageMutation } = useSendMessage();

  // Load conversation history when friend changes
  useEffect(() => {
    if (conversationData?.data) {
      const messagesWithType = conversationData.data.map((msg) => ({
        ...msg,
        type: msg.senderId._id === user?._id ? "sent" : "received",
      }));
      setMessages(messagesWithType);
    }
  }, [conversationData, user?._id]);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!token) return;

    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const socket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("Socket.io connected");
      // Join user room for receiving messages
      socket.emit("join:user", { userId: user?._id });
    });

    socket.on("message:received", (data) => {
      console.log("Received message:", data);

      const senderId =
        typeof data.message.senderId === "string"
          ? data.message.senderId
          : data.message.senderId?._id;

      const isCurrentChatOpen = isOpen && senderId === selectedFriend?._id;

      if (isCurrentChatOpen) {
        setMessages((prev) => [
          ...prev,
          {
            _id: data.message._id,
            senderId,
            content: data.message.content,
            createdAt: data.message.createdAt,
            type: "received",
          },
        ]);
      } else if (senderId) {
        window.dispatchEvent(
          new CustomEvent("chat:new-message", {
            detail: {
              senderId,
              message: data.message,
            },
          }),
        );
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket.io disconnected");
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [token, user?._id, selectedFriend?._id, isOpen]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedFriend) return;

    const content = messageInput.trim();
    if (content.length > MAX_MESSAGE_LENGTH) return;
    setMessageInput("");
    setIsSending(true);

    try {
      sendMessageMutation(
        { recipientId: selectedFriend._id, content },
        {
          onSuccess: (response) => {
            // Add sent message to state
            const sentMessage = response.data;
            setMessages((prev) => [
              ...prev,
              {
                _id: sentMessage._id,
                senderId: sentMessage.senderId._id,
                content: sentMessage.content,
                createdAt: sentMessage.createdAt,
                type: "sent",
              },
            ]);
          },
          onError: (error) => {
            console.error("Failed to send message:", error);
            // Optionally show error toast here
          },
          onSettled: () => {
            setIsSending(false);
          },
        },
      );
    } catch (error) {
      console.error("Send message error:", error);
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen || !selectedFriend) return null;

  return (
    <div className="chat-floating-window">
      {/* Chat Header */}
      <div className="chat-floating-header">
        <div className="chat-header-left">
          <img
            src={getAvatarUrl(selectedFriend?._id, selectedFriend?.avatar)}
            alt={selectedFriend?.fullname}
            className="chat-header-avatar"
            crossOrigin="anonymous"
          />
          <div className="chat-header-info">
            <h3>{selectedFriend?.fullname}</h3>
            <p
              className={`chat-status ${isFriendOnline ? "online" : "offline"}`}
            >
              {isFriendOnline
                ? t("chatModal.activeNow")
                : t("chatModal.offline")}
            </p>
          </div>
        </div>
        <div className="chat-header-actions">
          <button
            className="chat-close-btn"
            onClick={closeChat}
            title={t("chatModal.close")}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-floating-messages">
        {isLoading ? (
          <div className="chat-empty">
            <p className="chat-empty-text">{t("chatModal.loadingMessages")}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <img
              src={getAvatarUrl(selectedFriend?._id, selectedFriend?.avatar)}
              alt={selectedFriend?.fullname}
              className="chat-empty-avatar"
              crossOrigin="anonymous"
            />
            <p className="chat-empty-title">{selectedFriend?.fullname}</p>
            <p className="chat-empty-text">{t("chatModal.connectedMessage")}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg._id} className={`message-bubble ${msg.type}`}>
              <div className="message-content">{msg.content}</div>
              <span className="message-time">
                {new Date(msg.createdAt).toLocaleTimeString(
                  i18n.language?.startsWith("vi") ? "vi-VN" : "en-US",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-floating-input-section">
        <textarea
          className="chat-floating-input"
          placeholder={t("chatModal.placeholder")}
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          maxLength={MAX_MESSAGE_LENGTH}
          onKeyPress={handleKeyPress}
          disabled={isSending}
          rows="1"
        />
        <span className="chat-character-count">
          {messageInput.length}/{MAX_MESSAGE_LENGTH}
        </span>
        <button
          className="chat-floating-send-btn"
          onClick={handleSendMessage}
          disabled={!messageInput.trim() || isSending}
          title={t("chatModal.send")}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatModal;
