import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (import.meta.env.DEV) {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('WebSocket') && event.reason?.message?.includes('localhost:undefined')) {
      console.warn('[DEV] Vite HMR WebSocket error ignorato su mobile:', event.reason.message);
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
