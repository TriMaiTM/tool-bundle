import { useState, useCallback } from "preact/hooks";

const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100] as const;
const DICE_DOTS: Record<number, string> = {
  1: "\u2680",
  2: "\u2681",
  3: "\u2682",
  4: "\u2683",
  5: "\u2684",
  6: "\u2685",
};

type Roll = {
  id: number;
  diceType: number;
  count: number;
  modifier: number;
  results: number[];
  total: number;
  timestamp: number;
};

function secureRandomInt(max: number): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return (arr[0] % max) + 1;
}

export default function DiceRoller() {
  const [diceType, setDiceType] = useState(6);
  const [count, setCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [results, setResults] = useState<number[]>([]);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState<Roll[]>([]);

  const roll = useCallback(() => {
    setRolling(true);
    setResults([]);

    setTimeout(() => {
      const rolls: number[] = [];
      for (let i = 0; i < count; i++) {
        rolls.push(secureRandomInt(diceType));
      }
      const total = rolls.reduce((a, b) => a + b, 0) + modifier;
      setResults(rolls);
      setRolling(false);
      setHistory((prev) => [
        {
          id: Date.now(),
          diceType,
          count,
          modifier,
          results: rolls,
          total,
          timestamp: Date.now(),
        },
        ...prev,
      ].slice(0, 10));
    }, 500);
  }, [diceType, count, modifier]);

  const total = results.length > 0 ? results.reduce((a, b) => a + b, 0) + modifier : 0;

  return (
    <div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label class="text-caption-uppercase text-muted block mb-2">Dice Type</label>
          <select
            class="input w-full"
            value={diceType}
            onChange={(e) => setDiceType(parseInt((e.target as HTMLSelectElement).value))}
          >
            {DICE_TYPES.map((d) => (
              <option value={d} key={d}>D{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label class="text-caption-uppercase text-muted block mb-2">Number of Dice (1–20)</label>
          <input
            type="number"
            class="input w-full"
            value={count}
            min={1}
            max={20}
            onInput={(e) => setCount(Math.min(20, Math.max(1, parseInt((e.target as HTMLInputElement).value) || 1)))}
          />
        </div>
        <div>
          <label class="text-caption-uppercase text-muted block mb-2">Modifier (+/-)</label>
          <input
            type="number"
            class="input w-full"
            value={modifier}
            onInput={(e) => setModifier(parseInt((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
      </div>

      <button class="btn-primary mb-6" onClick={roll} disabled={rolling}>
        {rolling ? "Rolling..." : "Roll Dice"}
      </button>

      {rolling && (
        <div class="bg-surface-elevated rounded-lg p-3 mb-6 text-center">
          <span class="text-title-lg text-primary" style="font-size: 2rem;">🎲 ?</span>
        </div>
      )}

      {results.length > 0 && !rolling && (
        <div class="mb-6">
          <span class="text-caption-uppercase text-muted block mb-3">Results</span>
          <div class="bg-surface-elevated rounded-lg p-3">
            <div class="flex flex-wrap items-center gap-3 mb-3">
              {results.map((r, i) => (
                <div class="text-center" key={i}>
                  {diceType === 6 && count <= 5 ? (
                    <span class="text-title-lg text-primary" style="font-size: 2.5rem;">
                      {DICE_DOTS[r] || r}
                    </span>
                  ) : (
                    <span class="badge-yellow" style="font-size: 1.5rem; padding: 0.5rem 1rem;">
                      {r}
                    </span>
                  )}
                  <div class="text-body-sm text-muted-soft mt-1">D{diceType} #{i + 1}</div>
                </div>
              ))}
              {modifier !== 0 && (
                <div class="text-center">
                  <span class="badge" style="font-size: 1.2rem; padding: 0.4rem 0.8rem;">
                    {modifier > 0 ? "+" : ""}{modifier}
                  </span>
                  <div class="text-body-sm text-muted-soft mt-1">Modifier</div>
                </div>
              )}
            </div>
            <div class="border-t border-hairline pt-3 flex items-center justify-between">
              <span class="text-caption-uppercase text-muted">Total</span>
              <span class="text-title-lg text-primary">{total}</span>
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <span class="text-caption-uppercase text-muted block mb-3">Roll History</span>
          <div class="space-y-2">
            {history.map((roll) => (
              <div class="bg-surface-elevated rounded-lg p-3" key={roll.id}>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-body-sm text-body-strong">
                    {roll.count}×D{roll.diceType}
                    {roll.modifier !== 0 ? ` (${roll.modifier > 0 ? "+" : ""}${roll.modifier})` : ""}
                  </span>
                  <div class="flex items-center gap-2">
                    <span class="text-body-strong text-primary">{roll.total}</span>
                    <span class="text-body-sm text-muted-soft">
                      {new Date(roll.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <span class="text-body-sm text-muted-soft">
                  [{roll.results.join(", ")}]
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
