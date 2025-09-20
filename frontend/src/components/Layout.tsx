import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Box } from "@mantine/core";

export const Layout = () => {
  return (
    <Box style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <Box style={{ flex: 1, marginLeft: "300px" }}>
        <Outlet />
      </Box>
    </Box>
  );
};
