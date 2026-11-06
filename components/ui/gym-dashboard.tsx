"use client";

import * as React from "react";
import { WorkoutCard, Exercise } from "@/components/ui/workout-card";
import { ActivityCard, Metric, Goal } from "@/components/ui/activity-card";
import { UserSession } from "@/components/ui/login-page";
import { 
  Users, CreditCard, DollarSign, Clock, Calendar, 
  Dumbbell, LogOut, CheckCircle, Search, Flame
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_EXERCISES: Exercise[] = [
  {
    iconSrc: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=100&auto=format&fit=crop&q=60",
    name: "Barbell Power Cleans",
    detail: "5 sets x 3 reps (Heavy)",
  },
  {
    iconSrc: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=100&auto=format&fit=crop&q=60",
    name: "Box Jumps & Burpees",
    detail: "4 rounds • 15 reps each",
  },
  {
    iconSrc: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&auto=format&fit=crop&q=60",
    name: "Assault Bike Sprints",
    detail: "10 rounds • 20s on / 10s off",
  },
  {
    iconSrc: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=100&auto=format&fit=crop&q=60",
    name: "Kettlebell Overhead Carries",
    detail: "3 x 50 meters (24kg)",
  },
];

const DEFAULT_METRICS: Metric[] = [
  { label: "Move", value: "620", trend: 92, unit: "cal" },
  { label: "Exercise", value: "52", trend: 86, unit: "min" },
  { label: "Stand", value: "12", trend: 100, unit: "hrs" },
];

const DEFAULT_GOALS: Goal[] = [
  { id: "1", title: "Complete WOD Session with Coach Marcus", isCompleted: true },
  { id: "2", title: "Reach 500 Active Workout Calories", isCompleted: true },
  { id: "3", title: "20min Post-Workout Recovery Stretch", isCompleted: false },
  { id: "4", title: "Hydration Target: 2.5 Liters Water", isCompleted: false },
];

export interface GymDashboardProps {
  userSession?: UserSession;
  onLogout?: () => void;
  className?: string;
}

export function GymDashboard({
  userSession = { name: "Administrator", role: "admin", email: "admin@apexfitness.com" },
  onLogout,
  className
}: GymDashboardProps) {
  const [goals, setGoals] = React.useState<Goal[]>(DEFAULT_GOALS);
  const [checkinId, setCheckinId] = React.useState("");
  const [checkinStatus, setCheckinStatus] = React.useState<string | null>(null);

  const handleToggleGoal = (id: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, isCompleted: !g.isCompleted } : g));
  };

  const handleAddGoal = () => {
    const title = prompt("Enter new daily fitness target:");
    if (!title) return;
    setGoals(prev => [...prev, { id: `g-${Date.now()}`, title, isCompleted: false }]);
  };

  const handleQuickCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinId) return;
    setCheckinStatus(`Member #${checkinId} successfully checked in at ${new Date().toLocaleTimeString()}!`);
    setCheckinId("");
    setTimeout(() => setCheckinStatus(null), 4000);
  };

  return (
    <div className={cn("min-h-screen bg-background text-foreground font-sans", className)}>
      {/* Top Navigation */}
      <header className="border-b border-border/60 bg-card/50 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center shadow-md">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight">APEX FITNESS</h1>
            <p className="text-[10px] font-bold text-cyan-500 tracking-wider uppercase">Enterprise Management</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-foreground">{userSession.name}</div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase">{userSession.role} Access</div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Welcome Banner & Quick Check-in */}
        <div className="rounded-3xl bg-gradient-to-r from-card via-card to-muted p-6 sm:p-8 border border-border/60 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
              <Flame className="w-3.5 h-3.5" />
              Live Gym Terminal
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {userSession.name.split(" ")[0]}!
            </h2>
            <p className="text-sm text-muted-foreground">
              Peak hours in progress • 34 active athletes currently checked in on floor.
            </p>
          </div>

          {/* Quick Check-in Form */}
          <form onSubmit={handleQuickCheckin} className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                placeholder="Enter Member ID..."
                value={checkinId}
                onChange={(e) => setCheckinId(e.target.value)}
                className="w-full sm:w-48 pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-border focus:border-primary outline-hidden"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Check-in
            </button>
          </form>
        </div>

        {checkinStatus && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {checkinStatus}
          </div>
        )}

        {/* KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase">Total Members</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground">1,248</div>
            <span className="text-[11px] font-medium text-emerald-500">+14 this week</span>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase">Active Subscriptions</span>
              <CreditCard className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground">1,092</div>
            <span className="text-[11px] font-medium text-muted-foreground">87% retention rate</span>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase">Monthly Revenue</span>
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground">$48,290</div>
            <span className="text-[11px] font-medium text-emerald-500">+8.4% vs last mo</span>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase">Today's Visits</span>
              <Clock className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground">312</div>
            <span className="text-[11px] font-medium text-muted-foreground">Peak at 6:30 PM</span>
          </div>
        </div>

        {/* Feature Cards Showcase (WorkoutCard & ActivityCard) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Daily Athlete Telemetry</h3>
              <p className="text-xs text-muted-foreground">Workout of the Day programming & Apple Health Activity Rings</p>
            </div>
            <span className="text-xs font-semibold text-primary">Live Sync</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {/* 1. Workout Card Component */}
            <div className="flex justify-center">
              <WorkoutCard
                date="Today • Nov 6"
                wodTitle="WOD • SPARTAN ENGINE"
                sessionTitle="Functional Hypertrophy"
                sessionDuration={50}
                exercises={DEFAULT_EXERCISES}
              />
            </div>

            {/* 2. Activity Card Component */}
            <div className="flex justify-center">
              <ActivityCard
                category="Biomechanics & Health"
                title="Member Progress Ring"
                metrics={DEFAULT_METRICS}
                dailyGoals={goals}
                onAddGoal={handleAddGoal}
                onToggleGoal={handleToggleGoal}
                onViewDetails={() => alert("Biometric ring analytics synced with backend telemetry.")}
              />
            </div>

            {/* 3. Classes Schedule Mini Card */}
            <div className="rounded-3xl p-6 bg-card border border-border/60 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-bold text-foreground">Today's Scheduled Classes</h4>
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">3 Sessions</span>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-muted/60 border border-border/40">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>Sunrise Spin Rhythm</span>
                    <span className="text-emerald-500">12/15 Full</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">Coach Vance • 07:00 AM (45 min)</div>
                </div>

                <div className="p-3 rounded-xl bg-muted/60 border border-border/40">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>Barbell Compound Foundations</span>
                    <span className="text-cyan-500">8/10 Full</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">Coach Rostova • 10:00 AM (60 min)</div>
                </div>

                <div className="p-3 rounded-xl bg-muted/60 border border-border/40">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>Sunset Vinyasa Yoga Flow</span>
                    <span className="text-amber-500">18/20 Full</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">Coach Chen • 06:30 PM (60 min)</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => alert("Booking terminal opening...")}
                className="w-full py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs border border-border transition-colors cursor-pointer"
              >
                View Full Weekly Schedule
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default GymDashboard;

