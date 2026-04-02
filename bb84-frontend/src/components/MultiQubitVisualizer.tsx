import { useEffect, useState } from "react";
import { BB84Api } from "@/services/bb84Api";

interface Props {
  index: number;
  totalRounds: number;
}

export default function MultiQubitVisualizer({ index, totalRounds }: Props) {
  const [visuals, setVisuals] = useState<
    {
      who: "alice" | "eve" | "bob";
      index: number;
      circuit: string;
      bloch: string;
    }[]
  >([]);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      if (index < 0 || index >= totalRounds) return;

      for (const who of ["alice", "eve", "bob"] as const) {
        const data = await BB84Api.getQubitVisualization(who, index);
        if (!data.error) {
          setVisuals((prev) => {
            if (prev.find((v) => v.who === who && v.index === index))
              return prev;
            return [
              ...prev,
              { who, index, circuit: data.circuit, bloch: data.bloch },
            ];
          });
        }
      }
    }
    fetchAll();
  }, [index, totalRounds]);

  return (
    <div className="my-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Visualizations for Qubit {index}</h2>
        <button
          onClick={() => setIsOpen((o) => !o)}
          className="px-3 py-1 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/80"
        >
          {isOpen ? "Hide" : "Show"}
        </button>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visuals.map((v) => (
            <div
              key={`${v.who}-${v.index}`}
              className="flex flex-col items-center border rounded p-3 bg-background shadow-md"
            >
              <h3 className="text-md font-semibold mb-2">
                {v.who.toUpperCase()} Qubit {v.index}
              </h3>
              <img
                src={`data:image/png;base64,${v.circuit}`}
                alt={`${v.who} circuit ${v.index}`}
                className="max-w-full h-auto border rounded mb-2"
              />
              <img
                src={`data:image/png;base64,${v.bloch}`}
                alt={`${v.who} bloch ${v.index}`}
                className="w-28 h-28 border rounded"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
