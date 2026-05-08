import { useCallback, useState } from "preact/hooks";

export default function BorderRadiusGenerator() {
	const [tl, setTl] = useState(8);
	const [tr, setTr] = useState(8);
	const [br, setBr] = useState(8);
	const [bl, setBl] = useState(8);
	const [copied, setCopied] = useState(false);
	const [linked, setLinked] = useState(true);

	const css = `border-radius: ${tl}px ${tr}px ${br}px ${bl}px;`;
	const shorthand =
		tl === tr && tr === br && br === bl
			? `border-radius: ${tl}px;`
			: tl === br && tr === bl
				? `border-radius: ${tl}px ${tr}px;`
				: css;

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(shorthand);
		} catch {
			/* ignore */
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [shorthand]);

	const handleAll = (val: number) => {
		setTl(val);
		setTr(val);
		setBr(val);
		setBl(val);
	};

	return (
		<div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div>
					<div class="mb-4">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={linked}
								onChange={(e) => {
									const v = (e.target as HTMLInputElement).checked;
									setLinked(v);
									if (v) handleAll(tl);
								}}
								class="w-4 h-4"
							/>
							<span class="text-body-sm">Link all corners</span>
						</label>
					</div>

					{linked ? (
						<div class="mb-4">
							<label class="text-caption-uppercase text-muted block mb-1">
								Border Radius: {tl}px
							</label>
							<input
								type="range"
								min={0}
								max={100}
								value={tl}
								onInput={(e) => handleAll(Number((e.target as HTMLInputElement).value))}
								class="w-full"
							/>
						</div>
					) : (
						<div class="grid grid-cols-2 gap-4 mb-4">
							<div>
								<label class="text-caption-uppercase text-muted block mb-1">Top Left: {tl}px</label>
								<input
									type="range"
									min={0}
									max={100}
									value={tl}
									onInput={(e) => setTl(Number((e.target as HTMLInputElement).value))}
									class="w-full"
								/>
							</div>
							<div>
								<label class="text-caption-uppercase text-muted block mb-1">
									Top Right: {tr}px
								</label>
								<input
									type="range"
									min={0}
									max={100}
									value={tr}
									onInput={(e) => setTr(Number((e.target as HTMLInputElement).value))}
									class="w-full"
								/>
							</div>
							<div>
								<label class="text-caption-uppercase text-muted block mb-1">
									Bottom Left: {bl}px
								</label>
								<input
									type="range"
									min={0}
									max={100}
									value={bl}
									onInput={(e) => setBl(Number((e.target as HTMLInputElement).value))}
									class="w-full"
								/>
							</div>
							<div>
								<label class="text-caption-uppercase text-muted block mb-1">
									Bottom Right: {br}px
								</label>
								<input
									type="range"
									min={0}
									max={100}
									value={br}
									onInput={(e) => setBr(Number((e.target as HTMLInputElement).value))}
									class="w-full"
								/>
							</div>
						</div>
					)}

					<div class="mb-4">
						<div class="flex items-center justify-between mb-1">
							<label class="text-caption-uppercase text-muted">Generated CSS</label>
							<button
								class="text-body-sm text-primary hover:text-primary-active"
								onClick={handleCopy}
							>
								{copied ? "Copied!" : "Copy"}
							</button>
						</div>
						<pre class="code-block font-mono" style="font-size: 13px">
							<code>{shorthand}</code>
						</pre>
					</div>
				</div>
				<div class="flex items-center justify-center">
					<div
						style={{
							width: 200,
							height: 200,
							borderRadius: `${tl}px ${tr}px ${br}px ${bl}px`,
							background: "var(--color-primary)",
							transition: "border-radius 0.15s ease",
						}}
					/>
				</div>
			</div>
		</div>
	);
}
