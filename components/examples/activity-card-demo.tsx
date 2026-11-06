import { ActivityCard, Goal, Metric } from "@/components/ui/activity-card";
import { useState } from "react";

const INITIAL_METRICS: Metric[] = [
  { label: "Move", value: "540", trend: 90, unit: "cal" },
  { label: "Exercise", value: "48", trend: 80, unit: "min" },
  { label: "Stand", value: "11", trend: 92, unit: "hrs" },
];

const INITIAL_GOALS: Goal[] = [
  { id: "1", title: "30min Morning HIIT with Coach Elena", isCompleted: true },
  { id: "2", title: "10,000 Steps Target", isCompleted: true },
  { id: "3", title: "Post-workout Protein Shake (30g)", isCompleted: false },
  { id: "4", title: "Evening Sauna & Recovery Stretch", isCompleted: false },
];

export function ActivityCardDemo() {
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [metrics] = useState<Metric[]>(INITIAL_METRICS);

  const handleToggleGoal = (goalId: string) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId ? { ...goal, isCompleted: !goal.isCompleted } : goal
      )
    );
  };

  const handleAddGoal = () => {
    const title = prompt("Enter new fitness goal:");
    if (!title) return;
    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      title,
      isCompleted: false,
    };
    setGoals((prev) => [...prev, newGoal]);
  };

  const handleViewDetails = () => {
    alert("Viewing detailed biometric activity analytics.");
  };

  return (
    <div className="p-4 sm:p-8 flex justify-center">
      <div className="w-full max-w-md">
        <ActivityCard
          category="Daily Rings & Targets"
          title="Member Biometrics"
          metrics={metrics}
          dailyGoals={goals}
          onAddGoal={handleAddGoal}
          onToggleGoal={handleToggleGoal}
          onViewDetails={handleViewDetails}
        />
      </div>
    </div>
  );
}

export default ActivityCardDemo;

