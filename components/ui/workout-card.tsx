import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Define the type for a single exercise
export interface Exercise {
  iconSrc: string;
  name: string;
  detail: string;
}

// Define the props for the WorkoutCard component
export interface WorkoutCardProps {
  date: string;
  wodTitle?: string;
  sessionTitle: string;
  sessionDuration: number;
  exercises: Exercise[];
  className?: string;
}

// Animation variants for the list container
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Stagger the animation of children by 0.1s
    },
  },
};

// Animation variants for each list item
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    }
  },
};

export const WorkoutCard = React.forwardRef<HTMLDivElement, WorkoutCardProps>(
  (
    {
      date,
      wodTitle = "WOD",
      sessionTitle,
      sessionDuration,
      exercises,
      className,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-full max-w-sm rounded-3xl bg-muted/60 p-2.5 font-sans border border-border/50 shadow-sm",
          className
        )}
      >
        {/* Header section for date and WOD title */}
        <div className="text-center pt-2">
          <p className="text-sm font-medium text-muted-foreground">{date}</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
            {wodTitle}
          </h2>
        </div>

        {/* Main content card */}
        <div className="mt-4 w-full rounded-2xl bg-card p-6 shadow-sm border border-border/40">
          {/* Session header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-card-foreground">
              {sessionTitle}
            </h3>
            <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-clock text-primary"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{sessionDuration} min</span>
            </div>
          </div>

          {/* Animated exercise list */}
          <motion.ul
            role="list"
            className="mt-6 space-y-3"
            initial="hidden"
            animate="visible"
            variants={listVariants}
          >
            {exercises.map((exercise, index) => (
              <motion.li
                key={index}
                role="listitem"
                className="flex items-center gap-4 rounded-xl bg-muted/70 p-3.5 hover:bg-muted transition-colors border border-border/30"
                variants={itemVariants}
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-background shadow-xs overflow-hidden">
                  <img
                    src={exercise.iconSrc}
                    alt={`${exercise.name} icon`}
                    className="h-9 w-9 object-cover rounded-lg"
                    onError={(e) => {
                      // Fallback SVG if external image fails to load
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.innerHTML = '<span class="text-lg">🏋️</span>';
                      }
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground text-sm truncate">{exercise.name}</p>
                  <p className="text-xs text-muted-foreground">{exercise.detail}</p>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    );
  }
);

WorkoutCard.displayName = "WorkoutCard";

