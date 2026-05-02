import { useState, useCallback } from "preact/hooks";

type CoinResult = "Heads" | "Tails";

function secureCoinFlip(): CoinResult {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % 2 === 0 ? "Heads" : "Tails";
}

export default function CoinFlipper() {
  const [result, setResult] = useState<CoinResult | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [stats, setStats] = useState({ heads: 0, tails: 0 });
  const [multiCount, setMultiCount] = useState(1);
  const [multiResults, setMultiResults] = useState<CoinResult[]>([]);

  const flip = useCallback(() => {
    setFlipping(true);
    setResult(null);
    setMultiResults([]);

    setTimeout(() => {
      const r = secureCoinFlip();
      setResult(r);
      setFlipping(false);
      setStats((prev) => ({
        heads: prev.heads + (r === "Heads" ? 1 : 0),
        tails: prev.tails + (r === "Tails" ? 1 : 0),
      }));
    }, 600);
  }, []);

  const flipMulti = useCallback(() => {
    setFlipping(true);
    setResult(null);
    setMultiResults([]);

    setTimeout(() => {
      const results: CoinResult[] = [];
      let headsCount = 0;
      let tailsCount = 0;
      for (let i = 0; i < multiCount; i++) {
        const r = secureCoinFlip();
        results.push(r);
        if (r === "Heads") headsCount++;
        else tailsCount++;
      }
      setMultiResults(results);
      setFlipping(false);
      setStats((prev) => ({
        heads: prev.heads + headsCount,
        tails: prev.tails + tailsCount,
      }));
    }, 600);
  }, [multiCount]);

  const resetStats = useCallback(() => {
    setStats({ heads: 0, tails: 0 });
    setResult(null);
    setMultiResults([]);
  }, []);

  const total = stats.heads + stats.tails;
  const headsPct = total > 0 ? (stats.heads / total) * 100 : 50;
  const tailsPct = total > 0 ? (stats.tails / total) * 100 : 50;

  return (
    <div>
      <div class="text-center mb-6">
        <button
          class="btn-primary"
          onClick={flip}
          disabled={flipping}
          style="font-size: 1.5rem; padding: 1rem 3rem;"
        >
          {flipping ? "Flipping..." : "Flip Coin"}
        </button>
      </div>

      {flipping && (
        <div class="text-center mb-6">
          <span
            style="font-size: 4rem; display: inline-block; animation: spin 0.15s linear infinite;"
          >
            🪙
          </span>
          <style>{`
            @keyframes spin {
              from { transform: rotateY(0deg); }
              to { transform: rotateY(360deg); }
            }
          `}</style>
        </div>
      )}

      {result && !flipping && multiResults.length === 0 && (
        <div class="bg-surface-elevated rounded-lg p-6 mb-6 text-center">
          <span style="font-size: 3rem;">{result === "Heads" ? "🪙" : "🔘"}</span>
          <div class="text-title-lg text-primary mt-2">{result}</div>
        </div>
      )}

      {multiResults.length > 0 && !flipping && (
        <div class="mb-6">
          <span class="text-caption-uppercase text-muted block mb-3">
            {multiResults.length} Flip Results
          </span>
          <div class="bg-surface-elevated rounded-lg p-3">
            <div class="flex flex-wrap gap-2 mb-3">
              {multiResults.map((r, i) => (
                <span class={r === "Heads" ? "badge-yellow" : "badge"} key={i}>
                  {r === "Heads" ? "🪙" : "🔘"} {r}
                </span>
              ))}
            </div>
            <div class="border-t border-hairline pt-3 grid grid-cols-2 gap-2">
              <div>
                <span class="text-body-sm text-muted-soft block">Heads</span>
                <span class="text-body-strong">{multiResults.filter((r) => r === "Heads").length}</span>
              </div>
              <div>
                <span class="text-body-sm text-muted-soft block">Tails</span>
                <span class="text-body-strong">{multiResults.filter((r) => r === "Tails").length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label class="text-caption-uppercase text-muted block mb-2">Multi-Flip Count</label>
          <div class="flex gap-2">
            <input
              type="number"
              class="input flex-1"
              value={multiCount}
              min={1}
              max={100}
              onInput={(e) => setMultiCount(Math.min(100, Math.max(1, parseInt((e.target as HTMLInputElement).value) || 1)))}
            />
            <button class="btn-secondary" onClick={flipMulti} disabled={flipping}>
              Flip {multiCount}×
            </button>
          </div>
        </div>
      </div>

      {total > 0 && (
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="text-caption-uppercase text-muted">Statistics</span>
            <button class="btn-secondary text-body-sm" onClick={resetStats}>Reset</button>
          </div>
          <div class="bg-surface-elevated rounded-lg p-3">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div>
                <span class="text-body-sm text-muted-soft block">Total Flips</span>
                <span class="text-body-strong">{total}</span>
              </div>
              <div>
                <span class="text-body-sm text-muted-soft block">Heads</span>
                <span class="text-body-strong">{stats.heads} ({headsPct.toFixed(1)}%)</span>
              </div>
              <div>
                <span class="text-body-sm text-muted-soft block">Tails</span>
                <span class="text-body-strong">{stats.tails} ({tailsPct.toFixed(1)}%)</span>
              </div>
              <div>
                <span class="text-body-sm text-muted-soft block">Ratio</span>
                <span class="text-body-strong">
                  {stats.tails > 0 ? (stats.heads / stats.tails).toFixed(2) : "∞"}:1
                </span>
              </div>
            </div>
            <div class="flex h-4 rounded-full overflow-hidden">
              <div
                class="bg-yellow-500 transition-all duration-300"
                style={{ width: `${headsPct}%` }}
                title={`Heads: ${headsPct.toFixed(1)}%`}
              />
              <div
                class="bg-primary transition-all duration-300"
                style={{ width: `${tailsPct}%` }}
                title={`Tails: ${tailsPct.toFixed(1)}%`}
              />
            </div>
            <div class="flex justify-between mt-1">
              <span class="text-body-sm text-muted-soft">🪙 Heads {headsPct.toFixed(1)}%</span>
              <span class="text-body-sm text-muted-soft">🔘 Tails {tailsPct.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
