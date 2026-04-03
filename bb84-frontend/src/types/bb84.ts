export type Basis = "+" | "x";
export type Bit = 0 | 1;

export type AttackModel = "intercept-resend" | "partial" | "biased";

export interface QubitData {
  bit: Bit;
  basis: Basis;
}

export interface ProtocolState {
  mode: "without-eve" | "with-eve";
  step: "idle" | "prepared" | "sending" | "measuring" | "comparing" | "complete";
  currentRound: number;
  totalRounds: number;
  aliceData: QubitData[];
  bobBases: Basis[];
  eveBasis: Basis[];
  attackModel: AttackModel;
  interceptionProbability: number; // 0..1, used by "partial"
  biasedBasis: Basis; // used by "biased"
  lossProbability: number; // 0..1 photon loss in channel
  bobMeasurements: (Bit | null)[];
  lostPhotons: boolean[];
  eveInterceptions: boolean[];
  matchingIndices: number[];
  /** Sifted positions where Alice and Bob used the same basis */
  siftedTotal: number;
  /** Among sifted bits, how often Alice's bit ≠ Bob's measurement */
  siftedErrorCount: number;
  sharedKey: string;
  sharedKeyHash: string;
  errorRate: number;
  speed: "slow" | "normal" | "fast";
}

export interface ChatMessage {
  id: string;
  sender: "alice" | "bob" | "eve" | "system";
  message: string;
  timestamp: number;
  round?: number;
}

export interface PhotonData {
  id: string;
  bit: Bit;
  basis: Basis;
  round: number;
  x: number;
  y: number;
  isIntercepted: boolean;
  isComplete: boolean;
}