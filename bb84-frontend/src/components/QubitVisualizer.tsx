import { useEffect, useState } from "react";
import { BB84Api } from "@/services/bb84Api";

export default function QubitVisualizer({
  index,
  totalRounds,
}: {
  index: number;
  totalRounds: number;
}) {
  const [visualizations, setVisualizations] = useState<
    { index: number; circuit: string; bloch: string }[]
  >([]);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Ensure we only load valid qubits (0..totalRounds-1)
      if (index < 0 || index >= totalRounds) return;

      const data = await BB84Api.getQubitVisualization("alice", index);

      setVisualizations((prev) => {
        if (prev.find((v) => v.index === index)) return prev; // avoid duplicates
        return [...prev, { index, circuit: data.circuit, bloch: data.bloch }];
      });
    }
    fetchData();
  }, [index, totalRounds]);

  return (
    <div className="my-6 space-y-4 mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Qubit Visualizations</h2>
        <button
          onClick={() => setIsOpen((o) => !o)}
          className="px-3 py-1 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/80"
        >
          {isOpen ? "Hide" : "Show"}
        </button>
      </div>

      {isOpen && (
        <div className="flex flex-wrap gap-6 border rounded p-4 bg-muted/10">
          {visualizations.map((v) => (
            <div
              key={v.index}
              className="flex flex-col items-center border rounded p-3 bg-background shadow-md w-[260px]"
            >
              <h3 className="text-md font-semibold mb-2">Qubit {v.index}</h3>
              <img
                src={`data:image/png;base64,${v.circuit}`}
                alt={`Circuit Qubit ${v.index}`}
                className="max-w-full h-auto border rounded mb-2"
              />
              <img
                src={`data:image/png;base64,${v.bloch}`}
                alt={`Bloch Sphere Qubit ${v.index}`}
                className="w-28 h-28 border rounded"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// import { useEffect, useState } from "react";
// import { BB84Api } from "@/services/bb84Api";

// export default function QubitVisualizer({ index }: { index: number }) {
//   const [visualizations, setVisualizations] = useState<
//     { index: number; circuit: string; bloch: string }[]
//   >([]);

//   useEffect(() => {
//     async function fetchData() {
//       const data = await BB84Api.getQubitVisualization(index);
//       setVisualizations((prev) => {
//         if (prev.find((v) => v.index === index)) return prev; // avoid duplicates
//         return [...prev, { index, circuit: data.circuit, bloch: data.bloch }];
//       });
//     }
//     fetchData();
//   }, [index]);

//   return (
//     <div className="space-y-4">
//       <h2 className="text-lg font-bold">Qubit Visualizations</h2>

//       {/* ✅ Flex wrap container */}
//       <div className="flex flex-wrap gap-6 border rounded p-4 bg-muted/10">
//         {visualizations.map((v) => (
//           <div
//             key={v.index}
//             className="flex flex-col items-center border rounded p-3 bg-background shadow-md w-[280px]"
//           >
//             <h3 className="text-md font-semibold mb-2">Qubit {v.index}</h3>
//             <img
//               src={`data:image/png;base64,${v.circuit}`}
//               alt={`Circuit Qubit ${v.index}`}
//               className="max-w-full h-auto border rounded mb-2"
//             />
//             <img
//               src={`data:image/png;base64,${v.bloch}`}
//               alt={`Bloch Sphere Qubit ${v.index}`}
//               className="w-28 h-28 border rounded"
//             />
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// import { useEffect, useState } from "react";
// import { BB84Api } from "@/services/bb84Api";

// export default function QubitVisualizer({ index }: { index: number }) {
//   const [circuitImg, setCircuitImg] = useState<string | null>(null);
//   const [blochImg, setBlochImg] = useState<string | null>(null);

//   useEffect(() => {
//     async function fetchData() {
//       const circuit = await BB84Api.getCircuit(index);
//       setCircuitImg(circuit.img_base64);

//       const bloch = await BB84Api.getBloch(index);
//       setBlochImg(bloch.img_base64);
//     }
//     fetchData();
//   }, [index]);

//   return (
//     <div className="flex flex-col gap-4 items-center">
//       <h2 className="text-lg font-bold">Qubit {index} Visualization</h2>
//       {circuitImg && (
//         <img
//           src={`data:image/png;base64,${circuitImg}`}
//           alt="Circuit Diagram"
//         />
//       )}
//       {blochImg && (
//         <img src={`data:image/png;base64,${blochImg}`} alt="Bloch Sphere" />
//       )}
//     </div>
//   );
// }
