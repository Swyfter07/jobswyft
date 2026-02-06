import "../../styles/app.css";
import ReactDOM from "react-dom/client";
import { SidebarApp } from "../../components/sidebar-app";

// Apply dark mode class on <html> based on system preference
const mq = window.matchMedia("(prefers-color-scheme: dark)");
const applyTheme = () => {
  document.documentElement.classList.toggle("dark", mq.matches);
};
applyTheme();
mq.addEventListener("change", applyTheme);

ReactDOM.createRoot(document.getElementById("root")!).render(<SidebarApp />);
