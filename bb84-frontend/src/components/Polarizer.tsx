import { motion } from "framer-motion";
import { Basis } from "@/types/bb84";
import { cn } from "@/lib/utils";

interface PolarizerProps {
  basis: Basis;
  position: "alice" | "bob" | "eve";
  isActive: boolean;
  className?: string;
}

export const Polarizer = ({ basis, position, isActive, className }: PolarizerProps) => {
  // Get rotation angle based on basis
  const getRotation = () => {
    if (basis === "+") {
      return 0; // Vertical/horizontal
    } else {
      return 45; // Diagonal
    }
  };

  const getColor = () => {
    switch (position) {
      case "alice": return "hsl(var(--alice))";
      case "bob": return "hsl(var(--bob))";
      case "eve": return "hsl(var(--eve))";
      default: return "hsl(var(--primary))";
    }
  };

  return (
    <motion.div
      className={cn("relative flex items-center justify-center", className)}
      animate={{
        scale: isActive ? 1.1 : 1,
        opacity: isActive ? 1 : 0.8,
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Polarizer frame */}
      <div 
        className="w-8 h-12 border-2 rounded-sm relative overflow-hidden"
        style={{ borderColor: getColor() }}
      >
        {/* Polarizer slits */}
        <motion.div
          className="absolute inset-1 flex items-center justify-center"
          animate={{ rotate: getRotation() }}
          transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
        >
          {/* Multiple thin slits to show polarization direction */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-px h-full mx-px opacity-60"
              style={{ backgroundColor: getColor() }}
            />
          ))}
        </motion.div>
      </div>

      {/* Basis label */}
      <div 
        className="absolute -bottom-6 text-xs font-mono font-bold"
        style={{ color: getColor() }}
      >
        {basis === "+" ? "+" : "×"}
      </div>

      {/* Active indicator */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-sm"
          animate={{ 
            boxShadow: [`0 0 0 0px ${getColor()}40`, `0 0 0 4px ${getColor()}20`, `0 0 0 0px ${getColor()}40`] 
          }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};