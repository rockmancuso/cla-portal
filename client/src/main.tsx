import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Try both possible root element IDs for compatibility
const container = document.getElementById("react-app-root") || document.getElementById("root");

if (container) {
  createRoot(container).render(<App />);
} else {
  console.error("Could not find root element with either 'react-app-root' or 'root' id!");
  
  // Create a root element as fallback
  const rootDiv = document.createElement('div');
  rootDiv.id = 'react-app-root';
  document.body.appendChild(rootDiv);
  createRoot(rootDiv).render(<App />);
}