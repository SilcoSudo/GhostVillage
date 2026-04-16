import { useState, useRef, useEffect, useContext } from "react";
import { MessageCircle, X, Send, MoreVertical } from "lucide-react";
import { AuthContext } from "../../app/context/AuthContext";
import { ChatContext } from "../../app/context/ChatContext.jsx";
import { useFriendList } from "../../shared/hooks/useFriend";
import { getAvatarUrl, cacheAvatar } from "../../shared/utils/avatarCache";
import "./ChatWidget.css";

const MAX_MESSAGE_LENGTH = 2000;

const ChatWidget = () => {
  const { user } = useContext(AuthContext);
  const {
    isOpen,
    setIsOpen,
    selectedFriend,
    setSelectedFriend,
    showFriendsList,
    setShowFriendsList,
    openChat,
    closeChat,
    goBackToList,
  } = useContext(ChatContext);
  const { data: friends = [] } = useFriendList();
  const [messages, setMessages] = useState({});
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedFriend]);

  const handleSelectFriend = (friend) => {
    openChat(friend);
    // Initialize messages array if doesn't exist
    if (!messages[friend._id]) {
      setMessages((prev) => ({
        ...prev,
        [friend._id]: [],
      }));
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedFriend) return;

    const content = messageInput.trim();
    if (content.length > MAX_MESSAGE_LENGTH) return;

    const newMessage = {
      id: Date.now(),
      senderId: user._id,
      text: content,
      timestamp: new Date(),
      isSent: true, // Thêm trường này để phân biệt tin nhắn của user hay friend
    };

    setMessages((prev) => ({
      ...prev,
      [selectedFriend._id]: [...(prev[selectedFriend._id] || []), newMessage],
    }));

    setMessageInput("");

    // Simulate receiving message after 1 second (placeholder)
    setTimeout(() => {
      const replyMessage = {
        id: Date.now() + 1,
        senderId: selectedFriend._id,
        text: "Đã nhận tin nhắn của bạn! 👋",
        timestamp: new Date(),
        isSent: false,
      };
      setMessages((prev) => ({
        ...prev,
        [selectedFriend._id]: [
          ...(prev[selectedFriend._id] || []),
          replyMessage,
        ],
      }));
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBack = () => {
    goBackToList();
  };

  const currentMessages = selectedFriend
    ? messages[selectedFriend._id] || []
    : [];

  return (
    <div className="chat-widget-container">
      {/* Chat Button */}
      {!isOpen && (
        <button
          className="chat-widget-btn"
          onClick={() => setIsOpen(true)}
          title="Messages"
        >
          <MessageCircle size={20} />
          {friends.length > 0 && (
            <span className="badge">{friends.length}</span>
          )}
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="chat-widget">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              {selectedFriend && (
                <button className="back-btn" onClick={handleBack}>
                  <i className="fas fa-chevron-left"></i>
                </button>
              )}
              <h3>{selectedFriend ? selectedFriend.fullname : "Messages"}</h3>
            </div>
            <div className="chat-header-right">
              {selectedFriend && (
                <button className="icon-btn" title="More options">
                  <MoreVertical size={16} />
                </button>
              )}
              <button
                className="close-btn"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Friends List or Chat */}
          {!selectedFriend || showFriendsList ? (
            <div className="friends-list-chat">
              {friends.length === 0 ? (
                <div className="no-friends-chat">
                  <p>Không có bạn bè nào</p>
                </div>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend._id}
                    className="friend-item-chat"
                    onClick={() => handleSelectFriend(friend)}
                  >
                    <div className="friend-avatar-chat">
                      {friend.avatar ? (
                        <img
                          src={getAvatarUrl(friend._id, friend.avatar)}
                          alt={friend.fullname}
                          onLoad={() => cacheAvatar(friend._id, friend.avatar)}
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="avatar-fallback-chat">
                          {friend.fullname.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="friend-info-chat">
                      <h4>{friend.fullname}</h4>
                      {messages[friend._id] &&
                        messages[friend._id].length > 0 && (
                          <p className="last-message">
                            {messages[friend._id][
                              messages[friend._id].length - 1
                            ].text.substring(0, 30)}
                            ...
                          </p>
                        )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Messages View */
            <div className="chat-messages-container">
              <div className="messages-list">
                {currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message ${msg.isSent ? "sent" : "received"}`}
                  >
                    <div className="message-bubble">{msg.text}</div>
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="chat-input-area">
                <textarea
                  className="message-input"
                  placeholder="Nhập tin nhắn..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  maxLength={MAX_MESSAGE_LENGTH}
                  onKeyPress={handleKeyPress}
                  rows="2"
                />
                <span className="chat-character-count">
                  {messageInput.length}/{MAX_MESSAGE_LENGTH}
                </span>
                <button
                  className="send-btn"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
