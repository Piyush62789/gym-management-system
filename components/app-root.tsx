"use client";

import * as React from "react";
import { LoginPage, UserSession } from "@/components/ui/login-page";
import { GymDashboard } from "@/components/ui/gym-dashboard";

export function AppRoot() {
  const [session, setSession] = React.useState<UserSession | null>(null);

  if (!session) {
    return <LoginPage onLoginSuccess={(user) => setSession(user)} />;
  }

  return (
    <GymDashboard
      userSession={session}
      onLogout={() => setSession(null)}
    />
  );
}

export default AppRoot;

