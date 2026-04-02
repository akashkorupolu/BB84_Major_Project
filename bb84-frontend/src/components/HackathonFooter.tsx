import { motion } from "framer-motion";

export const HackathonFooter = () => {
  return (
    <footer className="relative border-t border-border/60 bg-background/30">
      <div className="absolute inset-0 pointer-events-none">
        <div className="h-full w-full bg-gradient-to-b from-transparent via-muted/15 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="panel rounded-2xl p-6 sm:p-7">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Rajiv Gandhi University of Knowledge Technologies — Srikakulam
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Department of Computer Science and Engineering
                </div>
                <div className="pt-2 text-xl sm:text-2xl font-semibold text-foreground">
                  Simulator for Quantum Key Distribution (BB84 Protocol)
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  "Research Proposal",
                  "Academic Year 2025–26",
                  "Team No: 03",
                ].map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-xs text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="panel rounded-2xl p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-medium text-foreground">
                Team Details
              </div>
              <div className="text-xs text-muted-foreground">
                Section: <span className="font-medium text-foreground/80">4A</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { sno: "1", id: "S200502", name: "Durga Sairam" },
                { sno: "2", id: "S200051", name: "Medipalli Srivarshini" },
                { sno: "3", id: "S200078", name: "Kummari Usha" },
                { sno: "4", id: "S200063", name: "Korupolu Akash" },
                { sno: "5", id: "S201011", name: "Gudiwada Srilatha" },
              ].map((m) => {
                const initials = m.name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((s) => s[0]?.toUpperCase())
                  .join("");
                return (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-border/60 bg-muted/15 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/15 border border-border/60 flex items-center justify-center text-sm font-semibold text-primary">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {m.sno}. {m.name}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {m.id}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="panel rounded-2xl p-5 md:col-span-2">
              <div className="text-sm font-medium text-foreground mb-2">
                Project Guide
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>
                  <span className="text-foreground/80">Name:</span> Mr. Y. Ramesh
                </div>
                <div>
                  <span className="text-foreground/80">Designation:</span>{" "}
                  Assistant Professor, Department of CSE
                </div>
                <div>
                  <span className="text-foreground/80">Institute:</span>{" "}
                  Rajiv Gandhi University of Knowledge Technologies — Srikakulam
                </div>
              </div>
            </div>

            <div className="panel rounded-2xl p-5">
              <div className="text-sm font-medium text-foreground mb-2">
                Project
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Quantum Computing & Cryptography</div>
                <div>BB84 Quantum Key Distribution</div>
                <div className="text-xs pt-2 text-muted-foreground">
                  © QKD Demonstration Simulator
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};