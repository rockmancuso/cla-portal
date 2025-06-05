import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Debug current location
console.log("Current URL:", window.location.href);
console.log("Current pathname:", window.location.pathname);

const container = document.getElementById("react-app-root");

if (container) {
  createRoot(container).render(<App />);
} else {
  console.error("Could not find react-app-root element");
}