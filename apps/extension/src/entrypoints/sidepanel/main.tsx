import "../../styles/app.css";
import ReactDOM from "react-dom/client";
import { SidebarApp } from "../../components/sidebar-app";

// Theme initialization is handled by useThemeStore in SidebarApp
// (persisted preference overrides system preference)

ReactDOM.createRoot(document.getElementById("root")!).render(<SidebarApp />);
