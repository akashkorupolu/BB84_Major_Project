import { motion } from "framer-motion";
import { Basis, Bit } from "@/types/bb84";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Check, X } from "lucide-react";

interface BobPanelProps {
  bases: Basis[];
  measurements: (Bit | null)[];
  lostPhotons?: boolean[];
  aliceBases: Basis[];
  currentRound: number;
  isActive: boolean;
  onBasisChoice?: (basis: Basis) => void;
  isManualMode?: boolean;
}

export const BobPanel = ({
  bases,
  measurements,
  lostPhotons = [],
  aliceBases,
  currentRound,
  isActive,
  onBasisChoice,
  isManualMode = false,
}: BobPanelProps) => {
  const basesMatch = (index: number) => {
    return (
      aliceBases[index] && bases[index] && aliceBases[index] === bases[index]
    );
  };

  return (
    <Card className="h-full border-bob/15 overflow-hidden">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 min-w-0">
        <CardTitle className="flex items-center gap-2 text-bob">
          <User className="w-5 h-5" />
          Bob
          <Badge variant="outline" className="border-bob/50 text-bob">
            Receiver
          </Badge>
        </CardTitle>

        {bases.length > 0 && (
          <div className="text-[11px] leading-snug text-muted-foreground sm:text-right min-w-0">
            <div className="truncate">✓ match, ✗ mismatch</div>
            <div className="truncate">Only matches form the key</div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          Measurement Bases & Results
        </div>

        {/* Manual basis selection for current round */}
        {isManualMode && isActive && currentRound < bases.length && (
          <div className="p-3 border border-bob/30 rounded-lg bg-bob/5">
            <div className="text-sm font-medium mb-2">
              Choose basis for round {currentRound + 1}:
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBasisChoice?.("+")}
                className="border-bob/50 hover:bg-bob/10"
              >
                + (Rectilinear)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBasisChoice?.("x")}
                className="border-bob/50 hover:bg-bob/10"
              >
                × (Diagonal)
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: Math.max(bases.length, 8) }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: index <= currentRound ? 1 : 0, // only show up to currentRound
                scale: index === currentRound ? 1.1 : 1,
                borderColor:
                  index === currentRound && isActive
                    ? "hsl(var(--bob))"
                    : "transparent",
              }}
              transition={{
                delay: index * 0.05,
                duration: 0.3,
                type: "spring",
                stiffness: 300,
              }}
              className={`relative h-20 border-2 rounded-xl p-1 text-center transition-colors
        ${
          index <= currentRound
            ? aliceBases[index] // only check match after reveal
              ? basesMatch(index)
                ? "bg-green-300 dark:bg-green-500 border-green-500"
                : "bg-red-300 dark:bg-red-500 border-red-500"
              : "bg-muted/20 border-border"
            : "bg-transparent border-transparent" // not yet revealed
        }
      `}
            >
              {/* Only render contents up to the current round */}
              {index <= currentRound && bases[index] && (
                <>
                  {/* Basis symbol */}
                  <div
                    className={`text-sm font-mono ${
                      bases[index] === "+" ? "basis-plus" : "basis-cross"
                    }`}
                  />

                  {/* Show measured result only if exists */}
                  {lostPhotons[index] ? (
                    <div className="text-[11px] font-mono mt-0.5 opacity-90">
                      lost
                    </div>
                  ) : measurements[index] !== null ? (
                    <div className="text-[11px] font-mono mt-0.5 opacity-90">
                      {measurements[index]}
                    </div>
                  ) : null}
                </>
              )}

              {/* Current round indicator */}
              {index === currentRound && isActive && (
                <motion.div
                  className="absolute -inset-1 border-2 border-bob rounded-lg"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
