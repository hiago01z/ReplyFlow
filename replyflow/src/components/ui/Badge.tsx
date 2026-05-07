import { cn } from "@/lib/utils";

type Color = "gray" | "indigo" | "green" | "amber" | "red" | "blue" | "purple" | "teal";

interface BadgeProps {
  color?: Color;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}

const colors: Record<Color, string> = {
  gray:   "bg-gray-100   text-gray-600",
  indigo: "bg-indigo-100 text-indigo-700",
  green:  "bg-green-100  text-green-700",
  amber:  "bg-amber-100  text-amber-700",
  red:    "bg-red-100    text-red-700",
  blue:   "bg-blue-100   text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  teal:   "bg-teal-100   text-teal-700",
};

const dots: Record<Color, string> = {
  gray:   "bg-gray-400",
  indigo: "bg-indigo-500",
  green:  "bg-green-500",
  amber:  "bg-amber-500",
  red:    "bg-red-500",
  blue:   "bg-blue-500",
  purple: "bg-purple-500",
  teal:   "bg-teal-500",
};

export function Badge({ color = "gray", dot, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
        colors[color],
        className,
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dots[color])} />}
      {children}
    </span>
  );
}
