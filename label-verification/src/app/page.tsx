import { auth } from "@/auth";
import { LandingPage } from "@/components/landing/landing-page";

export default async function Home() {
  const session = await auth();
  const role = session?.user?.role;
  return (
    <LandingPage
      isAuthenticated={Boolean(session?.user)}
      isPending={role === "PENDING"}
    />
  );
}
