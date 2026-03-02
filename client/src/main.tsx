import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeNativeApp } from "./lib/native-init";

initializeNativeApp();

createRoot(document.getElementById("root")!).render(<App />);
