import { useCallback, useEffect, useRef, useState } from "preact/hooks";

type GameType = "Valorant" | "CS2" | "Overwatch 2";

interface ValorantSettings {
	color: string;
	outlines: boolean;
	outlineOpacity: number;
	centerDot: boolean;
	centerDotThickness: number;
	innerLineLength: number;
	innerLineThickness: number;
	innerLineOffset: number;
	innerLineOpacity: number;
	outerLineLength: number;
	outerLineThickness: number;
	outerLineOffset: number;
	outerLineOpacity: number;
	fadeWithMovement: boolean;
	fadeWithFiring: boolean;
}

interface CS2Settings {
	r: number;
	g: number;
	b: number;
	size: number;
	thickness: number;
	gap: number;
	outline: boolean;
	dot: boolean;
	style: number;
}

interface OW2Settings {
	type: "Circle" | "Crosshair" | "Circle + Crosshair" | "Dot";
	color: string;
	thickness: number;
	length: number;
	centerGap: number;
	outline: boolean;
	dot: boolean;
}

const VALORANT_COLORS: Record<string, string> = {
	White: "#ffffff",
	Green: "#00ff00",
	Yellow: "#ffff00",
	Cyan: "#00ffff",
	Red: "#ff0000",
};

const VALORANT_PRESETS: Record<string, Partial<ValorantSettings>> = {
	TenZ: {
		innerLineLength: 4,
		innerLineThickness: 2,
		innerLineOffset: 2,
		centerDot: true,
		centerDotThickness: 2,
	},
	default: {
		innerLineLength: 6,
		innerLineThickness: 2,
		innerLineOffset: 3,
		outerLineLength: 0,
		centerDot: false,
	},
};

export default function CrosshairGenerator() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [game, setGame] = useState<GameType>("Valorant");
	const [copied, setCopied] = useState(false);

	// Valorant settings
	const [val, setVal] = useState<ValorantSettings>({
		color: "#00ff00",
		outlines: true,
		outlineOpacity: 1,
		centerDot: false,
		centerDotThickness: 2,
		innerLineLength: 6,
		innerLineThickness: 2,
		innerLineOffset: 3,
		innerLineOpacity: 1,
		outerLineLength: 0,
		outerLineThickness: 2,
		outerLineOffset: 3,
		outerLineOpacity: 0.5,
		fadeWithMovement: false,
		fadeWithFiring: false,
	});

	// CS2 settings
	const [cs2, setCs2] = useState<CS2Settings>({
		r: 0,
		g: 255,
		b: 0,
		size: 3,
		thickness: 1,
		gap: -2,
		outline: true,
		dot: false,
		style: 4,
	});

	// OW2 settings
	const [ow2, setOw2] = useState<OW2Settings>({
		type: "Crosshair",
		color: "#00ff00",
		thickness: 2,
		length: 6,
		centerGap: 5,
		outline: true,
		dot: false,
	});

	// Draw crosshair on canvas
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const w = canvas.width;
		const h = canvas.height;
		const cx = w / 2;
		const cy = h / 2;

		ctx.clearRect(0, 0, w, h);

		// Dark background
		ctx.fillStyle = "#1a1a2e";
		ctx.fillRect(0, 0, w, h);

		// Grid lines
		ctx.strokeStyle = "rgba(255,255,255,0.05)";
		ctx.lineWidth = 1;
		for (let x = 0; x < w; x += 20) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, h);
			ctx.stroke();
		}
		for (let y = 0; y < h; y += 20) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(w, y);
			ctx.stroke();
		}

		// Center crosshair lines (aim guide)
		ctx.strokeStyle = "rgba(255,255,255,0.1)";
		ctx.beginPath();
		ctx.moveTo(cx, 0);
		ctx.lineTo(cx, h);
		ctx.moveTo(0, cy);
		ctx.lineTo(w, cy);
		ctx.stroke();

		if (game === "Valorant") {
			drawValorantCrosshair(ctx, cx, cy, val);
		} else if (game === "CS2") {
			drawCS2Crosshair(ctx, cx, cy, cs2);
		} else {
			drawOW2Crosshair(ctx, cx, cy, ow2);
		}
	}, [game, val, cs2, ow2]);

	const updateVal = useCallback((partial: Partial<ValorantSettings>) => {
		setVal((prev) => ({ ...prev, ...partial }));
	}, []);

	const updateCs2 = useCallback((partial: Partial<CS2Settings>) => {
		setCs2((prev) => ({ ...prev, ...partial }));
	}, []);

	const updateOw2 = useCallback((partial: Partial<OW2Settings>) => {
		setOw2((prev) => ({ ...prev, ...partial }));
	}, []);

	const getCode = useCallback((): string => {
		if (game === "Valorant") {
			return [
				`0;P;c;1;h;0;f;0;0l;${val.innerLineLength};0o;${val.innerLineOffset};0a;${val.innerLineOpacity};0f;0;1b;0;1l;${val.outerLineLength};1o;${val.outerLineOffset};1a;${val.outerLineOpacity}`,
			].join(";");
		}
		if (game === "CS2") {
			return `cl_crosshaircolor_r "${cs2.r}"\ncl_crosshaircolor_g "${cs2.g}"\ncl_crosshaircolor_b "${cs2.b}"\ncl_crosshairsize "${cs2.size}"\ncl_crosshairthickness "${cs2.thickness}"\ncl_crosshairgap "${cs2.gap}"\ncl_crosshair_drawoutline "${cs2.outline ? 1 : 0}"\ncl_crosshairdot "${cs2.dot ? 1 : 0}"\ncl_crosshairstyle "${cs2.style}"`;
		}
		// OW2
		return `Type: ${ow2.type}\nColor: ${ow2.color}\nThickness: ${ow2.thickness}\nLength: ${ow2.length}\nCenter Gap: ${ow2.centerGap}\nOutline: ${ow2.outline ? "On" : "Off"}\nDot: ${ow2.dot ? "On" : "Off"}`;
	}, [game, val, cs2, ow2]);

	const handleCopyCode = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(getCode());
		} catch {
			/* ignore */
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [getCode]);

	const applyPreset = useCallback(
		(name: string) => {
			if (game === "Valorant") {
				const preset = VALORANT_PRESETS[name];
				if (preset) setVal((prev) => ({ ...prev, ...preset }));
			}
		},
		[game],
	);

	return (
		<div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Controls */}
				<div>
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-2">Game</label>
						<select
							class="input w-full"
							value={game}
							onChange={(e) => setGame((e.target as HTMLSelectElement).value as GameType)}
						>
							<option value="Valorant">Valorant</option>
							<option value="CS2">CS2</option>
							<option value="Overwatch 2">Overwatch 2</option>
						</select>
					</div>

					{game === "Valorant" && (
						<div class="space-y-4">
							<div>
								<label class="text-caption-uppercase text-muted block mb-2">Color</label>
								<div class="flex flex-wrap gap-2">
									{Object.entries(VALORANT_COLORS).map(([name, hex]) => (
										<button
											key={name}
											class={`btn-secondary text-body-sm ${val.color === hex ? "btn-primary" : ""}`}
											onClick={() => updateVal({ color: hex })}
										>
											{name}
										</button>
									))}
								</div>
							</div>
							<div class="grid grid-cols-2 gap-3">
								<div>
									<label class="text-caption text-muted block mb-1">
										Inner Length ({val.innerLineLength})
									</label>
									<input
										type="range"
										class="w-full"
										min={0}
										max={20}
										value={val.innerLineLength}
										onInput={(e) =>
											updateVal({
												innerLineLength: Number.parseInt((e.target as HTMLInputElement).value),
											})
										}
									/>
								</div>
								<div>
									<label class="text-caption text-muted block mb-1">
										Inner Thickness ({val.innerLineThickness})
									</label>
									<input
										type="range"
										class="w-full"
										min={1}
										max={10}
										value={val.innerLineThickness}
										onInput={(e) =>
											updateVal({
												innerLineThickness: Number.parseInt((e.target as HTMLInputElement).value),
											})
										}
									/>
								</div>
								<div>
									<label class="text-caption text-muted block mb-1">
										Inner Offset ({val.innerLineOffset})
									</label>
									<input
										type="range"
										class="w-full"
										min={0}
										max={20}
										value={val.innerLineOffset}
										onInput={(e) =>
											updateVal({
												innerLineOffset: Number.parseInt((e.target as HTMLInputElement).value),
											})
										}
									/>
								</div>
								<div>
									<label class="text-caption text-muted block mb-1">
										Outer Length ({val.outerLineLength})
									</label>
									<input
										type="range"
										class="w-full"
										min={0}
										max={20}
										value={val.outerLineLength}
										onInput={(e) =>
											updateVal({
												outerLineLength: Number.parseInt((e.target as HTMLInputElement).value),
											})
										}
									/>
								</div>
							</div>
							<div class="flex flex-wrap gap-3">
								<label class="flex items-center gap-2 text-body-sm cursor-pointer">
									<input
										type="checkbox"
										checked={val.centerDot}
										onChange={(e) =>
											updateVal({ centerDot: (e.target as HTMLInputElement).checked })
										}
									/>
									Center Dot
								</label>
								<label class="flex items-center gap-2 text-body-sm cursor-pointer">
									<input
										type="checkbox"
										checked={val.outlines}
										onChange={(e) =>
											updateVal({ outlines: (e.target as HTMLInputElement).checked })
										}
									/>
									Outlines
								</label>
							</div>
							<div class="flex flex-wrap gap-2">
								{Object.keys(VALORANT_PRESETS).map((name) => (
									<button
										key={name}
										class="btn-secondary text-body-sm"
										onClick={() => applyPreset(name)}
									>
										{name}
									</button>
								))}
							</div>
						</div>
					)}

					{game === "CS2" && (
						<div class="space-y-4">
							<div class="grid grid-cols-3 gap-3">
								<div>
									<label class="text-caption text-muted block mb-1">R ({cs2.r})</label>
									<input
										type="range"
										class="w-full"
										min={0}
										max={255}
										value={cs2.r}
										onInput={(e) =>
											updateCs2({ r: Number.parseInt((e.target as HTMLInputElement).value) })
										}
									/>
								</div>
								<div>
									<label class="text-caption text-muted block mb-1">G ({cs2.g})</label>
									<input
										type="range"
										class="w-full"
										min={0}
										max={255}
										value={cs2.g}
										onInput={(e) =>
											updateCs2({ g: Number.parseInt((e.target as HTMLInputElement).value) })
										}
									/>
								</div>
								<div>
									<label class="text-caption text-muted block mb-1">B ({cs2.b})</label>
									<input
										type="range"
										class="w-full"
										min={0}
										max={255}
										value={cs2.b}
										onInput={(e) =>
											updateCs2({ b: Number.parseInt((e.target as HTMLInputElement).value) })
										}
									/>
								</div>
							</div>
							<div class="grid grid-cols-2 gap-3">
								<div>
									<label class="text-caption text-muted block mb-1">Size ({cs2.size})</label>
									<input
										type="range"
										class="w-full"
										min={0}
										max={10}
										value={cs2.size}
										onInput={(e) =>
											updateCs2({ size: Number.parseInt((e.target as HTMLInputElement).value) })
										}
									/>
								</div>
								<div>
									<label class="text-caption text-muted block mb-1">
										Thickness ({cs2.thickness})
									</label>
									<input
										type="range"
										class="w-full"
										min={0}
										max={6}
										value={cs2.thickness}
										onInput={(e) =>
											updateCs2({
												thickness: Number.parseInt((e.target as HTMLInputElement).value),
											})
										}
									/>
								</div>
								<div>
									<label class="text-caption text-muted block mb-1">Gap ({cs2.gap})</label>
									<input
										type="range"
										class="w-full"
										min={-10}
										max={10}
										value={cs2.gap}
										onInput={(e) =>
											updateCs2({ gap: Number.parseInt((e.target as HTMLInputElement).value) })
										}
									/>
								</div>
								<div>
									<label class="text-caption text-muted block mb-1">Style ({cs2.style})</label>
									<select
										class="input w-full"
										value={cs2.style}
										onChange={(e) =>
											updateCs2({ style: Number.parseInt((e.target as HTMLSelectElement).value) })
										}
									>
										<option value={1}>1 - Default</option>
										<option value={2}>2 - Default Static</option>
										<option value={3}>3 - Classic</option>
										<option value={4}>4 - Dynamic</option>
										<option value={5}>5 - Dynamic Static</option>
									</select>
								</div>
							</div>
							<div class="flex flex-wrap gap-3">
								<label class="flex items-center gap-2 text-body-sm cursor-pointer">
									<input
										type="checkbox"
										checked={cs2.outline}
										onChange={(e) => updateCs2({ outline: (e.target as HTMLInputElement).checked })}
									/>
									Outline
								</label>
								<label class="flex items-center gap-2 text-body-sm cursor-pointer">
									<input
										type="checkbox"
										checked={cs2.dot}
										onChange={(e) => updateCs2({ dot: (e.target as HTMLInputElement).checked })}
									/>
									Center Dot
								</label>
							</div>
						</div>
					)}

					{game === "Overwatch 2" && (
						<div class="space-y-4">
							<div>
								<label class="text-caption-uppercase text-muted block mb-2">Type</label>
								<select
									class="input w-full"
									value={ow2.type}
									onChange={(e) =>
										updateOw2({
											type: (e.target as HTMLSelectElement).value as OW2Settings["type"],
										})
									}
								>
									<option value="Circle">Circle</option>
									<option value="Crosshair">Crosshair</option>
									<option value="Circle + Crosshair">Circle + Crosshair</option>
									<option value="Dot">Dot</option>
								</select>
							</div>
							<div>
								<label class="text-caption text-muted block mb-1">Color</label>
								<input
									type="color"
									class="input w-full"
									value={ow2.color}
									onInput={(e) => updateOw2({ color: (e.target as HTMLInputElement).value })}
								/>
							</div>
							<div class="grid grid-cols-2 gap-3">
								<div>
									<label class="text-caption text-muted block mb-1">
										Thickness ({ow2.thickness})
									</label>
									<input
										type="range"
										class="w-full"
										min={1}
										max={10}
										value={ow2.thickness}
										onInput={(e) =>
											updateOw2({
												thickness: Number.parseInt((e.target as HTMLInputElement).value),
											})
										}
									/>
								</div>
								<div>
									<label class="text-caption text-muted block mb-1">Length ({ow2.length})</label>
									<input
										type="range"
										class="w-full"
										min={1}
										max={30}
										value={ow2.length}
										onInput={(e) =>
											updateOw2({ length: Number.parseInt((e.target as HTMLInputElement).value) })
										}
									/>
								</div>
								<div>
									<label class="text-caption text-muted block mb-1">
										Center Gap ({ow2.centerGap})
									</label>
									<input
										type="range"
										class="w-full"
										min={0}
										max={20}
										value={ow2.centerGap}
										onInput={(e) =>
											updateOw2({
												centerGap: Number.parseInt((e.target as HTMLInputElement).value),
											})
										}
									/>
								</div>
							</div>
							<div class="flex flex-wrap gap-3">
								<label class="flex items-center gap-2 text-body-sm cursor-pointer">
									<input
										type="checkbox"
										checked={ow2.outline}
										onChange={(e) => updateOw2({ outline: (e.target as HTMLInputElement).checked })}
									/>
									Outline
								</label>
								<label class="flex items-center gap-2 text-body-sm cursor-pointer">
									<input
										type="checkbox"
										checked={ow2.dot}
										onChange={(e) => updateOw2({ dot: (e.target as HTMLInputElement).checked })}
									/>
									Center Dot
								</label>
							</div>
						</div>
					)}
				</div>

				{/* Preview & Output */}
				<div>
					<div class="bg-surface-elevated rounded-lg p-4 mb-4">
						<div class="text-caption-uppercase text-muted mb-2">Preview</div>
						<canvas
							ref={canvasRef}
							width={256}
							height={256}
							style="width: 100%; max-width: 256px; margin: 0 auto; display: block; border-radius: 8px;"
						/>
					</div>

					<div class="bg-surface-elevated rounded-lg p-4">
						<div class="flex items-center justify-between mb-2">
							<span class="text-caption-uppercase text-muted">Import Code</span>
							<button class="btn-secondary text-body-sm" onClick={handleCopyCode}>
								{copied ? "Copied!" : "Copy Code"}
							</button>
						</div>
						<textarea
							class="textarea w-full font-mono text-body-sm"
							rows={6}
							value={getCode()}
							readOnly
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Canvas Drawing Functions ─────────────────────────────────────────

function drawValorantCrosshair(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	s: ValorantSettings,
) {
	const scale = 4;

	// Draw inner lines
	if (s.innerLineLength > 0) {
		ctx.globalAlpha = s.innerLineOpacity;
		ctx.strokeStyle = s.color;
		ctx.lineWidth = s.innerLineThickness * scale;

		const len = s.innerLineLength * scale;
		const offset = s.innerLineOffset * scale;
		const halfThick = (s.innerLineThickness * scale) / 2;

		// Top
		ctx.beginPath();
		ctx.moveTo(cx, cy - offset - halfThick);
		ctx.lineTo(cx, cy - offset - halfThick - len);
		ctx.stroke();
		// Bottom
		ctx.beginPath();
		ctx.moveTo(cx, cy + offset + halfThick);
		ctx.lineTo(cx, cy + offset + halfThick + len);
		ctx.stroke();
		// Left
		ctx.beginPath();
		ctx.moveTo(cx - offset - halfThick, cy);
		ctx.lineTo(cx - offset - halfThick - len, cy);
		ctx.stroke();
		// Right
		ctx.beginPath();
		ctx.moveTo(cx + offset + halfThick, cy);
		ctx.lineTo(cx + offset + halfThick + len, cy);
		ctx.stroke();

		ctx.globalAlpha = 1;
	}

	// Draw outer lines
	if (s.outerLineLength > 0) {
		ctx.globalAlpha = s.outerLineOpacity;
		ctx.strokeStyle = s.color;
		ctx.lineWidth = s.outerLineThickness * scale;

		const len = s.outerLineLength * scale;
		const innerLen = s.innerLineLength * scale;
		const innerOffset = s.innerLineOffset * scale;
		const outerOffset = s.outerLineOffset * scale;
		const gap = innerOffset + innerLen + outerOffset;
		const halfThick = (s.outerLineThickness * scale) / 2;

		// Top
		ctx.beginPath();
		ctx.moveTo(cx, cy - gap - halfThick);
		ctx.lineTo(cx, cy - gap - halfThick - len);
		ctx.stroke();
		// Bottom
		ctx.beginPath();
		ctx.moveTo(cx, cy + gap + halfThick);
		ctx.lineTo(cx, cy + gap + halfThick + len);
		ctx.stroke();
		// Left
		ctx.beginPath();
		ctx.moveTo(cx - gap - halfThick, cy);
		ctx.lineTo(cx - gap - halfThick - len, cy);
		ctx.stroke();
		// Right
		ctx.beginPath();
		ctx.moveTo(cx + gap + halfThick, cy);
		ctx.lineTo(cx + gap + halfThick + len, cy);
		ctx.stroke();

		ctx.globalAlpha = 1;
	}

	// Draw center dot
	if (s.centerDot) {
		ctx.fillStyle = s.color;
		const dotSize = s.centerDotThickness * scale;
		ctx.fillRect(cx - dotSize / 2, cy - dotSize / 2, dotSize, dotSize);
	}

	// Draw outlines
	if (s.outlines) {
		ctx.globalAlpha = s.outlineOpacity;
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = 1;
		ctx.globalAlpha = 1;
	}
}

function drawCS2Crosshair(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: CS2Settings) {
	const scale = 4;
	const color = `rgb(${s.r}, ${s.g}, ${s.b})`;

	ctx.strokeStyle = color;
	ctx.fillStyle = color;

	const gap = s.gap * scale;
	const halfLen = (s.size * scale) / 2;

	if (s.style === 1 || s.style === 4) {
		// Dynamic crosshair — draw lines
		ctx.lineWidth = s.thickness * scale;

		if (s.outline) {
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = s.thickness * scale + 2;
			drawCS2Lines(ctx, cx, cy, gap, halfLen);
			ctx.strokeStyle = color;
			ctx.lineWidth = s.thickness * scale;
		}
		drawCS2Lines(ctx, cx, cy, gap, halfLen);
	}

	if (s.dot) {
		const dotRadius = Math.max(1, s.thickness);
		ctx.beginPath();
		ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
		ctx.fill();
	}
}

function drawCS2Lines(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	gap: number,
	halfLen: number,
) {
	// Top
	ctx.beginPath();
	ctx.moveTo(cx, cy - gap);
	ctx.lineTo(cx, cy - gap - halfLen);
	ctx.stroke();
	// Bottom
	ctx.beginPath();
	ctx.moveTo(cx, cy + gap);
	ctx.lineTo(cx, cy + gap + halfLen);
	ctx.stroke();
	// Left
	ctx.beginPath();
	ctx.moveTo(cx - gap, cy);
	ctx.lineTo(cx - gap - halfLen, cy);
	ctx.stroke();
	// Right
	ctx.beginPath();
	ctx.moveTo(cx + gap, cy);
	ctx.lineTo(cx + gap + halfLen, cy);
	ctx.stroke();
}

function drawOW2Crosshair(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: OW2Settings) {
	const scale = 3;
	const halfLen = (s.length * scale) / 2;
	const gap = s.centerGap * scale;

	ctx.strokeStyle = s.color;
	ctx.fillStyle = s.color;
	ctx.lineWidth = s.thickness * scale;

	if (s.outline) {
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = s.thickness * scale + 2;

		if (s.type === "Crosshair" || s.type === "Circle + Crosshair") {
			drawCS2Lines(ctx, cx, cy, gap, halfLen);
		}
		if (s.type === "Circle" || s.type === "Circle + Crosshair") {
			const radius = gap + halfLen;
			ctx.beginPath();
			ctx.arc(cx, cy, radius, 0, Math.PI * 2);
			ctx.stroke();
		}

		ctx.strokeStyle = s.color;
		ctx.lineWidth = s.thickness * scale;
	}

	if (s.type === "Crosshair" || s.type === "Circle + Crosshair") {
		drawCS2Lines(ctx, cx, cy, gap, halfLen);
	}

	if (s.type === "Circle" || s.type === "Circle + Crosshair") {
		const radius = gap + halfLen;
		ctx.beginPath();
		ctx.arc(cx, cy, radius, 0, Math.PI * 2);
		ctx.stroke();
	}

	if (s.dot || s.type === "Dot") {
		const dotRadius = Math.max(2, s.thickness);
		ctx.beginPath();
		ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
		ctx.fill();
	}
}
