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
}

export interface FinalKeyResponse {
  shared_key?: string;
  shared_key_sha256?: string;
  error_rate: number;
  msg?: string;
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

export interface VisualizationResponse {
  img_base64: string;
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
    await api.post("/alice/send", data);
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
    const biasBasis = params?.biasBasis ?? "+";
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
    const biasBasis = params.biasBasis ?? "+";
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
      data
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

  // Visualization APIs
  static async getCircuit(index: number): Promise<VisualizationResponse> {
    const response = await api.get(`/visualize/circuit/${index}`);
    return response.data;
  }

  static async getBloch(index: number): Promise<VisualizationResponse> {
    const response = await api.get(`/visualize/bloch/${index}`);
    return response.data;
  }

  static async getOverallCircuit(
    eve: boolean = false
  ): Promise<{ img_base64: string }> {
    const response = await api.get(`/visualize/overall-circuit?eve=${eve}`);
    return response.data;
  }

  static async getOverallAliceCircuit(): Promise<{ img_base64: string }> {
    const response = await api.get("/visualize/overall/alice");
    return response.data;
  }

  static async getOverallEveCircuit(): Promise<{ img_base64: string }> {
    const response = await api.get("/visualize/overall/eve");
    return response.data;
  }

  static async getOverallBobCircuit(): Promise<{ img_base64: string }> {
    const response = await api.get("/visualize/overall/bob");
    return response.data;
  }

  static async getQubitVisualization(
    who: "alice" | "eve" | "bob",
    index: number
  ): Promise<{
    error: any;
    circuit: string;
    bloch: string;
  }> {
    const response = await api.get(`/visualize/${who}/${index}`);
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