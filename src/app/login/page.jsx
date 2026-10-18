import AuthForm from "../../components/account/AuthForm";
import "../account.css";
export const metadata = {
  title: "Inicia sesión | HEAT",
  robots: { index: false, follow: false },
};
export default function LoginPage() {
  return <AuthForm />;
}
