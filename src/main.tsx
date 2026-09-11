import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { registerInstallPrompt, addStandaloneModeStyles } from "./utils/pwaUtils";
import { initializeNativeAndroid } from "./services/nativeAndroidCallbacks";

// Initialize Native Android detection and callbacks FIRST
initializeNativeAndroid();

// Initialize PWA features
registerInstallPrompt();
addStandaloneModeStyles();

// Log app mode for debugging
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
const isNativeApp = localStorage.getItem('app_source') === 'native-android';
console.log(`[App] Running in ${isStandalone ? 'standalone' : isNativeApp ? 'native-android' : 'browser'} mode`);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="examtrakr-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
