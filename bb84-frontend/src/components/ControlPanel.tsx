import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ProtocolState } from "@/types/bb84";
import {
  Settings,
  Play,
  Shuffle,
  Send,
  GitCompare,
  Key,
  RotateCcw,
  Zap,
  Timer,
} from "lucide-react";

interface ControlPanelProps {
  state: ProtocolState;
  onPrepareQubits: () => void;
  onSendQubits: () => void;
  onCompareBases: () => void;
  onGenerateKey: () => void;
  onReset: () => void;
  onModeChange: (mode: "without-eve" | "with-eve") => void;
  onAttackModelChange: (model: ProtocolState["attackModel"]) => void;
  onInterceptionProbabilityChange: (p: number) => void;
  onBiasedBasisChange: (b: "+" | "x") => void;
  onLossProbabilityChange: (p: number) => void;
  onSpeedChange: (speed: "slow" | "normal" | "fast") => void;
  onQubitCountChange: (count: number) => void;
  isProcessing: boolean;
}

export const ControlPanel = ({
  state,
  onPrepareQubits,
  onSendQubits,
  onCompareBases,
  onGenerateKey,
  onReset,
  onModeChange,
  onAttackModelChange,
  onInterceptionProbabilityChange,
  onBiasedBasisChange,
  onLossProbabilityChange,
  onSpeedChange,
  onQubitCountChange,
  isProcessing,
}: ControlPanelProps) => {
  const canPrepare = state.step === "idle";
  const canSend = state.step === "prepared";
  const canCompare =
    state.step === "measuring" && state.currentRound >= state.totalRounds;
  const canGenerateKey = state.step === "comparing";

  return (
    <Card className="border-primary/15">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Settings className="w-5 h-5" />
          BB84 Protocol Control
          <Badge variant="outline" className="ml-auto">
            Step: {state.step}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Mode</label>
            <Select
              value={state.mode}
              onValueChange={onModeChange}
              disabled={state.step !== "idle"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="without-eve">Secure Channel</SelectItem>
                <SelectItem value="with-eve">Eve Intercepts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Attack</label>
            <Select
              value={state.attackModel}
              onValueChange={(v) => onAttackModelChange(v as any)}
              disabled={state.step !== "idle" || state.mode === "without-eve"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="intercept-resend">Intercept-resend</SelectItem>
                <SelectItem value="partial">Partial (probabilistic)</SelectItem>
                <SelectItem value="biased">Biased basis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Speed</label>
            <Select value={state.speed} onValueChange={onSpeedChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    Slow
                  </div>
                </SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="fast">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Fast
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="qubit-count" className="text-sm font-medium">
              Qubits
            </label>
            <div className="flex items-center gap-2">
              <input
                id="qubit-count"
                type="number"
                min={4}
                max={60}
                value={state.totalRounds}
                onChange={(e) => onQubitCountChange(Number(e.target.value))}
                disabled={state.step !== "idle"}
                className="h-9 w-20 rounded-md border border-input bg-background/40 px-2 text-sm 
                 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring 
                 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Attack controls */}
        {state.mode !== "without-eve" && state.attackModel === "partial" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Interception probability</span>
              <span className="text-muted-foreground font-mono">
                {Math.round(state.interceptionProbability * 100)}%
              </span>
            </div>
            <Slider
              value={[Math.round(state.interceptionProbability * 100)]}
              onValueChange={(v) => onInterceptionProbabilityChange(v[0] / 100)}
              max={100}
              step={5}
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Photon loss</span>
            <span className="text-muted-foreground font-mono">
              {Math.round(state.lossProbability * 100)}%
            </span>
          </div>
          <Slider
            value={[Math.round(state.lossProbability * 100)]}
            onValueChange={(v) => onLossProbabilityChange(v[0] / 100)}
            max={100}
            step={5}
          />
          <div className="text-xs text-muted-foreground">
            Simulates real channel loss (fiber/free-space).
          </div>
        </div>

        {state.mode !== "without-eve" && state.attackModel === "biased" && (
          <div className="space-y-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Preferred basis</label>
              <Select
                value={state.biasedBasis}
                onValueChange={(v) => onBiasedBasisChange(v as any)}
                disabled={state.step !== "idle"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+">+ (rectilinear)</SelectItem>
                  <SelectItem value="x">× (diagonal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              Eve will always measure using the selected basis.
            </div>
          </div>
        )}

        {/* Protocol Steps */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onPrepareQubits}
            disabled={!canPrepare || isProcessing}
            variant={canPrepare ? "default" : "secondary"}
            size="sm"
            className="flex-1 min-w-fit"
          >
            <Shuffle className="w-4 h-4 mr-2" />
            1. Prepare Qubits
          </Button>

          <Button
            onClick={onSendQubits}
            disabled={!canSend || isProcessing}
            variant={canSend ? "default" : "secondary"}
            size="sm"
            className="flex-1 min-w-fit"
          >
            <Send className="w-4 h-4 mr-2" />
            2. Send Qubits
          </Button>

          <Button
            onClick={onCompareBases}
            disabled={!canCompare || isProcessing}
            variant={canCompare ? "default" : "secondary"}
            size="sm"
            className="flex-1 min-w-fit"
          >
            <GitCompare className="w-4 h-4 mr-2" />
            3. Compare Bases
          </Button>

          <Button
            onClick={onGenerateKey}
            disabled={!canGenerateKey || isProcessing}
            variant={canGenerateKey ? "default" : "secondary"}
            size="sm"
            className="flex-1 min-w-fit"
          >
            <Key className="w-4 h-4 mr-2" />
            4. Generate Key
          </Button>

         

          <Button
            onClick={onReset}
            disabled={isProcessing}
            variant="outline"
            size="sm"
            className="flex-1 min-w-fit"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Progress indicator */}
        {state.step !== "idle" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>
                {state.currentRound}/{state.totalRounds}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(state.currentRound / state.totalRounds) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-sm text-primary">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Processing quantum operations...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
