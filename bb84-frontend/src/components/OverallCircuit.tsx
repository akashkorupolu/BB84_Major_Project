import { useEffect, useState } from "react";
import { BB84Api } from "@/services/bb84Api";

export default function OverallCircuit({ eve }: { eve: boolean }) {
  const [images, setImages] = useState<{
    combined: string | null;
    alice: string | null;
    eve: string | null;
    bob: string | null;
  }>({
    combined: null,
    alice: null,
    eve: null,
    bob: null,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCircuits() {
      try {
        const [combinedRes, aliceRes, bobRes, eveRes] = await Promise.all([
          BB84Api.getOverallCircuit(eve),
          BB84Api.getOverallAliceCircuit(),
          BB84Api.getOverallBobCircuit(),
          eve ? BB84Api.getOverallEveCircuit() : Promise.resolve(null),
        ]);

        setImages({
          combined: combinedRes?.img_base64 ?? null,
          alice: aliceRes?.img_base64 ?? null,
          bob: bobRes?.img_base64 ?? null,
          eve: eveRes?.img_base64 ?? null,
        });
      } catch (err) {
        console.error("Failed to fetch overall circuits:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCircuits();
  }, [eve]);

  if (loading) {
    return (
      <div className="text-muted-foreground">Loading overall circuits...</div>
    );
  }

  return (
    <div className="my-8">
      <h2 className="text-xl font-bold text-center mb-6">Overall Circuits</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Row 1: Alice + Bob */}
        <CircuitCard
          title="Alice’s Overall Circuit"
          color="text-alice"
          img={images.alice}
        />
        <CircuitCard
          title="Bob’s Overall Circuit"
          color="text-bob"
          img={images.bob}
        />

        {/* Row 2: Eve (optional) + Combined */}
        {eve && (
          <CircuitCard
            title="Eve’s Overall Circuit"
            color="text-eve"
            img={images.eve}
          />
        )}
        <CircuitCard
          title="Combined BB84 Protocol Circuit"
          color="text-primary"
          img={images.combined}
        />
      </div>
    </div>
  );
}

function CircuitCard({
  title,
  img,
  color,
}: {
  title: string;
  img: string | null;
  color?: string;
}) {
  return (
    <div className="border rounded-lg p-4 bg-background shadow flex flex-col">
      <h3 className={`font-semibold mb-2 ${color}`}>{title}</h3>
      {img ? (
        <div className="flex-1 flex items-center justify-center">
          <img
            src={`data:image/png;base64,${img}`}
            alt={title}
            className="border rounded object-contain max-h-[300px] w-full"
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No data available</p>
      )}
    </div>
  );
}

// import { useEffect, useState } from "react";
// import { BB84Api } from "@/services/bb84Api";

// export default function OverallCircuit({ eve }: { eve: boolean }) {
//   const [img, setImg] = useState<string | null>(null);

//   useEffect(() => {
//     async function fetchCircuit() {
//       const result = await BB84Api.getOverallCircuit(eve);
//       setImg(result.img_base64);
//     }
//     fetchCircuit();
//   }, [eve]);

//   if (!img)
//     return (
//       <div className="text-muted-foreground">Loading overall circuit...</div>
//     );

//   return (
//     <div className="my-6">
//       <h2 className="text-lg font-bold">Overall BB84 Circuit</h2>
//       <img
//         src={`data:image/png;base64,${img}`}
//         alt="Overall BB84 Circuit"
//         className="border rounded w-full max-w-5xl mx-auto"
//       />
//     </div>
//   );
// }
