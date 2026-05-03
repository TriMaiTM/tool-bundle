import { useState, useCallback, useMemo } from "preact/hooks";

interface GradeEntry {
  id: string;
  name: string;
  weight: number;
  grade: number;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getLetterGrade(score: number): string {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 60) return "D";
  return "F";
}

function getGpaEquivalent(letterGrade: string): number {
  const map: Record<string, number> = {
    "A+": 4.0, A: 4.0, "A-": 3.7,
    "B+": 3.3, B: 3.0, "B-": 2.7,
    "C+": 2.3, C: 2.0, "C-": 1.7,
    "D+": 1.3, D: 1.0, "D-": 0.7,
    F: 0.0,
  };
  return map[letterGrade] ?? 0;
}

function parseLetterGrade(input: string): number | null {
  const map: Record<string, number> = {
    "A+": 98, A: 95, "A-": 91,
    "B+": 88, B: 85, "B-": 81,
    "C+": 78, C: 75, "C-": 71,
    "D+": 68, D: 65, "D-": 61,
    F: 50,
  };
  const upper = input.trim().toUpperCase();
  if (upper in map) return map[upper];
  return null;
}

export default function GradeCalculator() {
  const [entries, setEntries] = useState<GradeEntry[]>([]);
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [grade, setGrade] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [targetGrade, setTargetGrade] = useState("A");
  const [finalWeight, setFinalWeight] = useState("");

  const addEntry = useCallback(() => {
    if (!weight.trim()) return;
    const w = parseFloat(weight);
    if (isNaN(w) || w < 0 || w > 100) return;

    let g: number;
    const letterVal = parseLetterGrade(grade);
    if (letterVal !== null) {
      g = letterVal;
    } else {
      g = parseFloat(grade);
      if (isNaN(g) || g < 0 || g > 100) return;
    }

    if (editId) {
      setEntries(prev =>
        prev.map(e =>
          e.id === editId ? { ...e, name: name.trim() || "Unnamed", weight: w, grade: g } : e
        )
      );
      setEditId(null);
    } else {
      setEntries(prev => [
        ...prev,
        { id: generateId(), name: name.trim() || "Unnamed", weight: w, grade: g },
      ]);
    }
    setName("");
    setWeight("");
    setGrade("");
  }, [name, weight, grade, editId]);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const startEdit = useCallback((entry: GradeEntry) => {
    setName(entry.name);
    setWeight(String(entry.weight));
    setGrade(String(entry.grade));
    setEditId(entry.id);
  }, []);

  const result = useMemo(() => {
    if (entries.length === 0) return null;
    const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
    if (totalWeight === 0) return null;
    const weightedSum = entries.reduce((sum, e) => sum + (e.weight / totalWeight) * e.grade, 0);
    const letter = getLetterGrade(weightedSum);
    const gpa = getGpaEquivalent(letter);
    return { average: weightedSum, letter, gpa, totalWeight };
  }, [entries]);

  const whatIf = useMemo(() => {
    if (!finalWeight || entries.length === 0) return null;
    const fw = parseFloat(finalWeight);
    if (isNaN(fw) || fw <= 0 || fw >= 100) return null;
    const targetMap: Record<string, number> = {
      "A+": 97, A: 93, "A-": 90,
      "B+": 87, B: 83, "B-": 80,
      "C+": 77, C: 73, "C-": 70,
      D: 60, F: 0,
    };
    const target = targetMap[targetGrade];
    if (target === undefined) return null;
    const currentWeight = entries.reduce((sum, e) => sum + e.weight, 0);
    const currentWeighted = entries.reduce((sum, e) => sum + e.weight * e.grade, 0);
    const neededTotal = target * (currentWeight + fw);
    const neededFinal = (neededTotal - currentWeighted) / fw;
    return { needed: neededFinal, achievable: neededFinal >= 0 && neededFinal <= 100 };
  }, [entries, targetGrade, finalWeight]);

  const clearAll = useCallback(() => {
    setEntries([]);
  }, []);

  return (
    <div class="space-y-6">
      {/* Input */}
      <div class="bg-surface-elevated rounded-lg p-3">
        <h3 class="text-title-lg text-primary mb-4">{editId ? "Edit Entry" : "Add Course / Assignment"}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Name</label>
            <input
              type="text"
              class="input w-full"
              placeholder="e.g. Midterm Exam"
              value={name}
              onInput={(e) => setName((e.target as HTMLInputElement).value)}
            />
          </div>
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Weight (%)</label>
            <input
              type="number"
              class="input w-full"
              placeholder="e.g. 30"
              min={0}
              max={100}
              value={weight}
              onInput={(e) => setWeight((e.target as HTMLInputElement).value)}
            />
          </div>
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Grade (0-100 or letter)</label>
            <input
              type="text"
              class="input w-full"
              placeholder="e.g. 85 or A-"
              value={grade}
              onInput={(e) => setGrade((e.target as HTMLInputElement).value)}
            />
          </div>
        </div>
        <div class="flex gap-2">
          <button class="btn-primary" onClick={addEntry}>
            {editId ? "Update" : "Add Entry"}
          </button>
          {editId && (
            <button
              class="btn-secondary"
              onClick={() => {
                setEditId(null);
                setName("");
                setWeight("");
                setGrade("");
              }}
            >
              Cancel
            </button>
          )}
          {entries.length > 0 && (
            <button class="btn-secondary" onClick={clearAll}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {entries.length > 0 && (
        <div class="bg-surface-elevated rounded-lg p-3">
          <h3 class="text-title-lg text-primary mb-4">Grade Table</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-body-sm">
              <thead>
                <tr class="border-b border-hairline">
                  <th class="text-left text-caption-uppercase text-muted py-2 px-3">Name</th>
                  <th class="text-right text-caption-uppercase text-muted py-2 px-3">Weight</th>
                  <th class="text-right text-caption-uppercase text-muted py-2 px-3">Grade</th>
                  <th class="text-right text-caption-uppercase text-muted py-2 px-3">Weighted Score</th>
                  <th class="text-right text-caption-uppercase text-muted py-2 px-3">Letter</th>
                  <th class="text-right text-caption-uppercase text-muted py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const ws = result ? (entry.weight / result.totalWeight) * entry.grade : 0;
                  return (
                    <tr key={entry.id} class="border-b border-hairline/50 hover:bg-surface-soft/50 transition-colors">
                      <td class="py-2 px-3">{entry.name}</td>
                      <td class="py-2 px-3 text-right">{entry.weight}%</td>
                      <td class="py-2 px-3 text-right">{entry.grade.toFixed(1)}</td>
                      <td class="py-2 px-3 text-right text-primary">{ws.toFixed(2)}</td>
                      <td class="py-2 px-3 text-right">
                        <span class="badge">{getLetterGrade(entry.grade)}</span>
                      </td>
                      <td class="py-2 px-3 text-right">
                        <div class="flex justify-end gap-2">
                          <button class="btn-secondary text-body-sm" onClick={() => startEdit(entry)}>
                            Edit
                          </button>
                          <button class="btn-secondary text-body-sm" onClick={() => deleteEntry(entry.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div class="bg-surface-elevated rounded-lg p-3 text-center">
            <div class="text-title-lg text-primary">{result.average.toFixed(1)}%</div>
            <div class="text-caption text-muted mt-1">Weighted Average</div>
          </div>
          <div class="bg-surface-elevated rounded-lg p-3 text-center">
            <div class="text-title-lg text-primary">{result.letter}</div>
            <div class="text-caption text-muted mt-1">Letter Grade</div>
          </div>
          <div class="bg-surface-elevated rounded-lg p-3 text-center">
            <div class="text-title-lg text-primary">{result.gpa.toFixed(2)}</div>
            <div class="text-caption text-muted mt-1">GPA (4.0 scale)</div>
          </div>
          <div class="bg-surface-elevated rounded-lg p-3 text-center">
            <div class="text-title-lg text-primary">{result.totalWeight}%</div>
            <div class="text-caption text-muted mt-1">Total Weight</div>
          </div>
        </div>
      )}

      {/* Letter Grade Scale */}
      <div class="bg-surface-elevated rounded-lg p-3">
        <h3 class="text-title-lg text-primary mb-4">Letter Grade Scale</h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-body-sm">
          {[
            { letter: "A+", range: "97-100", gpa: "4.0" },
            { letter: "A", range: "93-96", gpa: "4.0" },
            { letter: "A-", range: "90-92", gpa: "3.7" },
            { letter: "B+", range: "87-89", gpa: "3.3" },
            { letter: "B", range: "83-86", gpa: "3.0" },
            { letter: "B-", range: "80-82", gpa: "2.7" },
            { letter: "C+", range: "77-79", gpa: "2.3" },
            { letter: "C", range: "73-76", gpa: "2.0" },
            { letter: "C-", range: "70-72", gpa: "1.7" },
            { letter: "D", range: "60-69", gpa: "1.0" },
            { letter: "F", range: "0-59", gpa: "0.0" },
          ].map(({ letter, range, gpa }) => (
            <div key={letter} class="p-2 border border-hairline rounded-lg text-center">
              <div class="text-body-strong">{letter}</div>
              <div class="text-muted">{range}</div>
              <div class="text-muted">GPA {gpa}</div>
            </div>
          ))}
        </div>
      </div>

      {/* What-If Calculator */}
      {entries.length > 0 && (
        <div class="bg-surface-elevated rounded-lg p-3">
          <h3 class="text-title-lg text-primary mb-4">What-If Calculator</h3>
          <p class="text-caption-uppercase text-muted mb-3">
            What grade do I need on my final to get a target grade?
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label class="text-caption-uppercase text-muted block mb-2">Target Grade</label>
              <select
                class="input w-full"
                value={targetGrade}
                onChange={(e) => setTargetGrade((e.target as HTMLSelectElement).value)}
              >
                {["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label class="text-caption-uppercase text-muted block mb-2">Final Weight (%)</label>
              <input
                type="number"
                class="input w-full"
                placeholder="e.g. 30"
                min={1}
                max={99}
                value={finalWeight}
                onInput={(e) => setFinalWeight((e.target as HTMLInputElement).value)}
              />
            </div>
            <div class="flex items-end">
              {whatIf && (
                <div class={`p-3 rounded-lg ${whatIf.achievable ? "bg-accent-emerald/10 text-accent-emerald" : "bg-accent-rose/10 text-accent-rose"}`}>
                  <div class="text-body-strong">
                    Need: {whatIf.needed.toFixed(1)}%
                  </div>
                  <div class="text-body-sm">
                    {whatIf.achievable ? "Achievable!" : "Not achievable"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
