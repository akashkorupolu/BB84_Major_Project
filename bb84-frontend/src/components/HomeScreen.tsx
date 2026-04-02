import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import {
  ArrowRight,
  Eye,
  Lock,
  MessageCircle,
  Play,
  Radar,
  Sparkles,
  Shield,
  Wand2,
} from "lucide-react";

interface HomeScreenProps {
  onStartSimulation: (mode: "without-eve" | "with-eve") => void;
}

export const HomeScreen = ({ onStartSimulation }: HomeScreenProps) => {
  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-20 pb-14 px-4">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Hero */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="px-3 py-1">
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Interactive BB84
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  <Shield className="h-3.5 w-3.5 mr-1" />
                  Quantum-safe concept
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  <Radar className="h-3.5 w-3.5 mr-1" />
                  Eavesdropper detection
                </Badge>
              </div>

              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
                Learn BB84 by running a{" "}
                <span className="bg-gradient-to-r from-primary via-primary-glow to-alice bg-clip-text text-transparent">
                  live key exchange
                </span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Generate qubits, send photons, compare bases, and see exactly
                when the channel becomes compromised.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="sm:min-w-[240px]"
                  onClick={() => onStartSimulation("without-eve")}
                >
                  <Play className="h-4 w-4" />
                  Start secure run
                  <ArrowRight className="h-4 w-4 ml-auto sm:ml-1" />
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  className="sm:min-w-[240px]"
                  onClick={() => onStartSimulation("with-eve")}
                >
                  <Eye className="h-4 w-4" />
                  Start with Eve
                  <ArrowRight className="h-4 w-4 ml-auto sm:ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <div className="text-xs text-muted-foreground">Alice</div>
                  <div className="text-sm font-medium text-alice">Sender</div>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <div className="text-xs text-muted-foreground">Bob</div>
                  <div className="text-sm font-medium text-bob">Receiver</div>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <div className="text-xs text-muted-foreground">Bases</div>
                  <div className="text-sm font-medium">+ / ×</div>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <div className="text-xs text-muted-foreground">Output</div>
                  <div className="text-sm font-medium">Key + QBER</div>
                </div>
              </div>
            </motion.div>

            {/* Right: “demo card” */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
            >
              <Card className="overflow-hidden border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-primary" />
                    What you’ll see
                    <Badge className="ml-auto" variant="secondary">
                      4 steps
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <div className="text-xs text-muted-foreground">
                        Prepare
                      </div>
                      <div className="mt-1 text-sm font-medium">
                        Random bits + bases
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <div className="text-xs text-muted-foreground">Send</div>
                      <div className="mt-1 text-sm font-medium">
                        Photons across channel
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <div className="text-xs text-muted-foreground">
                        Compare
                      </div>
                      <div className="mt-1 text-sm font-medium">
                        Keep matching bases
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <div className="text-xs text-muted-foreground">
                        Generate
                      </div>
                      <div className="mt-1 text-sm font-medium">
                        Shared key + QBER
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        Channel activity
                      </div>
                      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <Lock className="h-3.5 w-3.5" />
                        secure by default
                      </div>
                    </div>

                    <div className="mt-3 relative h-10 rounded-lg quantum-channel">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-primary"
                          style={{ left: 12 }}
                          animate={{
                            x: [0, 260],
                            opacity: [0, 1, 1, 0],
                          }}
                          transition={{
                            duration: 1.9,
                            delay: i * 0.18,
                            repeat: Infinity,
                            repeatDelay: 0.6,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div className="rounded-lg bg-muted/20 border border-border/60 p-2">
                        Alice encodes
                      </div>
                      <div className="rounded-lg bg-muted/20 border border-border/60 p-2 text-center">
                        channel
                      </div>
                      <div className="rounded-lg bg-muted/20 border border-border/60 p-2 text-right">
                        Bob measures
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* How it works (new layout) */}
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <Card className="lg:col-span-2 border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  How BB84 stays secure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="text-foreground font-medium">
                      Measurement changes the state
                    </div>
                    <div className="mt-1">
                      If Eve measures in the wrong basis, she introduces errors.
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="text-foreground font-medium">
                      Public basis comparison
                    </div>
                    <div className="mt-1">
                      Alice & Bob reveal bases (not bits) and sift matching
                      rounds.
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="text-foreground font-medium">
                      QBER signals tampering
                    </div>
                    <div className="mt-1">
                      Higher error rate strongly suggests interception.
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="text-foreground font-medium">
                      Key comes from matches only
                    </div>
                    <div className="mt-1">
                      Only same-basis measurements become the shared key.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-success" />
                  Pick a scenario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-success/30 bg-success/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">Secure channel</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Learn the ideal protocol flow.
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onStartSimulation("without-eve")}
                    >
                      Run
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="rounded-xl border border-eve/30 bg-eve/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">Eve intercepts</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        See detection via increased QBER.
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onStartSimulation("with-eve")}
                    >
                      Run
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};