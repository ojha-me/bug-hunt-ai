import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Box } from "@mantine/core";
import { SidebarProvider, useSidebar } from "../contexts/SidebarContext";

const LayoutContent = () => {
  const { isCollapsed } = useSidebar();
  
  return (
    <Box style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <Box 
        style={{ 
          flex: 1, 
          marginLeft: isCollapsed ? "60px" : "300px",
          transition: 'margin-left 0.3s ease'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export const Layout = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};
