"use client";

import * as React from "react";
import { Lock, Mail, Dumbbell, ShieldCheck, UserCheck, ArrowRight, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UserSession {
  email: string;
  name: string;
  role: "admin" | "staff" | "member";
  token?: string;
}

export interface LoginPageProps {
  onLoginSuccess?: (session: UserSession) => void;
  className?: string;
}

export function LoginPage({ onLoginSuccess, className }: LoginPageProps) {
  const [role, setRole] = React.useState<"admin" | "staff" | "member">("admin");
  const [email, setEmail] = React.useState("admin@apexfitness.com");
  const [password, setPassword] = React.useState("ApexAdmin2026!");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleRoleChange = (selectedRole: "admin" | "staff" | "member") => {
    setRole(selectedRole);
    setError(null);
    if (selectedRole === "admin") {
      setEmail("admin@apexfitness.com");
      setPassword("ApexAdmin2026!");
    } else if (selectedRole === "staff") {
      setEmail("reception@apexfitness.com");
      setPassword("StaffAccess2026!");
    } else {
      setEmail("liam.smith@example.com");
      setPassword("MemberPass2026!");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (!email.includes("@") || password.length < 4) {
        setError("Invalid email address or password format.");
        return;
      }

      const roleNames = {
        admin: "Administrator",
        staff: "Front Desk Coach",
        member: "Liam Smith (VIP Member)",
      };

      onLoginSuccess?.({
        email,
        name: roleNames[role],
        role,
        token: `apex-token-${Date.now()}`,
      });
    }, 600);
  };

  return (
    <div
      className={cn(
        "min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden font-sans",
        className
      )}
    >
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-card border border-border/70 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-sm">
        {/* Logo and Brand Title */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-primary to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 mb-4">
            <Dumbbell className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            APEX FITNESS
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">
            Gym Management & Biometrics Portal
          </p>
        </div>

        {/* Role Segmented Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted rounded-xl mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleRoleChange("admin")}
            className={cn(
              "py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
              role === "admin"
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange("staff")}
            className={cn(
              "py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
              role === "staff"
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Staff
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange("member")}
            className={cn(
              "py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
              role === "member"
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            Member
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gym.com"
                className="w-full bg-muted/50 border border-border/60 focus:border-primary rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground outline-hidden transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase text-muted-foreground">
                Password
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Please contact gym administrator to reset credentials.");
                }}
                className="text-xs text-primary hover:underline font-medium"
              >
                Forgot?
              </a>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-muted/50 border border-border/60 focus:border-primary rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground outline-hidden transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" defaultChecked className="rounded border-border text-primary" />
              Remember this terminal
            </label>
            <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              SSL Secured
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Sign In to Portal
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Quick Demo Hint */}
        <div className="mt-6 pt-5 border-t border-border/50 text-center">
          <p className="text-[11px] text-muted-foreground">
            Role selected: <strong className="text-foreground capitalize">{role}</strong>. Click any pill above to test different roles.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

