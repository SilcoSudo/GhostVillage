import { createContext, useState } from "react";

export const FriendSidebarContext = createContext();

export const FriendSidebarProvider = ({ children }) => {
  const [showFriendSidebar, setShowFriendSidebar] = useState(false);

  const toggleFriendSidebar = () => {
    setShowFriendSidebar(!showFriendSidebar);
  };

  return (
    <FriendSidebarContext.Provider
      value={{ showFriendSidebar, toggleFriendSidebar }}
    >
      {children}
    </FriendSidebarContext.Provider>
  );
};
