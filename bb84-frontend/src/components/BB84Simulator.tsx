import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button"; // if you’re using shadcn/ui
import {
  ProtocolState,
  ChatMessage,
  PhotonData,
  QubitData,
  Basis,
  Bit,
} from "@/types/bb84";
import { AlicePanel } from "./AlicePanel";
import { BobPanel } from "./BobPanel";
import { QuantumChannel } from "./QuantumChannel";
import { EvePanel } from "./EvePanel";
import { ControlPanel } from "./ControlPanel";
import { ChatLog } from "./ChatLog";
import { ResultsCard } from "./ResultsCard";
import { Navbar } from "./Navbar";
import {
  BB84Api,
  computeQberFraction,
  countSiftedBitErrors,
  normalizeQberFraction,
  handleApiError,
} from "@/services/bb84Api";
import { useToast } from "@/hooks/use-toast";
import { HackathonFooter } from "./HackathonFooter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const generateRandomBit = (): Bit => (Math.random() < 0.5 ? 0 : 1);
const generateRandomBasis = (): Basis => (Math.random() < 0.5 ? "+" : "x");

export const BB84Simulator = ({
  mode,
  onBack,
}: {
  mode: "without-eve" | "with-eve";
  onBack: () => void;
}) => {
  const { toast } = useToast();

  const [state, setState] = useState<ProtocolState>({
    mode,
    step: "idle",
    currentRound: 10000,
    totalRounds: 8,
    aliceData: [],
    bobBases: [],
    eveBasis: [],
    attackModel: "intercept-resend",
    interceptionProbability: 0.3,
    biasedBasis: "+",
    lossProbability: 0.0,
    bobMeasurements: [],
    lostPhotons: [],
    eveInterceptions: [],
    matchingIndices: [],
    siftedTotal: 0,
    siftedErrorCount: 0,
    sharedKey: "",
    sharedKeyHash: "",
    errorRate: 0,
    speed: "normal",
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [photons, setPhotons] = useState<PhotonData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [eveInterceptionRate, setEveInterceptionRate] = useState(1.0);
  const [errorHistory, setErrorHistory] = useState<number[]>([]);

  const simulationGridRef = useRef<HTMLDivElement | null>(null);
  const keyResultsRef = useRef<HTMLDivElement | null>(null);

  const addMessage = useCallback(
    (sender: ChatMessage["sender"], message: string, round?: number) => {
      const newMessage: ChatMessage = {
        id: `${Date.now()}-${Math.random()}`,
        sender,
        message,
        timestamp: Date.now(),
        round,
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    []
  );

  const generateQubits = useCallback((): QubitData[] => {
    return Array.from({ length: state.totalRounds }, () => ({
      bit: generateRandomBit(),
      basis: generateRandomBasis(),
    }));
  }, [state.totalRounds]);

  const generateBobBases = useCallback((): Basis[] => {
    return Array.from({ length: state.totalRounds }, () =>
      generateRandomBasis()
    );
  }, [state.totalRounds]);

  const generateEveBases = useCallback((): Basis[] => {
    return Array.from({ length: state.totalRounds }, () =>
      generateRandomBasis()
    );
  }, [state.totalRounds]);

  const onPrepareQubits = useCallback(async () => {
    // Delay scroll until React updates the DOM
    setTimeout(() => {
      const element = simulationGridRef.current;
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        // Add offset after scrollIntoView
        setTimeout(() => {
          window.scrollBy({
            top: -150, // negative value moves up by 100px
            behavior: "smooth",
          });
        }, 300); // delay to let scrollIntoView finish
      }
    }, 100);

    try {
      setIsProcessing(true);
      await BB84Api.reset(state.mode === "with-eve" ? 1 : undefined);

      const aliceData = generateQubits();
      const bobBases = generateBobBases();
      // Eve bases should reflect actual interception choices (filled during send)
      const eveBasis =
        mode === "with-eve"
          ? (new Array(state.totalRounds).fill("+") as Basis[])
          : generateEveBases();

      setState((prev) => ({
        ...prev,
        step: "prepared",
        currentRound: -1,
        aliceData,
        bobBases,
        eveBasis,
        bobMeasurements: new Array(state.totalRounds).fill(null),
        lostPhotons: new Array(state.totalRounds).fill(false),
        eveInterceptions: [],
        matchingIndices: [],
        siftedTotal: 0,
        siftedErrorCount: 0,
        sharedKey: "",
        sharedKeyHash: "",
        errorRate: 0,
      }));

      setMessages([]);
      setPhotons([]);
      setErrorHistory([]);

      addMessage(
        "system",
        `Prepared ${state.totalRounds} random qubits with random bases`
      );
      addMessage(
        "alice",
        `Generated ${state.totalRounds} qubits for transmission`
      );
    } catch (error) {
      toast({
        title: "Error",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [state.totalRounds, generateQubits, generateBobBases, addMessage, toast]);

  const onSendQubits = useCallback(async () => {
    if (state.aliceData.length === 0) return;

    // Delay scroll until React updates the DOM
    setTimeout(() => {
      const element = simulationGridRef.current;
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        // Add offset after scrollIntoView
        setTimeout(() => {
          window.scrollBy({
            top: -150, // negative value moves up by 100px
            behavior: "smooth",
          });
        }, 300); // delay to let scrollIntoView finish
      }
    }, 100);

    try {
      setIsProcessing(true);
      setState((prev) => ({ ...prev, step: "sending", currentRound: 0 }));

      const eveInterceptions: boolean[] = [];
      const bobMeasurements: (Bit | null)[] = new Array(state.totalRounds).fill(
        null
      );
      const lostPhotons: boolean[] = new Array(state.totalRounds).fill(false);

      for (let i = 0; i < state.aliceData.length; i++) {
        const qubit = state.aliceData[i];
        const bobBasis = state.bobBases[i];

        // Update current round
        setState((prev) => ({ ...prev, currentRound: i }));

        // Send qubit from Alice
        await BB84Api.sendQubit({ bit: qubit.bit, basis: qubit.basis });
        addMessage("alice", `Sent bit ${qubit.bit} in ${qubit.basis} basis`, i);

        // Create and animate photon
        const photon: PhotonData = {
          id: `photon-${i}`,
          bit: qubit.bit,
          basis: qubit.basis,
          round: i,
          x: 0,
          y: 0,
          isIntercepted: false,
          isComplete: false,
        };

        setPhotons((prev) => [...prev, photon]);

        // Eve interception (attack model)
        if (state.mode === "with-eve") {
          const intercept = await BB84Api.eveIntercept(i, {
            attackModel: state.attackModel,
            interceptProb: state.interceptionProbability, // used by "partial"
            biasBasis: state.biasedBasis, // used by "biased"
            biasProb: 1, // deterministic biased basis
          });

          const acted = intercept.acted;
          eveInterceptions[i] = acted;
          photon.isIntercepted = acted;

          if (acted && intercept.eve_result) {
            setState((prev) => {
              const next = { ...prev };
              const bases = [...next.eveBasis];
              bases[i] = intercept.eve_result!.basis;
              next.eveBasis = bases;
              return next;
            });

            if (state.attackModel === "intercept-resend") {
              addMessage(
                "eve",
                `Intercept-resend: measured qubit ${i + 1} (state collapsed)`,
                i
              );
            } else if (state.attackModel === "partial") {
              addMessage("eve", `Partial attack: intercepted qubit ${i + 1}`, i);
            } else if (state.attackModel === "biased") {
              addMessage("eve", `Biased attack: intercepted qubit ${i + 1}`, i);
            } else {
              addMessage("eve", `Intercepted qubit ${i + 1}`, i);
            }
          }
        } else {
          eveInterceptions[i] = false;
        }

        const bobResponse = await BB84Api.bobMeasure(
          i,
          { basis: bobBasis },
          state.lossProbability
        );

        if (bobResponse.lost) {
          lostPhotons[i] = true;
          bobMeasurements[i] = null;
          addMessage("system", `📡 Photon lost in channel (round ${i + 1})`, i);
        } else {
          const m = bobResponse.bob_result!.measured;
          bobMeasurements[i] = m;
          addMessage("bob", `Measured in ${bobBasis} basis → ${m}`, i);
        }
        // Wait for animation
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            state.speed === "fast"
              ? 500
              : state.speed === "normal"
              ? 1000
              : 1500
          )
        );
      }

      setState((prev) => ({
        ...prev,
        step: "measuring",
        currentRound: state.totalRounds,
        bobMeasurements,
        lostPhotons,
        eveInterceptions,
      }));

      addMessage("system", "All qubits transmitted and measured");
    } catch (error) {
      toast({
        title: "Error",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [state, eveInterceptionRate, addMessage, toast]);

  const onCompareBases = useCallback(async () => {
    // Delay scroll until React updates the DOM
    setTimeout(() => {
      const element = simulationGridRef.current;
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        // Add offset after scrollIntoView
        setTimeout(() => {
          window.scrollBy({
            top: -150, // negative value moves up by 100px
            behavior: "smooth",
          });
        }, 300); // delay to let scrollIntoView finish
      }
    }, 100);
    try {
      setIsProcessing(true);

      const result = await BB84Api.compareBases();

      const siftedTotal = result.alice_key?.length ?? 0;
      const siftedErrorCount =
        result.error_count != null && !Number.isNaN(result.error_count)
          ? result.error_count
          : countSiftedBitErrors(result.alice_key, result.bob_key);

      const fromKeys = computeQberFraction(result.alice_key, result.bob_key);
      const fromApiPercent =
        result.qber_percent != null && !Number.isNaN(result.qber_percent)
          ? result.qber_percent / 100
          : null;
      // Authoritative: errors ÷ sifted when we have counts (matches progress bar).
      const qberFraction =
        siftedTotal > 0
          ? siftedErrorCount / siftedTotal
          : fromKeys !== null
            ? fromKeys
            : fromApiPercent !== null
              ? fromApiPercent
              : 0;

      setState((prev) => ({
        ...prev,
        step: "comparing",
        matchingIndices: result.matching_indices,
        siftedTotal,
        siftedErrorCount,
        errorRate: normalizeQberFraction(qberFraction),
      }));

      addMessage(
        "system",
        `Publicly compared bases: ${result.matching_indices.length} matches found`
      );
      addMessage(
        "system",
        `Sifted QBER: ${(qberFraction * 100).toFixed(1)}%`
      );
      addMessage(
        "alice",
        `Keeping bits at positions: ${result.matching_indices.join(", ")}`
      );
      addMessage(
        "bob",
        `Keeping bits at positions: ${result.matching_indices.join(", ")}`
      );
    } catch (error) {
      toast({
        title: "Error",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [addMessage, toast]);

  const onGenerateKey = useCallback(async () => {
    
    setTimeout(() => {
      keyResultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
    try {
      setIsProcessing(true);

      const result = await BB84Api.getFinalKey();

      if ("error" in result && result.error) {
        toast({
          title: "Compare bases first",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      let errPct: number;
      let errFraction: number;
      const sc = result.sifted_count;
      const ac = result.agreeing_count;
      if (
        sc != null &&
        ac != null &&
        sc > 0 &&
        !Number.isNaN(sc) &&
        !Number.isNaN(ac)
      ) {
        errFraction = normalizeQberFraction((sc - ac) / sc);
        errPct = errFraction * 100;
      } else if (result.error_rate != null && !Number.isNaN(result.error_rate)) {
        errFraction = normalizeQberFraction(result.error_rate);
        errPct = errFraction * 100;
      } else {
        const comp = await BB84Api.compareBases();
        const q = computeQberFraction(comp.alice_key, comp.bob_key);
        errFraction = normalizeQberFraction(q ?? 0);
        errPct = errFraction * 100;
      }

      setState((prev) => ({
        ...prev,
        step: "complete",
        sharedKey: result.shared_key ?? "",
        sharedKeyHash: result.shared_key_sha256 ?? "",
        errorRate: errFraction,
        siftedTotal: result.sifted_count ?? prev.siftedTotal,
        siftedErrorCount:
          result.sifted_count != null && result.agreeing_count != null
            ? result.sifted_count - result.agreeing_count
            : prev.siftedErrorCount,
      }));
      setErrorHistory((prev) => [...prev, errFraction]);

      if (result.shared_key) {
        addMessage("system", `✅ Shared key generated: ${result.shared_key}`);
        if (result.shared_key_sha256) {
          addMessage("system", `SHA-256: ${result.shared_key_sha256}`);
        }
        addMessage("system", `QBER (sifted bits): ${errPct.toFixed(1)}%`);
        if (
          result.sifted_count != null &&
          result.agreeing_count != null
        ) {
          addMessage(
            "system",
            `Agreeing bits: ${result.agreeing_count} / ${result.sifted_count} sifted`
          );
        }

        if (errPct > 20) {
          addMessage(
            "system",
            "⚠️ High error rate detected - possible eavesdropping!"
          );
        } else {
          addMessage(
            "system",
            "🔒 Low error rate - secure communication established"
          );
        }
      } else {
        addMessage(
          "system",
          `❌ Key generation aborted: ${result.msg ?? "High QBER"}`
        );
        if (errPct > 0) {
          addMessage("system", `QBER (sifted bits): ${errPct.toFixed(1)}%`);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [addMessage, toast]);

  const onReset = useCallback(() => {
    setState({
      mode: state.mode,
      step: "idle",
      currentRound: 0,
      totalRounds: state.totalRounds,
      aliceData: [],
      bobBases: [],
      eveBasis: [],
      attackModel: state.attackModel,
      interceptionProbability: state.interceptionProbability,
      biasedBasis: state.biasedBasis,
      lossProbability: state.lossProbability,
      bobMeasurements: [],
      lostPhotons: [],
      eveInterceptions: [],
      matchingIndices: [],
      siftedTotal: 0,
      siftedErrorCount: 0,
      sharedKey: "",
      sharedKeyHash: "",
      errorRate: 0,
      speed: state.speed,
    });
    setMessages([]);
    setPhotons([]);
    setErrorHistory([]);
    setIsProcessing(false);
    addMessage("system", "Protocol reset - ready for new simulation");
  }, [
    state.mode,
    state.totalRounds,
    state.speed,
    state.attackModel,
    state.interceptionProbability,
    state.biasedBasis,
    state.lossProbability,
    addMessage,
  ]);

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-16 lg:pt-20 p-4">
        {/* Back Button */}
        <div className="w-full mx-auto mb-6 flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-muted/40 hover:bg-muted/60 rounded-xl text-sm font-medium transition-colors border border-border/60"
          >
            ← Back to Home
          </button>
          <div className="hidden md:block text-xs text-muted-foreground">
            Tip: run “Prepare → Send → Compare → Generate” to complete the protocol.
          </div>
        </div>

        <div className="w-full mx-auto space-y-4">
          {/* Header */}
          <div className="text-center space-y-1">
            <motion.h1
              className="text-3xl sm:text-4xl font-semibold tracking-tight bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              BB84 Quantum Key Distribution
            </motion.h1>
            <motion.p
              className="text-muted-foreground text-base sm:text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Interactive demonstration of quantum cryptography protocol
            </motion.p>
          </div>

          {/* Main Layout */}
          <div
            ref={simulationGridRef}
            className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)_420px] gap-6 items-start"
          >
            {/* Left: Controls */}
            <div className="space-y-6 xl:sticky xl:top-24">
              <ControlPanel
                state={state}
                onPrepareQubits={onPrepareQubits}
                onSendQubits={onSendQubits}
                onCompareBases={onCompareBases}
                onGenerateKey={onGenerateKey}
                onReset={onReset}
                onModeChange={(mode) => setState((prev) => ({ ...prev, mode }))}
                onAttackModelChange={(attackModel) =>
                  setState((prev) => ({ ...prev, attackModel }))
                }
                onInterceptionProbabilityChange={(interceptionProbability) =>
                  setState((prev) => ({ ...prev, interceptionProbability }))
                }
                onBiasedBasisChange={(biasedBasis) =>
                  setState((prev) => ({ ...prev, biasedBasis }))
                }
                onLossProbabilityChange={(lossProbability) =>
                  setState((prev) => ({ ...prev, lossProbability }))
                }
                onSpeedChange={(speed) =>
                  setState((prev) => ({ ...prev, speed }))
                }
                onQubitCountChange={(count) =>
                  setState((prev) => ({ ...prev, totalRounds: count }))
                }
                isProcessing={isProcessing}
              />
            </div>

            {/* Center: Simulation */}
            <div className="space-y-6">
              {/* Eve Panel (only when active) */}
              <AnimatePresence>
                {state.mode === "with-eve" && (
                  <EvePanel
                    isActive={state.step === "sending"}
                    interceptionRate={eveInterceptionRate}
                    interceptedRounds={state.eveInterceptions
                      .map((intercepted, i) => (intercepted ? i : -1))
                      .filter((i) => i >= 0)}
                    totalRounds={state.totalRounds}
                    onInterceptionRateChange={setEveInterceptionRate}
                    currentRound={state.currentRound}
                    evesBasis={state.eveBasis}
                  />
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AlicePanel
                  qubits={state.aliceData}
                  currentRound={state.currentRound}
                  isActive={state.step === "sending"}
                />
                <BobPanel
                  bases={state.bobBases}
                  measurements={state.bobMeasurements}
                  lostPhotons={state.lostPhotons}
                  aliceBases={
                    state.step === "comparing" || state.step === "complete"
                      ? state.aliceData.map((q) => q.basis)
                      : new Array(state.totalRounds).fill(null)
                  }
                  currentRound={state.currentRound}
                  isActive={state.step === "measuring"}
                />
              </div>

              <QuantumChannel
                photons={photons}
                isActive={state.step === "sending"}
                speed={state.speed}
                onPhotonComplete={(photonId) => {
                  setPhotons((prev) =>
                    prev.map((p) =>
                      p.id === photonId ? { ...p, isComplete: true } : p
                    )
                  );
                }}
                aliceBasis={
                  state.currentRound < state.aliceData.length
                    ? state.aliceData[state.currentRound]?.basis
                    : "+"
                }
                bobBasis={
                  state.currentRound < state.bobBases.length
                    ? state.bobBases[state.currentRound]
                    : "+"
                }
                eveBasis={
                  state.currentRound < state.eveBasis.length
                    ? state.eveBasis[state.currentRound]
                    : "+"
                }
                eveEnabled={state.mode === "with-eve"}
                currentRound={state.currentRound}
              />
            </div>

            {/* Right: Results + Log */}
            <div ref={keyResultsRef} className="space-y-6 xl:sticky xl:top-24">
              <Tabs defaultValue="results" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="results">Results</TabsTrigger>
                  <TabsTrigger value="log">Protocol log</TabsTrigger>
                </TabsList>
                <TabsContent value="results" className="mt-4">
                  <ResultsCard
                    sharedKey={state.sharedKey}
                    sharedKeyHash={state.sharedKeyHash}
                    errorRate={state.errorRate}
                    isSecure={normalizeQberFraction(state.errorRate) <= 0.11}
                    matchingBits={state.matchingIndices.length}
                    siftedTotal={state.siftedTotal}
                    siftedErrorCount={state.siftedErrorCount}
                    totalBits={state.totalRounds}
                    errorHistory={errorHistory}
                    hasCompared={
                      state.step === "comparing" || state.step === "complete"
                    }
                  />
                </TabsContent>
                <TabsContent value="log" className="mt-4">
                  <ChatLog
                    messages={messages}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
