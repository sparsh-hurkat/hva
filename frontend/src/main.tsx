import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTheme, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { App } from "./App";

const queryClient = new QueryClient();

// Slightly larger base font sizes than Mantine's default, so the dashboard reads
// comfortably for a non-technical audience, not just engineers.
const theme = createTheme({
  primaryColor: "blue",
  defaultRadius: "md",
  fontSizes: {
    xs: "13px",
    sm: "15px",
    md: "16px",
    lg: "18px",
    xl: "22px",
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </MantineProvider>
  </React.StrictMode>,
);
