import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Eye, AlertTriangle } from "lucide-react";
import { Basis } from "@/types/bb84";

interface EvePanelProps {
  isActive: boolean;
  interceptionRate: number;
  interceptedRounds: number[];
  totalRounds: number;
  onInterceptionRateChange?: (rate: number) => void;
  currentRound: number;
  evesBasis: Basis[];
}

export const EvePanel = ({
  isActive,
  interceptionRate,
  interceptedRounds,
  totalRounds,
  onInterceptionRateChange,
  currentRound,
  evesBasis,
}: EvePanelProps) => {
  const interceptionPercentage = Math.round(interceptionRate * 100);

  // Helper function to get basis symbol
  const getBasisSymbol = (basis: Basis) => {
    return basis === "+" ? "+" : "×";
  };

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card className="border-eve/20 bg-eve/5 overflow-hidden">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-eve">
            <Eye className="w-5 h-5" />
            Eve
            <Badge variant="destructive" className="bg-eve text-eve-foreground">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Eavesdropper
            </Badge>
          </CardTitle>
          <div className="text-[11px] leading-snug text-muted-foreground sm:text-right">
            <div className="truncate">
              Intercepted: {interceptedRounds.length}/{totalRounds}
            </div>
            <div className="truncate">
              Interception adds measurement disturbance
            </div>
            <div className="truncate text-eve/80">
              Basis: + (rectilinear), × (diagonal)
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            {/* <div className="text-sm text-muted-foreground min-w-fit">
              Interception Rate:
            </div>
            <div className="flex-1">
              <Slider
                value={[interceptionPercentage]}
                onValueChange={(values) => onInterceptionRateChange?.(values[0] / 100)}
                max={100}
                step={10}
                className="w-full"
              />
            </div> */}
            {/* <div className="text-sm font-mono text-eve min-w-fit">
              {interceptionPercentage}%
            </div> */}
          </div>

          <div className="grid grid-cols-8 sm:grid-cols-10 lg:grid-cols-12 gap-1">
            {Array.from({ length: totalRounds }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{
                  scale: 1,
                  backgroundColor: interceptedRounds.includes(index)
                    ? "hsl(var(--eve))"
                    : "hsl(var(--muted))",
                  borderColor:
                    index === currentRound && isActive
                      ? "hsl(var(--eve))"
                      : "transparent",
                }}
                transition={{ delay: index * 0.02 }}
                className="aspect-square rounded-lg border-2 flex items-center justify-center relative text-xs font-bold"
              >
                {/* Show basis for rounds up to and including current round if intercepted */}
                {index <= currentRound && evesBasis[index] && (
                  <span className="text-eve-foreground font-bold text-sm sm:text-base">
                    {evesBasis[index]}
                  </span>
                )}

                {index === currentRound && isActive && (
                  <motion.div
                    className="absolute inset-0 z-10 border border-eve rounded-lg"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                )}
              </motion.div>
            ))}
          </div>

          {isActive && (
            <motion.div
              className="text-xs text-eve"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ⚡ Intercepting the quantum channel
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
