import { motion } from "framer-motion";
import { PhotonData, Basis } from "@/types/bb84";
import { Photon } from "./Photon";
import { Polarizer } from "./Polarizer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";

interface QuantumChannelProps {
  photons: PhotonData[];
  isActive: boolean;
  speed: "slow" | "normal" | "fast";
  onPhotonComplete?: (photonId: string) => void;
  aliceBasis?: Basis;
  bobBasis?: Basis;
  eveBasis?: Basis;
  eveEnabled?: boolean;
  currentRound?: number;
}

export const QuantumChannel = ({
  photons,
  isActive,
  speed,
  onPhotonComplete,
  aliceBasis = "+",
  bobBasis = "+",
  eveBasis = "+",
  eveEnabled = false,
  currentRound = 0,
}: QuantumChannelProps) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Zap className="w-5 h-5" />
          Quantum Channel
        </CardTitle>
      </CardHeader>

      <CardContent className="h-full">
        <div className="relative h-32 sm:h-36 quantum-channel rounded-xl overflow-hidden border border-border/60">
          {/* Quantum field background */}
          <div className="absolute inset-0 bg-gradient-to-r from-alice/5 via-primary/5 to-bob/5" />

          {/* Main channel guide */}
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-gradient-to-r from-alice/40 via-primary/60 to-bob/40 relative">
              {/* Quantum field lines */}
              <div className="absolute w-full h-8 top-1/2 -translate-y-1/2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-full h-px bg-primary/10"
                    style={{ top: `${i * 50}%` }}
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Polarizer positions */}
          <div className="absolute inset-0 flex items-center justify-between px-4">
            {/* Alice's polarizer */}
            <Polarizer
              basis={aliceBasis}
              position="alice"
              isActive={isActive}
              className="z-10"
            />

            {/* Eve's polarizer (if enabled) */}
            {eveEnabled && (
              <Polarizer
                basis={eveBasis}
                position="eve"
                isActive={isActive}
                className="z-10"
              />
            )}

            {/* Bob's polarizer */}
            <Polarizer
              basis={bobBasis}
              position="bob"
              isActive={isActive}
              className="z-10"
            />
          </div>

          {/* Photons */}
          <div className="absolute inset-0 w-full h-full">
            {photons
              .filter((photon) => !photon.isComplete)
              .map((photon) => (
                <Photon
                  key={photon.id}
                  photon={photon}
                  speed={speed}
                  onAnimationComplete={() => onPhotonComplete?.(photon.id)}
                />
              ))}
          </div>

          {/* Activity indicator */}
          {isActive && (
            <motion.div
              className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}

          {/* Quantum state label */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-full">
            Quantum Superposition
          </div>
        </div>

        {/* <div className="mt-4 text-xs text-muted-foreground space-y-1">
          <div>Polarized photons travel through quantum channel</div>
          <div>Arrows show polarization: ↑→ (+ basis), ↗↘ (× basis)</div>
          <div>Polarizers filter photons based on measurement basis</div>
        </div> */}
      </CardContent>
    </Card>
  );
};
