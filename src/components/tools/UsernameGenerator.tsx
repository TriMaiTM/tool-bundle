import { useCallback, useState } from "preact/hooks";

const ADJECTIVES = [
	"happy",
	"swift",
	"brave",
	"calm",
	"dark",
	"eager",
	"fair",
	"grand",
	"keen",
	"loud",
	"mild",
	"neat",
	"proud",
	"quick",
	"rare",
	"sharp",
	"tall",
	"vast",
	"warm",
	"wild",
	"young",
	"bold",
	"cool",
	"deep",
	"fast",
	"glad",
	"high",
	"jolly",
	"kind",
	"lazy",
	"mega",
	"noble",
	"omega",
	"prime",
	"royal",
	"super",
	"ultra",
	"vivid",
	"witty",
	"zesty",
	"azure",
	"crimson",
	"golden",
	"silver",
	"scarlet",
	"phantom",
	"shadow",
	"cosmic",
	"epic",
	"fierce",
	"gentle",
	"iron",
	"lunar",
	"mystic",
	"ninja",
	"pixel",
];

const NOUNS = [
	"wolf",
	"tiger",
	"eagle",
	"dragon",
	"phoenix",
	"lion",
	"hawk",
	"bear",
	"fox",
	"panther",
	"cobra",
	"falcon",
	"shark",
	"storm",
	"flame",
	"blade",
	"star",
	"moon",
	"comet",
	"thunder",
	"frost",
	"spark",
	"ember",
	"stone",
	"knight",
	"wizard",
	"ranger",
	"hunter",
	"ghost",
	"spirit",
	"viper",
	"raven",
	"coder",
	"hacker",
	"guru",
	"ninja",
	"samurai",
	"viking",
	"titan",
	"atlas",
	"cyborg",
	"android",
	"robot",
	"pixel",
	"glitch",
	"matrix",
	"cipher",
	"nexus",
	"zen",
	"lotus",
	"sage",
	"oracle",
	"mystic",
	"hermit",
	"nomad",
	"pioneer",
];

const GAMING_TERMS = [
	"frag",
	"pwn",
	"gg",
	"noob",
	"leet",
	"ace",
	"clutch",
	"rush",
	"camp",
	"grind",
	"loot",
	"raid",
	"boss",
	"epic",
	"legend",
	"pro",
	"combo",
	"crit",
	"buff",
	"nerf",
	"spawn",
	"respawn",
	"lag",
	"ping",
	"headshot",
	"killstreak",
	"victory",
	"champion",
	"arena",
	"guild",
	"clan",
	"squad",
];

type Style = "gamer" | "professional" | "funny" | "random" | "cute";
type Separator = "-" | "_" | "." | "none";

function pick<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function generateUsername(
	style: Style,
	separator: string,
	wordCount: number,
	includeNumbers: boolean,
	maxLength: number,
): string {
	let parts: string[] = [];

	switch (style) {
		case "gamer": {
			const adj = pick(ADJECTIVES);
			const noun = pick(NOUNS);
			const term = pick(GAMING_TERMS);
			if (wordCount === 2) {
				parts = [pick([adj, term]), noun];
			} else {
				parts = [adj, pick([noun, term]), pick(GAMING_TERMS)];
			}
			break;
		}
		case "professional": {
			const adj = pick([
				"tech",
				"data",
				"cloud",
				"smart",
				"digital",
				"cyber",
				"net",
				"web",
				"dev",
				"code",
			]);
			const noun = pick([
				"dev",
				"engineer",
				"architect",
				"lead",
				"admin",
				"analyst",
				"guru",
				"expert",
				"pro",
				"specialist",
			]);
			if (wordCount === 2) {
				parts = [adj, noun];
			} else {
				parts = [adj, noun, pick(["hub", "lab", "io", "dev", "works", "forge"])];
			}
			break;
		}
		case "funny": {
			const adj = pick([
				"silly",
				"goofy",
				"wacky",
				"zany",
				"quirky",
				"nutty",
				"bonkers",
				"loopy",
				"ditzy",
				"klutzy",
			]);
			const noun = pick([
				"potato",
				"banana",
				"pickle",
				"nugget",
				"waffle",
				"taco",
				"burrito",
				"muffin",
				"cupcake",
				"pancake",
			]);
			if (wordCount === 2) {
				parts = [adj, noun];
			} else {
				parts = [adj, noun, pick(["lord", "master", "king", "queen", "overlord", "champion"])];
			}
			break;
		}
		case "cute": {
			const adj = pick([
				"fluffy",
				"bubbly",
				"sparkly",
				"dreamy",
				"cozy",
				"tiny",
				"sweet",
				"soft",
				"gentle",
				"happy",
			]);
			const noun = pick([
				"bunny",
				"kitten",
				"puppy",
				"panda",
				"unicorn",
				"star",
				"cloud",
				"flower",
				"butterfly",
				"rainbow",
			]);
			if (wordCount === 2) {
				parts = [adj, noun];
			} else {
				parts = [adj, noun, pick(["love", "xo", "kiss", "hug", "glow", "shine"])];
			}
			break;
		}
		default: {
			const allWords = [...ADJECTIVES, ...NOUNS, ...GAMING_TERMS];
			for (let i = 0; i < wordCount; i++) {
				parts.push(pick(allWords));
			}
			break;
		}
	}

	let username = parts.join(separator === "none" ? "" : separator);

	if (includeNumbers) {
		const num = Math.floor(Math.random() * 900) + 100;
		username = `${username}${separator === "none" ? "" : separator}${num}`;
	}

	if (maxLength > 0 && username.length > maxLength) {
		username = username.substring(0, maxLength);
	}

	return username;
}

export default function UsernameGenerator() {
	const [style, setStyle] = useState<Style>("random");
	const [separator, setSeparator] = useState<Separator>("-");
	const [wordCount, setWordCount] = useState(2);
	const [includeNumbers, setIncludeNumbers] = useState(true);
	const [maxLength, setMaxLength] = useState(20);
	const [usernames, setUsernames] = useState<string[]>([]);
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

	const generate = useCallback(() => {
		const results: string[] = [];
		for (let i = 0; i < 10; i++) {
			results.push(generateUsername(style, separator, wordCount, includeNumbers, maxLength));
		}
		setUsernames(results);
	}, [style, separator, wordCount, includeNumbers, maxLength]);

	const handleCopy = useCallback(async (username: string, index: number) => {
		await navigator.clipboard.writeText(username);
		setCopiedIndex(index);
		setTimeout(() => setCopiedIndex(null), 1500);
	}, []);

	const handleCopyAll = useCallback(async () => {
		if (usernames.length > 0) {
			await navigator.clipboard.writeText(usernames.join("\n"));
			setCopiedIndex(-1);
			setTimeout(() => setCopiedIndex(null), 1500);
		}
	}, [usernames]);

	return (
		<div>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Style</label>
					<select
						value={style}
						onChange={(e) => setStyle((e.target as HTMLSelectElement).value as Style)}
						class="input w-full"
					>
						<option value="gamer">Gamer</option>
						<option value="professional">Professional</option>
						<option value="funny">Funny</option>
						<option value="random">Random</option>
						<option value="cute">Cute</option>
					</select>
				</div>

				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Separator</label>
					<select
						value={separator}
						onChange={(e) => setSeparator((e.target as HTMLSelectElement).value as Separator)}
						class="input w-full"
					>
						<option value="-">Dash (-)</option>
						<option value="_">Underscore (_)</option>
						<option value=".">Dot (.)</option>
						<option value="none">None</option>
					</select>
				</div>

				<div>
					<label class="text-caption-uppercase text-muted block mb-2">
						Word Count: {wordCount}
					</label>
					<input
						type="range"
						min="2"
						max="3"
						value={wordCount}
						onInput={(e) => setWordCount(Number.parseInt((e.target as HTMLInputElement).value))}
						class="w-full"
					/>
					<div class="flex justify-between text-body-sm text-muted-soft mt-1">
						<span>2</span>
						<span>3</span>
					</div>
				</div>

				<div>
					<label class="text-caption-uppercase text-muted block mb-2">
						Max Length: {maxLength}
					</label>
					<input
						type="range"
						min="8"
						max="30"
						value={maxLength}
						onInput={(e) => setMaxLength(Number.parseInt((e.target as HTMLInputElement).value))}
						class="w-full"
					/>
					<div class="flex justify-between text-body-sm text-muted-soft mt-1">
						<span>8</span>
						<span>30</span>
					</div>
				</div>

				<div class="flex items-end">
					<label class="flex items-center gap-2">
						<input
							type="checkbox"
							checked={includeNumbers}
							onChange={(e) => setIncludeNumbers((e.target as HTMLInputElement).checked)}
							class="rounded border-hairline"
						/>
						<span class="text-body-sm text-body">Include numbers</span>
					</label>
				</div>

				<div class="flex items-end">
					<button class="btn-primary w-full" onClick={generate}>
						Generate Usernames
					</button>
				</div>
			</div>

			{usernames.length > 0 && (
				<div class="mt-6">
					<div class="flex items-center justify-between mb-3">
						<label class="text-caption-uppercase text-muted">Generated Usernames</label>
						<div class="flex gap-2">
							<button class="btn-secondary text-body-sm" onClick={generate}>
								Regenerate
							</button>
							<button class="btn-secondary text-body-sm" onClick={handleCopyAll}>
								{copiedIndex === -1 ? "Copied!" : "Copy All"}
							</button>
						</div>
					</div>
					<div class="space-y-2">
						{usernames.map((username, index) => (
							<div class="bg-surface-elevated rounded-lg p-3 flex items-center justify-between">
								<code class="text-body-sm text-body-strong" style="font-family: var(--font-mono)">
									{username}
								</code>
								<button
									class="text-body-sm text-primary hover:text-primary-active transition-colors"
									onClick={() => handleCopy(username, index)}
								>
									{copiedIndex === index ? "Copied!" : "Copy"}
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{usernames.length === 0 && (
				<div class="text-center py-12 text-muted">
					Click "Generate Usernames" to create unique usernames.
				</div>
			)}
		</div>
	);
}
