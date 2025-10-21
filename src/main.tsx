import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { registerInstallPrompt, addStandaloneModeStyles } from "./utils/pwaUtils";

// Initialize PWA features
registerInstallPrompt();
addStandaloneModeStyles();

// Log app mode for debugging
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
console.log(`[App] Running in ${isStandalone ? 'standalone' : 'browser'} mode`);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="examtrakr-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
