import { useState } from "react";
import { HomeScreen } from "@/components/HomeScreen";
import { BB84Simulator } from "@/components/BB84Simulator";
import { HackathonFooter } from "@/components/HackathonFooter";

const Index = () => {
  const [currentView, setCurrentView] = useState<"home" | "simulation">("home");
  const [simulationMode, setSimulationMode] = useState<
    "without-eve" | "with-eve"
  >("without-eve");

  const handleStartSimulation = (mode: "without-eve" | "with-eve") => {
    setSimulationMode(mode);
    setCurrentView("simulation");
  };

  const handleBackToHome = () => {
    setCurrentView("home");
  };



  return (
    <>
      {currentView === "home" ? (
        <HomeScreen onStartSimulation={handleStartSimulation} />
      ) : (
        <BB84Simulator mode={simulationMode} onBack={handleBackToHome} />
      )}
      <div className="h-10"></div>
      <HackathonFooter/>
    </>
  );
};

export default Index;
