import { WorkoutCard, Exercise } from "@/components/ui/workout-card";

// High quality gym exercises with reliable fitness icons & image URLs
const warmUpExercises: Exercise[] = [
  {
    iconSrc: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=100&auto=format&fit=crop&q=60",
    name: "Jumping Jacks",
    detail: "2 minutes high cadence",
  },
  {
    iconSrc: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=100&auto=format&fit=crop&q=60",
    name: "High Knees",
    detail: "4 sets x 45 seconds",
  },
  {
    iconSrc: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&auto=format&fit=crop&q=60",
    name: "Bicycle Crunches",
    detail: "20 reps each side",
  },
  {
    iconSrc: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=100&auto=format&fit=crop&q=60",
    name: "Barbell Deadlifts",
    detail: "5 sets x 5 reps (80% 1RM)",
  },
];

export default function WorkoutCardDemo() {
  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <WorkoutCard
        date="Today's Session"
        wodTitle="WOD • TITAN BURN"
        sessionTitle="Cardio & Core Conditioning"
        sessionDuration={45}
        exercises={warmUpExercises}
      />
    </div>
  );
}

