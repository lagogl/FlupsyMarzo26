import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('WebSocket') && event.reason?.message?.includes('localhost:undefined')) {
    console.warn('Vite HMR WebSocket error ignorato (non blocca l\'app):', event.reason.message);
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
