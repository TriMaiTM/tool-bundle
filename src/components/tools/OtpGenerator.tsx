import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "preact/hooks";

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(encoded: string): Uint8Array {
  const cleaned = encoded.replace(/[= ]/g, "").toUpperCase();
  let bits = "";
  for (const char of cleaned) {
    const val = BASE32_CHARS.indexOf(char);
    if (val === -1) throw new Error(`Invalid Base32 character: ${char}`);
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
}

function intToBytes(num: number): Uint8Array {
  const bytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    bytes[i] = num & 0xff;
    num = Math.floor(num / 256);
  }
  return bytes;
}

async function generateTOTP(
  secret: string,
  timeStep: number = 30,
): Promise<string> {
  try {
    const keyBytes = base32Decode(secret);
    const time = Math.floor(Date.now() / 1000 / timeStep);
    const timeBytes = intToBytes(time);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes as unknown as BufferSource,
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"],
    );

    const hmacResult = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      timeBytes as unknown as BufferSource,
    );
    const hmacArray = new Uint8Array(hmacResult);

    const offset = hmacArray[hmacArray.length - 1] & 0x0f;
    const binary =
      ((hmacArray[offset] & 0x7f) << 24) |
      ((hmacArray[offset + 1] & 0xff) << 16) |
      ((hmacArray[offset + 2] & 0xff) << 8) |
      (hmacArray[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, "0");
  } catch (err) {
    throw new Error("Invalid secret key or generation error");
  }
}

export default function OtpGenerator() {
  const [secret, setSecret] = useState("");
  const [otp, setOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isValidSecret = useMemo(() => {
    if (!secret.trim()) return false;
    try {
      base32Decode(secret);
      return true;
    } catch {
      return false;
    }
  }, [secret]);

  const refreshOtp = useCallback(async () => {
    if (!isValidSecret || !secret.trim()) {
      setOtp(null);
      return;
    }
    try {
      setError(null);
      const code = await generateTOTP(secret.trim());
      setOtp(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate OTP");
      setOtp(null);
    }
  }, [secret, isValidSecret]);

  const calculateTimeRemaining = useCallback(() => {
    const now = Math.floor(Date.now() / 1000);
    return 30 - (now % 30);
  }, []);

  useEffect(() => {
    refreshOtp();
    setTimeRemaining(calculateTimeRemaining());

    intervalRef.current = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      if (remaining === 30) {
        refreshOtp();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshOtp, calculateTimeRemaining]);

  const handleCopy = useCallback(async () => {
    if (otp) {
      await navigator.clipboard.writeText(otp);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [otp]);

  const timerProgress = (timeRemaining / 30) * 100;

  return (
    <div>
      <div class="mb-6">
        <label class="text-caption-uppercase text-muted block mb-2">
          Secret Key (Base32)
        </label>
        <input
          type="text"
          class="input"
          placeholder="Enter your Base32-encoded secret key..."
          value={secret}
          onInput={(e) => setSecret((e.target as HTMLInputElement).value)}
          style="font-family: var(--font-mono)"
        />
        {secret && !isValidSecret && (
          <span class="text-body-sm text-accent-rose mt-1 block">
            Invalid Base32 key. Use characters A-Z and 2-7 only.
          </span>
        )}
      </div>

      {error && (
        <div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mb-6 text-body-sm text-accent-rose">
          {error}
        </div>
      )}

      {otp && (
        <div class="bg-surface-elevated rounded-lg p-8 mb-6">
          <div class="text-center mb-6">
            <span class="text-caption-uppercase text-muted block mb-3">
              Your TOTP Code
            </span>
            <div class="flex items-center justify-center gap-3">
              <span
                class="text-display-lg tracking-widest"
                style="font-family: var(--font-mono); letter-spacing: 0.3em"
              >
                {otp.slice(0, 3)} {otp.slice(3)}
              </span>
              <button
                class="btn-icon-circular"
                onClick={handleCopy}
                title="Copy to clipboard"
              >
                {copied ? "✓" : "📋"}
              </button>
            </div>
            {copied && (
              <span class="text-body-sm text-accent-emerald mt-2 block">
                Copied!
              </span>
            )}
          </div>

          <div class="max-w-xs mx-auto">
            <div class="flex items-center justify-between mb-2">
              <span class="text-caption-uppercase text-muted">
                Time Remaining
              </span>
              <span
                class={`text-body-strong ${timeRemaining <= 5 ? "text-accent-rose" : ""}`}
              >
                {timeRemaining}s
              </span>
            </div>
            <div class="h-2 bg-hairline rounded-full overflow-hidden">
              <div
                class={`h-full transition-all duration-1000 ease-linear ${
                  timeRemaining <= 5
                    ? "bg-accent-rose"
                    : timeRemaining <= 10
                      ? "bg-yellow-500"
                      : "bg-accent-emerald"
                }`}
                style={{ width: `${timerProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {secret && isValidSecret && (
        <div class="bg-surface-elevated rounded-lg p-4">
          <span class="text-caption-uppercase text-muted block mb-2">
            Configuration
          </span>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <span class="text-body-sm text-muted-soft block">Algorithm</span>
              <span class="text-body-strong">HMAC-SHA1</span>
            </div>
            <div>
              <span class="text-body-sm text-muted-soft block">Time Step</span>
              <span class="text-body-strong">30 seconds</span>
            </div>
            <div>
              <span class="text-body-sm text-muted-soft block">
                Code Length
              </span>
              <span class="text-body-strong">6 digits</span>
            </div>
            <div>
              <span class="text-body-sm text-muted-soft block">Key Type</span>
              <span class="text-body-strong">Base32</span>
            </div>
          </div>
        </div>
      )}

      {!secret && (
        <div class="bg-surface-elevated rounded-lg p-8 text-center">
          <span class="text-muted">
            Enter your TOTP secret key above to generate codes.
            <br />
            <span class="text-body-sm text-muted-soft mt-2 block">
              Typically found in authenticator app settings or QR code setup.
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
