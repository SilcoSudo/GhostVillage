import { useContext } from "react";
import { FriendSidebarContext } from "../../../app/context/FriendSidebarContext";
import FriendList from "../../../features/friend/FriendList";
import "../../assets/styles/FriendSidebar.css";

const FriendSidebar = () => {
  const { showFriendSidebar } = useContext(FriendSidebarContext);

  return (
    <aside className={`friend-sidebar ${showFriendSidebar ? "active" : ""}`}>
      <FriendList />
    </aside>
  );
};

export default FriendSidebar;
