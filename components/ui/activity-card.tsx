// components/ui/activity-card.tsx
"use client";

import * as React from "react";
import { Activity, ArrowUpRight, Plus, Target, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Metric {
  label: string;
  value: string;
  trend: number;
  unit?: "cal" | "min" | "hrs";
}

export interface Goal {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface ActivityCardProps {
  category?: string;
  title?: string;
  metrics?: Metric[];
  dailyGoals?: Goal[];
  onAddGoal?: () => void;
  onToggleGoal?: (goalId: string) => void;
  onViewDetails?: () => void;
  className?: string;
}

const METRIC_COLORS = {
  Move: "#FF2D55",
  Exercise: "#2CD758",
  Stand: "#007AFF",
} as const;

export function ActivityCard({
  category = "Activity",
  title = "Today's Progress",
  metrics = [],
  dailyGoals = [],
  onAddGoal,
  onToggleGoal,
  onViewDetails,
  className
}: ActivityCardProps) {
  const [isHovering, setIsHovering] = React.useState<string | null>(null);

  const handleGoalToggle = (goalId: string) => {
    onToggleGoal?.(goalId);
  };

  return (
    <div
      className={cn(
        "relative h-full rounded-3xl p-6 font-sans",
        "bg-card text-card-foreground",
        "border border-border/60 shadow-sm",
        "hover:border-border transition-all duration-300",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-full bg-rose-500/10 dark:bg-rose-500/20">
          <Activity className="w-5 h-5 text-[#FF2D55]" />
        </div>
        <div>
          <h3 className="text-lg font-bold tracking-tight text-foreground">
            {title}
          </h3>
          <p className="text-xs font-medium text-muted-foreground">
            {category}
          </p>
        </div>
      </div>

      {/* Metrics Rings */}
      <div className="grid grid-cols-3 gap-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="relative flex flex-col items-center"
            onMouseEnter={() => setIsHovering(metric.label)}
            onMouseLeave={() => setIsHovering(null)}
          >
            <div className="relative w-22 h-22 sm:w-24 sm:h-24">
              <div className="absolute inset-0 rounded-full border-4 border-muted" />
              <div
                className={cn(
                  "absolute inset-0 rounded-full border-4 transition-all duration-500",
                  isHovering === metric.label && "scale-105"
                )}
                style={{
                  borderColor: METRIC_COLORS[metric.label as keyof typeof METRIC_COLORS] || "#3b82f6",
                  clipPath: `polygon(0 0, 100% 0, 100% ${metric.trend}%, 0 ${metric.trend}%)`,
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold tracking-tight text-foreground">
                  {metric.value}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                  {metric.unit}
                </span>
              </div>
            </div>
            <span className="mt-2.5 text-xs font-semibold text-foreground">
              {metric.label}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              {metric.trend}%
            </span>
          </div>
        ))}
      </div>

      {/* Goals Section */}
      <div className="mt-8 space-y-5">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Target className="w-4 h-4 text-primary" />
              Today's Goals
            </h4>
            <button
              type="button"
              onClick={onAddGoal}
              className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Add Goal"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {dailyGoals.map((goal) => (
              <button
                key={goal.id}
                type="button"
                onClick={() => handleGoalToggle(goal.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl cursor-pointer text-left",
                  "bg-muted/50 hover:bg-muted",
                  "border border-border/40 hover:border-border",
                  "transition-all duration-200"
                )}
              >
                <CheckCircle2
                  className={cn(
                    "w-5 h-5 flex-shrink-0 transition-colors",
                    goal.isCompleted
                      ? "text-emerald-500 fill-emerald-500/10"
                      : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium transition-all select-none",
                    goal.isCompleted
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  )}
                >
                  {goal.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-border/50">
          <button
            type="button"
            onClick={onViewDetails}
            className="inline-flex items-center gap-1.5 text-xs font-semibold
              text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            View Activity Details
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

