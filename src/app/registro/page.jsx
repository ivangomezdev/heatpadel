import AuthForm from "../../components/account/AuthForm";
import "../account.css";
export const metadata = {
  title: "Crea tu cuenta | HEAT",
  robots: { index: false, follow: false },
};
export default function RegisterPage() {
  return <AuthForm register />;
}
