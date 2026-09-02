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
          minWidth: 0,
          marginLeft: isCollapsed ? "64px" : "288px",
          transition: "margin-left 260ms var(--ease-out)",
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
