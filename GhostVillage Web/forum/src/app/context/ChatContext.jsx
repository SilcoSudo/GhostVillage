import { createContext, useState, useCallback } from "react";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showFriendsList, setShowFriendsList] = useState(true);

  const openChat = useCallback((friend) => {
    setIsOpen(true);
    setSelectedFriend(friend);
    setShowFriendsList(false);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setSelectedFriend(null);
    setShowFriendsList(true);
  }, []);

  const goBackToList = useCallback(() => {
    setSelectedFriend(null);
    setShowFriendsList(true);
  }, []);

  const value = {
    isOpen,
    setIsOpen,
    selectedFriend,
    setSelectedFriend,
    showFriendsList,
    setShowFriendsList,
    openChat,
    closeChat,
    goBackToList,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
