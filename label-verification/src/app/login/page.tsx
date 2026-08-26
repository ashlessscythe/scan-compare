import { redirect } from "next/navigation";

/** Auth UI is unified on /register (signup + login). */
export default function LoginPage() {
  redirect("/register?mode=login");
}
