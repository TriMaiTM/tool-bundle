import { useState, useCallback, useRef, useEffect } from "preact/hooks";

const PRESETS: Record<string, string[]> = {
  "Yes/No": ["Yes", "No"],
  "Numbers 1-10": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  "Days of Week": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};

const COLORS = [
  "#4f46e5", "#e11d48", "#059669", "#d97706",
  "#7c3aed", "#0891b2", "#be185d", "#65a30d",
  "#dc2626", "#0284c7", "#a21caf", "#ca8a04",
];

export default function WheelSpinner() {
  const [options, setOptions] = useState<string[]>(["Yes", "No"]);
  const [inputValue, setInputValue] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<{ result: string; timestamp: number }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawWheel = useCallback((opts: string[], currentRotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 10;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((currentRotation * Math.PI) / 180);

    const segAngle = (2 * Math.PI) / opts.length;

    opts.forEach((opt, i) => {
      const startAngle = i * segAngle;
      const endAngle = startAngle + segAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.rotate(startAngle + segAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px sans-serif";
      const text = opt.length > 12 ? opt.slice(0, 12) + "…" : opt;
      ctx.fillText(text, radius - 15, 5);
      ctx.restore();
    });

    ctx.restore();

    // Pointer triangle at top
    ctx.beginPath();
    ctx.moveTo(cx - 12, 8);
    ctx.lineTo(cx + 12, 8);
    ctx.lineTo(cx, 25);
    ctx.closePath();
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, []);

  useEffect(() => {
    drawWheel(options, rotation);
  }, [options, rotation, drawWheel]);

  const addOption = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed && !options.includes(trimmed)) {
      setOptions((prev) => [...prev, trimmed]);
      setInputValue("");
    }
  }, [inputValue, options]);

  const removeOption = useCallback((idx: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== idx));
    setResult(null);
  }, []);

  const loadPreset = useCallback((preset: string) => {
    setOptions(PRESETS[preset] || []);
    setResult(null);
    setRotation(0);
  }, []);

  const spin = useCallback(() => {
    if (options.length < 2 || spinning) return;
    setSpinning(true);
    setResult(null);

    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    const winnerIndex = arr[0] % options.length;
    const segAngle = 360 / options.length;
    const targetAngle = 360 - (winnerIndex * segAngle + segAngle / 2);
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const totalRotation = fullSpins * 360 + targetAngle;

    const startRotation = rotation % 360;
    const duration = 4000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startRotation + totalRotation * eased;
      setRotation(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        const finalAngle = current % 360;
        const normalized = (360 - finalAngle + 360) % 360;
        const idx = Math.floor(normalized / segAngle) % options.length;
        const selected = options[idx];
        setResult(selected);
        setHistory((prev) => [{ result: selected, timestamp: Date.now() }, ...prev].slice(0, 20));
      }
    };
    requestAnimationFrame(animate);
  }, [options, spinning, rotation]);

  return (
    <div>
      <div class="mb-6">
        <label class="text-caption-uppercase text-muted block mb-2">Add Option</label>
        <div class="flex gap-2">
          <input
            type="text"
            class="input flex-1"
            placeholder="Enter an option..."
            value={inputValue}
            onInput={(e) => setInputValue((e.target as HTMLInputElement).value)}
            onKeyDown={(e: KeyboardEvent) => { if (e.key === "Enter") addOption(); }}
          />
          <button class="btn-secondary" onClick={addOption}>Add</button>
        </div>
      </div>

      <div class="mb-6">
        <label class="text-caption-uppercase text-muted block mb-2">Presets</label>
        <div class="flex flex-wrap gap-2">
          {Object.keys(PRESETS).map((name) => (
            <button class="btn-secondary text-body-sm" key={name} onClick={() => loadPreset(name)}>
              {name}
            </button>
          ))}
        </div>
      </div>

      {options.length > 0 && (
        <div class="mb-6">
          <span class="text-caption-uppercase text-muted block mb-3">Options ({options.length})</span>
          <div class="flex flex-wrap gap-2">
            {options.map((opt, i) => (
              <span class="badge" key={i}>
                <span style={`color: ${COLORS[i % COLORS.length]}`}>●</span> {opt}
                <button
                  class="ml-1 text-body-sm"
                  onClick={() => removeOption(i)}
                  style="cursor: pointer; opacity: 0.7;"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div class="text-center mb-6">
        <div class="inline-block mb-4" style="position: relative;">
          <canvas ref={canvasRef} style="border-radius: 50%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);" />
        </div>
        <div>
          <button
            class="btn-primary"
            onClick={spin}
            disabled={spinning || options.length < 2}
            style="font-size: 1.2rem; padding: 0.8rem 2.5rem;"
          >
            {spinning ? "Spinning..." : "Spin!"}
          </button>
        </div>
      </div>

      {result && !spinning && (
        <div class="bg-surface-elevated rounded-lg p-6 mb-6 text-center">
          <span class="text-caption-uppercase text-muted block mb-2">Result</span>
          <div class="text-title-lg text-primary" style="font-size: 2rem;">{result}</div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <span class="text-caption-uppercase text-muted block mb-3">History</span>
          <div class="space-y-2">
            {history.map((entry, i) => (
              <div class="bg-surface-elevated rounded-lg p-3" key={i}>
                <div class="flex items-center justify-between">
                  <span class="text-body-strong text-primary">{entry.result}</span>
                  <span class="text-body-sm text-muted-soft">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {options.length < 2 && (
        <div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose">
          Add at least 2 options to spin the wheel.
        </div>
      )}
    </div>
  );
}
