import axios from "axios";
import { AttackModel, Basis, Bit } from "@/types/bb84";

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL?.toString?.() ||
  "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // ⬅ increased timeout for safety
  headers: {
    "Content-Type": "application/json",
  },
});

export interface SendQubitRequest {
  bit: Bit;
  basis: Basis;
}

export interface MeasureQubitRequest {
  basis: Basis;
}

export interface CompareBasesResponse {
  matching_indices: number[];
  alice_key: number[];
  bob_key: number[];
  error_count?: number;
  /** QBER in percent (0–100), computed on sifted bits */
  qber_percent?: number;
  photon_lost?: number;
  /** Same-basis rounds only; basis mismatches are not “errors” in QBER */
  discarded_basis_mismatch?: number;
  received_rounds?: number;
  error?: string;
  len_sent?: number;
  len_bob?: number;
}

/** Canonical BB84 bases: "+" rectilinear, "x" diagonal (ASCII only on the wire). */
export function normalizeBasis(b: string | null | undefined): Basis {
  if (b == null || b === "") return "+";
  const t = String(b).trim();
  if (t === "x" || t === "X" || t === "×" || t === "\u00d7") return "x";
  return "+";
}

/** Single-bit compare (JSON-safe: coerces bool/number). */
function bitEq(a: unknown, b: unknown): boolean {
  const x = typeof a === "boolean" ? (a ? 1 : 0) : Number(a) & 1;
  const y = typeof b === "boolean" ? (b ? 1 : 0) : Number(b) & 1;
  return x === y;
}

/**
 * QBER = (incorrect bits / compared bits); “compared” = sifted same-basis rounds
 * (matches backend). Returns a fraction in [0, 1], or null if inputs are unusable.
 */
export function computeQberFraction(
  alice: number[] | undefined,
  bob: number[] | undefined
): number | null {
  if (!alice?.length || !bob?.length) return null;
  const n = Math.min(alice.length, bob.length);
  if (n === 0) return null;
  let errors = 0;
  for (let i = 0; i < n; i++) {
    if (!bitEq(alice[i], bob[i])) errors++;
  }
  return errors / n;
}

export function countSiftedBitErrors(
  alice: number[] | undefined,
  bob: number[] | undefined
): number {
  if (!alice?.length || !bob?.length) return 0;
  const n = Math.min(alice.length, bob.length);
  let errors = 0;
  for (let i = 0; i < n; i++) {
    if (!bitEq(alice[i], bob[i])) errors++;
  }
  return errors;
}

/**
 * UI state may store QBER as a fraction (0–1) or accidentally as percent (0–100).
 * Returns a fraction in [0, 1] for display and progress bars.
 */
export function normalizeQberFraction(rate: number): number {
  if (!Number.isFinite(rate) || rate < 0) return 0;
  if (rate > 1) return Math.min(rate / 100, 1);
  return Math.min(rate, 1);
}

export interface FinalKeyResponse {
  shared_key?: string;
  shared_key_sha256?: string | null;
  error_rate?: number;
  sifted_count?: number;
  agreeing_count?: number;
  msg?: string;
  error?: string;
}

export interface BobMeasureResponse {
  msg: string;
  index: number;
  lost: boolean;
  bob_result?: {
    basis: Basis;
    measured: Bit;
  };
}

export interface EveInterceptResponse {
  msg: string;
  index: number;
  acted: boolean;
  eve_result?: {
    basis: Basis;
    measured: Bit;
  };
}

export class BB84Api {
  static async reset(eveCount?: number): Promise<void> {
    await api.post("/reset", eveCount ? { eve_count: eveCount } : undefined);
  }

  static async sendQubit(data: SendQubitRequest): Promise<void> {
    await api.post("/alice/send", {
      bit: data.bit,
      basis: normalizeBasis(data.basis),
    });
  }

  static async eveIntercept(
    index: number,
    params?: {
      attackModel?: AttackModel;
      interceptProb?: number;
      biasBasis?: Basis;
      biasProb?: number;
    }
  ): Promise<EveInterceptResponse> {
    const attackModel = params?.attackModel ?? "intercept-resend";
    const interceptProb = params?.interceptProb ?? 1;
    const biasBasis = normalizeBasis(params?.biasBasis ?? "+");
    const biasProb = params?.biasProb ?? 0.75;
    const response = await api.get(
      `/eve/intercept/${index}?attack_model=${encodeURIComponent(
        attackModel
      )}&intercept_prob=${encodeURIComponent(
        String(interceptProb)
      )}&bias_basis=${encodeURIComponent(biasBasis)}&bias_prob=${encodeURIComponent(
        String(biasProb)
      )}`
    );
    return response.data;
  }

  static async evesIntercept(
    index: number,
    params: {
      count: number;
      attackModel?: AttackModel;
      biasBasis?: Basis;
      biasProb?: number;
    }
  ): Promise<{
    msg: string;
    index: number;
    results: { eve: number; basis: Basis; measured: Bit }[];
  }> {
    const attackModel = params.attackModel ?? "intercept-resend";
    const biasBasis = normalizeBasis(params.biasBasis ?? "+");
    const biasProb = params.biasProb ?? 0.75;
    const response = await api.get(
      `/eves/intercept/${index}?count=${encodeURIComponent(
        String(params.count)
      )}&attack_model=${encodeURIComponent(
        attackModel
      )}&bias_basis=${encodeURIComponent(
        biasBasis
      )}&bias_prob=${encodeURIComponent(String(biasProb))}`
    );
    return response.data;
  }

  static async bobMeasure(
    index: number,
    data: MeasureQubitRequest,
    lossProb: number = 0
  ): Promise<BobMeasureResponse> {
    const response = await api.post(
      `/bob/measure/${index}?loss_prob=${encodeURIComponent(String(lossProb))}`,
      { basis: normalizeBasis(data.basis) }
    );
    return response.data;
  }

  static async compareBases(): Promise<CompareBasesResponse> {
    const response = await api.get("/compare-bases");
    return response.data;
  }

  static async getFinalKey(): Promise<FinalKeyResponse> {
    const response = await api.get("/final-key");
    return response.data;
  }

  // Health check
  static async healthCheck(): Promise<boolean> {
    try {
      await api.get("/health");
      return true;
    } catch {
      return false;
    }
  }
}

// Error handler
export const handleApiError = (error: any): string => {
  if (error.response) {
    return (
      error.response.data?.detail ||
      error.response.data?.message ||
      "Server error occurred"
    );
  } else if (error.request) {
    return "Unable to connect to backend server (port 8000). Make sure FastAPI is running.";
  } else {
    return "An unexpected error occurred";
  }
};