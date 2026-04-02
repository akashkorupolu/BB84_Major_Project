import { motion } from "framer-motion";
import { PhotonData } from "@/types/bb84";
import { cn } from "@/lib/utils";

interface PhotonProps {
  photon: PhotonData;
  onAnimationComplete?: () => void;
  speed: "slow" | "normal" | "fast";
}

const SPEED_MAP = {
  slow: 1.4,
  normal: 0.8,
  fast: 0.4,
};

export const Photon = ({ photon, onAnimationComplete, speed }: PhotonProps) => {
  const { bit, basis } = photon;
  
  // Get photon shape based on basis
  const getPhotonShape = () => {
    if (basis === "+") {
      // Circle for + basis
      return (
        <div className={cn(
          "w-3 h-3 rounded-full shadow-lg",
          bit === 0 ? "bg-blue-400" : "bg-yellow-400"
        )} />
      );
    } else {
      // Diamond for x basis
      return (
        <div className={cn(
          "w-3 h-3 shadow-lg transform rotate-45",
          bit === 0 ? "bg-red-400" : "bg-green-400"
        )} />
      );
    }
  };

  return (
    <motion.div
      className="absolute"
      initial={{ 
        x: "0%", 
        opacity: 0, 
        scale: 0.8,
        y: "-50%"
      }}
      animate={{ 
        x: "100%", 
        opacity: 1, 
        scale: 1,
        backgroundColor: photon.isIntercepted ? "#ef4444" : undefined
      }}
      transition={{
        x: {
          duration: SPEED_MAP[speed],
          ease: "linear"
        },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
        backgroundColor: photon.isIntercepted ? {
          duration: 0.2,
          repeat: 2,
          repeatType: "reverse"
        } : {}
      }}
      onAnimationComplete={onAnimationComplete}
      style={{
        top: "50%",
        left: 0,
        right: 0
      }}
    >
      {getPhotonShape()}
      {/* Photon tail effect */}
      <motion.div
        className={cn(
          "absolute inset-0 w-8 h-1 -left-6 top-1/2 -translate-y-1/2 opacity-50 blur-sm rounded-full",
          basis === "+" ? (bit === 0 ? "bg-blue-400" : "bg-yellow-400") : (bit === 0 ? "bg-red-400" : "bg-green-400")
        )}
        animate={{ scaleX: [0.5, 1, 0.5] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
    </motion.div>
  );
};