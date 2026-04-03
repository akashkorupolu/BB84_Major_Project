import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { 
  Key, 
  Shield, 
  AlertTriangle, 
  Copy, 
  TrendingUp,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { normalizeQberFraction } from "@/services/bb84Api";

export interface ResultsCardProps {
  sharedKey: string;
  sharedKeyHash: string;
  errorRate: number;
  isSecure: boolean;
  matchingBits: number;
  /** Total sifted bits (same-basis positions); optional detail for QBER */
  siftedTotal?: number;
  siftedErrorCount?: number;
  totalBits: number;
  errorHistory?: number[];
  /** After "Compare bases", show sifted QBER even before key generation */
  hasCompared?: boolean;
}

export function ResultsCard({
  sharedKey,
  sharedKeyHash,
  errorRate,
  isSecure,
  matchingBits,
  siftedTotal = 0,
  siftedErrorCount = 0,
  totalBits,
  errorHistory = [],
  hasCompared = false,
}: ResultsCardProps) {
  const { toast } = useToast();

  /** Prefer counts (always matches “mismatched / sifted”); else normalized fraction from state. */
  const qberFraction = useMemo(() => {
    if (siftedTotal > 0) {
      return Math.min(1, Math.max(0, siftedErrorCount / siftedTotal));
    }
    return normalizeQberFraction(errorRate);
  }, [siftedTotal, siftedErrorCount, errorRate]);

  const qberPercent = qberFraction * 100;

  const copyKey = () => {
    navigator.clipboard.writeText(sharedKey);
    toast({
      title: "Key copied!",
      description: "Shared key copied to clipboard",
      duration: 2000,
    });
  };

  const copySha = () => {
    navigator.clipboard.writeText(sharedKeyHash);
    toast({
      title: "Hash copied!",
      description: "SHA-256 hash copied to clipboard",
      duration: 2000,
    });
  };

  const chartData = errorHistory.map((rate, index) => ({
    round: index + 1,
    errorRate: normalizeQberFraction(rate) * 100,
  }));

  const getSecurityStatus = () => {
    if (!sharedKey) return { text: "No key generated", variant: "secondary" as const, icon: null };
    if (isSecure) return { 
      text: "Secure", 
      variant: "default" as const, 
      icon: <CheckCircle className="w-4 h-4" /> 
    };
    return { 
      text: "Compromised", 
      variant: "destructive" as const, 
      icon: <XCircle className="w-4 h-4" /> 
    };
  };

  const securityStatus = getSecurityStatus();

  return (
    <Card className="border-primary/15">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Key className="w-5 h-5" />
          Quantum Key Distribution Results
          <Badge 
            variant={securityStatus.variant}
            className="ml-auto flex items-center gap-1"
          >
            {securityStatus.icon}
            {securityStatus.text}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Shared Key */}
        {sharedKey ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Shared Key</label>
              <Button
                size="sm"
                variant="outline"
                onClick={copyKey}
                className="h-7 text-xs"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl font-mono text-sm break-all border border-border/60">
              {sharedKey || "No key generated yet"}
            </div>

            {sharedKeyHash && (
              <>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">SHA-256</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copySha}
                    className="h-7 text-xs"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="p-3 bg-muted/40 rounded-xl font-mono text-xs break-all border border-border/60">
                  {sharedKeyHash}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <div className="text-sm">Complete the protocol to generate a shared key</div>
          </div>
        )}

        {/* Key / sifting statistics */}
        {(sharedKey || hasCompared) && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-xl border border-border/60">
              <div className="text-2xl font-bold text-primary">
                {sharedKey ? sharedKey.length : "—"}
              </div>
              <div className="text-xs text-muted-foreground">Key Length</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Agreeing bits only
              </div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-xl border border-border/60">
              <div className="text-2xl font-bold text-success">{matchingBits}</div>
              <div className="text-xs text-muted-foreground">Sifted Bits</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-xl border border-border/60">
              <div className="text-2xl font-bold text-muted-foreground">{totalBits}</div>
              <div className="text-xs text-muted-foreground">Total Sent</div>
            </div>
          </div>
        )}

        {/* Error Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex flex-col gap-0.5 items-start">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Quantum Bit Error Rate (QBER)
              </span>
              <span className="text-[11px] font-normal text-muted-foreground font-mono">
                errors ÷ sifted bits (only rounds where Alice and Bob used the same basis)
              </span>
            </label>
            <span className={`text-sm font-mono ${
              qberFraction > 0.11 ? "text-destructive" : 
              qberFraction > 0.05 ? "text-warning" : "text-success"
            }`}>
              {qberPercent.toFixed(1)}%
            </span>
          </div>
          {siftedTotal > 0 && (
            <div className="text-xs text-muted-foreground">
              Mismatched bits on sifted key:{" "}
              <span className="font-mono text-foreground">
                {siftedErrorCount} / {siftedTotal}
              </span>
            </div>
          )}
          <Progress 
            value={qberPercent} 
            className="h-2"
          />
          <div className="text-xs text-muted-foreground">
            {qberFraction > 0.11 ? (
              <div className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="w-3 h-3" />
                High error rate suggests eavesdropping
              </div>
            ) : qberFraction > 0.05 ? (
              <div className="text-warning">Moderate error rate detected</div>
            ) : (
              <div className="flex items-center gap-1 text-success">
                <Shield className="w-3 h-3" />
                Low error rate indicates secure channel
              </div>
            )}
          </div>
        </div>

        {/* Error Rate Chart */}
        {chartData.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Error Rate Trend</label>
            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis 
                    dataKey="round" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    domain={[0, 25]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="errorRate" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Protocol Explanation */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
          <div>• Error rates below 5% typically indicate secure transmission</div>
          <div>• Error rates above 11% suggest possible eavesdropping</div>
          <div>• QBER is not “errors ÷ total photons”; mismatched bases are discarded in sifting</div>
          <div>• Only bits measured with matching bases enter the sifted QBER and key</div>
        </div>
      </CardContent>
    </Card>
  );
}