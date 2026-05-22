import { useState } from "react";
import { Button } from "@/components/ui/button";

interface VerbSelectorProps {
  onSave: (paradigm: string, conjugation: string) => void;
  onCancel: () => void;
}

const PARADIGMS = [
  { id: "NOR", parts: ["NOR"] },
  { id: "NOR-NORI", parts: ["NOR", "NORI"] },
  { id: "NOR-NORK", parts: ["NOR", "NORK"] },
  { id: "NOR-NORI-NORK", parts: ["NOR", "NORI", "NORK"] },
];

const PRONOUNS: Record<string, string[]> = {
  NOR: ["Ni", "Hi", "Hura", "Gu", "Zu", "Zuek", "Haiek"],
  NORI: ["Niri", "Hiri", "Hari", "Guri", "Zuri", "Zuei", "Haiei"],
  NORK: ["Nik", "Hik", "Hark", "Guk", "Zuk", "Zuek", "Haiek"],
};

export function VerbSelector({ onSave, onCancel }: VerbSelectorProps) {
  const [paradigm, setParadigm] = useState(PARADIGMS[0].id);
  const [selections, setSelections] = useState<Record<string, string>>({});

  const selectedParadigm = PARADIGMS.find((p) => p.id === paradigm)!;
  const isComplete = selectedParadigm.parts.every((p) => selections[p]);

  const handleSave = () => {
    const parts = selectedParadigm.parts.map((p) => selections[p] || "-");
    onSave(paradigm, parts.join("-"));
  };

  return (
    <div className="flex flex-col gap-4 p-4 mx-2 mt-2 border border-border rounded-md bg-card shadow-sm">
      {/* Paradigm selector */}
      <div className="space-y-1">
        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Aditz Paradigma
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PARADIGMS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setParadigm(p.id);
                setSelections({});
              }}
              className={[
                "px-2.5 py-1 rounded-md text-xs font-bold border-2 transition-all",
                paradigm === p.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50",
              ].join(" ")}
            >
              {p.id}
            </button>
          ))}
        </div>
      </div>

      {/* Per-case pronoun selectors */}
      <div className="space-y-3">
        {selectedParadigm.parts.map((part) => (
          <div key={part} className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              {part}
            </p>
            <div className="flex flex-wrap gap-1">
              {PRONOUNS[part].map((pronoun) => (
                <button
                  key={pronoun}
                  onClick={() =>
                    setSelections((prev) => ({ ...prev, [part]: pronoun }))
                  }
                  className={[
                    "px-2 py-0.5 rounded text-xs border transition-all",
                    selections[part] === pronoun
                      ? "bg-primary/20 border-primary text-primary font-bold"
                      : "border-border text-muted-foreground hover:border-primary/40",
                  ].join(" ")}
                >
                  {pronoun}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Preview */}
      {isComplete && (
        <div className="px-3 py-2 bg-primary/10 rounded border border-primary/20 text-center">
          <span className="text-xs font-bold text-primary">
            {paradigm}: {selectedParadigm.parts.map((p) => selections[p]).join("-")}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Utzi
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!isComplete}>
          Gorde
        </Button>
      </div>
    </div>
  );
}
