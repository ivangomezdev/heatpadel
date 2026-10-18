import Dashboard from "../../components/account/Dashboard";
import "../account.css";
import "../competition.css";
export const metadata = {
  title: "Mi cancha, mi juego | HEAT",
  robots: { index: false, follow: false },
};
export default function DashboardPage() {
  return <Dashboard />;
}
