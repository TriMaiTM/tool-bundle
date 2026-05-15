import { useCallback, useMemo, useState } from "preact/hooks";

interface ErrorCodeEntry {
	code: string;
	platform: string;
	name: string;
	description: string;
	causes: string[];
	solutions: string[];
}

const PLATFORMS = [
	"All",
	"Riot/Vanguard",
	"Steam",
	"PlayStation",
	"Xbox",
	"Epic Games",
	"Windows",
] as const;

const ERROR_DATABASE: ErrorCodeEntry[] = [
	// ─── Riot / Vanguard ────────────────────────────────────────
	{
		code: "VAN 1067",
		platform: "Riot/Vanguard",
		name: "Vanguard Not Initialized",
		description:
			"Riot Vanguard anti-cheat failed to start or was not running when the game launched.",
		causes: [
			"Vanguard service not running",
			"TPM 2.0 or Secure Boot not enabled",
			"Vanguard not installed properly",
		],
		solutions: [
			"Restart your PC and let Vanguard initialize in the system tray",
			"Enable TPM 2.0 and Secure Boot in BIOS",
			"Uninstall and reinstall Riot Vanguard",
			"Run the game as administrator",
		],
	},
	{
		code: "VAN 128",
		platform: "Riot/Vanguard",
		name: "Vanguard Error",
		description: "Vanguard encountered an error and could not verify your game files.",
		causes: ["Corrupted game files", "Conflicting software", "Outdated Windows version"],
		solutions: [
			"Repair game files through the Riot client",
			"Update Windows to the latest version",
			"Disable conflicting overlay software (Discord, MSI Afterburner)",
			"Reinstall Vanguard",
		],
	},
	{
		code: "VAN 1",
		platform: "Riot/Vanguard",
		name: "Connection Error",
		description: "Unable to connect to Riot services.",
		causes: ["Internet connectivity issues", "Riot servers down", "Firewall blocking connection"],
		solutions: [
			"Check your internet connection",
			"Check Riot server status",
			"Allow Riot client through firewall",
			"Restart your router",
		],
	},
	{
		code: "VAN 152",
		platform: "Riot/Vanguard",
		name: "Hardware Ban",
		description: "Your hardware has been banned by Riot Vanguard.",
		causes: ["Previous cheating violation", "Hardware ID flagged"],
		solutions: ["Contact Riot Support to appeal", "Ensure no unauthorized software is running"],
	},
	{
		code: "VAN 185",
		platform: "Riot/Vanguard",
		name: "Network Issue",
		description: "Vanguard could not connect to the network.",
		causes: ["VPN or proxy interference", "Network adapter issues", "DNS problems"],
		solutions: [
			"Disable VPN or proxy",
			"Flush DNS cache (ipconfig /flushdns)",
			"Reset network adapter",
			"Use Google DNS (8.8.8.8)",
		],
	},
	{
		code: "VAN 6",
		platform: "Riot/Vanguard",
		name: "Vanguard Crash",
		description: "Vanguard has crashed or stopped running.",
		causes: ["Vanguard service crashed", "System instability"],
		solutions: ["Restart your PC", "Reinstall Vanguard", "Update system drivers"],
	},
	{
		code: "VAN 81",
		platform: "Riot/Vanguard",
		name: "Service Error",
		description: "Vanguard service could not be started.",
		causes: ["Vanguard service disabled", "Permission issues"],
		solutions: [
			"Open Services.msc and ensure vgk service is set to Automatic",
			"Run the Riot client as administrator",
			"Reinstall Vanguard",
		],
	},
	{
		code: "VAN -81",
		platform: "Riot/Vanguard",
		name: "Connection Timeout",
		description: "Connection to Riot services timed out.",
		causes: ["Slow internet connection", "Server overload"],
		solutions: ["Check your internet speed", "Try again later", "Restart your router"],
	},
	{
		code: "VAN -102",
		platform: "Riot/Vanguard",
		name: "Platform Error",
		description: "Riot Client platform encountered an error.",
		causes: ["Corrupted Riot Client installation", "Conflicting software"],
		solutions: ["Reinstall the Riot Client", "Clear Riot Client cache", "Run as administrator"],
	},
	{
		code: "VAN -104",
		platform: "Riot/Vanguard",
		name: "Connection Lost",
		description: "Lost connection to Riot services during gameplay.",
		causes: ["Unstable internet connection", "Server issues", "Network congestion"],
		solutions: [
			"Use a wired connection instead of Wi-Fi",
			"Close bandwidth-heavy applications",
			"Check Riot server status",
		],
	},

	// ─── Steam ───────────────────────────────────────────────────
	{
		code: "53",
		platform: "Steam",
		name: "No Subscription",
		description: "You do not own or subscribe to the required content.",
		causes: ["Game not purchased", "Family sharing revoked", "Subscription expired"],
		solutions: [
			"Purchase the game from the Steam store",
			"Check Family Sharing settings",
			"Verify your Steam library",
		],
	},
	{
		code: "101",
		platform: "Steam",
		name: "Not Online",
		description: "Steam is not connected to the internet.",
		causes: ["No internet connection", "Steam servers down"],
		solutions: ["Check your internet connection", "Restart Steam", "Check Steam server status"],
	},
	{
		code: "105",
		platform: "Steam",
		name: "Not Logged On",
		description: "You are not logged into Steam.",
		causes: ["Session expired", "Steam client issue"],
		solutions: ["Log out and log back in", "Restart Steam", "Clear Steam cache"],
	},
	{
		code: "118",
		platform: "Steam",
		name: "Unable to Connect",
		description: "Unable to connect to the Steam network.",
		causes: ["Firewall blocking Steam", "Network issues", "Steam maintenance"],
		solutions: [
			"Allow Steam through your firewall",
			"Restart your router",
			"Try a different network",
			"Flush DNS cache",
		],
	},
	{
		code: "130",
		platform: "Steam",
		name: "Invalid Connection",
		description: "Failed to connect to Steam servers.",
		causes: ["Server overload", "Network configuration issues"],
		solutions: ["Try again later", "Change download region in Steam settings", "Restart Steam"],
	},
	{
		code: "137",
		platform: "Steam",
		name: "Content Corrupted",
		description: "Game content is corrupted or missing.",
		causes: ["Incomplete download", "Disk errors"],
		solutions: [
			"Verify game file integrity (right-click game > Properties > Local Files)",
			"Clear Steam download cache",
			"Reinstall the game",
		],
	},
	{
		code: "202",
		platform: "Steam",
		name: "Connection Failure",
		description: "Failed to establish a connection with the game server.",
		causes: ["Server offline", "Network issues"],
		solutions: ["Check game server status", "Restart your router", "Try a different server region"],
	},
	{
		code: "310",
		platform: "Steam",
		name: "Page Not Found",
		description: "The requested Steam page could not be found.",
		causes: ["Removed or renamed content", "Invalid URL"],
		solutions: [
			"Search for the content in the Steam store",
			"Clear browser cache",
			"Restart Steam client",
		],
	},
	{
		code: "403",
		platform: "Steam",
		name: "Access Denied",
		description: "You do not have permission to access this content.",
		causes: ["Region restriction", "Age restriction", "Account restriction"],
		solutions: [
			"Check if the content is available in your region",
			"Verify your account is in good standing",
			"Contact Steam Support",
		],
	},
	{
		code: "502",
		platform: "Steam",
		name: "Bad Gateway",
		description: "Steam received an invalid response from the server.",
		causes: ["Server overload", "Maintenance"],
		solutions: ["Try again later", "Check Steam server status", "Restart Steam"],
	},
	{
		code: "503",
		platform: "Steam",
		name: "Service Unavailable",
		description: "Steam services are temporarily unavailable.",
		causes: ["Planned maintenance", "Server overload (Steam Sales)"],
		solutions: [
			"Wait and try again later",
			"Check @Steam on Twitter for updates",
			"Restart Steam after some time",
		],
	},

	// ─── PlayStation ─────────────────────────────────────────────
	{
		code: "CE-34878-0",
		platform: "PlayStation",
		name: "Application Crash",
		description: "The application has crashed due to an error.",
		causes: ["Game bug or corrupted data", "System software issue", "HDD corruption"],
		solutions: [
			"Restart the PS4/PS5",
			"Update the game and system software",
			"Rebuild the database (Safe Mode option 5)",
			"Reinstall the game",
			"Initialize PS4/PS5 (last resort)",
		],
	},
	{
		code: "CE-36329-3",
		platform: "PlayStation",
		name: "System Software Error",
		description: "An error has occurred with the system software.",
		causes: ["Corrupted system software", "Failed update"],
		solutions: [
			"Update system software in Safe Mode",
			"Rebuild database in Safe Mode",
			"Reinstall system software via USB",
		],
	},
	{
		code: "CE-30005-8",
		platform: "PlayStation",
		name: "HDD/Blu-ray Error",
		description: "Cannot access the hard drive or Blu-ray disc.",
		causes: ["Disc read error", "HDD failure", "Corrupted game data"],
		solutions: ["Clean the disc", "Rebuild database", "Check HDD health", "Reinstall the game"],
	},
	{
		code: "CE-30002-5",
		platform: "PlayStation",
		name: "Application Data Corrupted",
		description: "The application data is corrupted.",
		causes: ["Corrupted save data", "Failed installation"],
		solutions: ["Delete the corrupted save data", "Reinstall the application", "Rebuild database"],
	},
	{
		code: "NW-31456-9",
		platform: "PlayStation",
		name: "Connection Error",
		description: "Cannot connect to the PlayStation Network.",
		causes: ["Network issues", "PSN servers down", "DNS problems"],
		solutions: [
			"Check PSN server status",
			"Restart your router",
			"Change DNS to 8.8.8.8 / 8.8.4.4",
			"Test internet connection on PS4/PS5",
		],
	},
	{
		code: "WS-37397-9",
		platform: "PlayStation",
		name: "PSN Connection Error",
		description: "Could not connect to PlayStation Network.",
		causes: ["IP address banned", "PSN maintenance", "Network issues"],
		solutions: [
			"Check PSN status",
			"Restart your router to get a new IP",
			"Contact your ISP",
			"Wait for maintenance to end",
		],
	},
	{
		code: "SU-30746-0",
		platform: "PlayStation",
		name: "System Update Failed",
		description: "The system software update file cannot be found or is corrupted.",
		causes: ["Corrupted update file", "USB format issues"],
		solutions: [
			"Download the update file again from PlayStation.com",
			"Use a FAT32 formatted USB drive",
			"Install in Safe Mode",
		],
	},

	// ─── Xbox ────────────────────────────────────────────────────
	{
		code: "0x80070005",
		platform: "Xbox",
		name: "Access Denied",
		description: "You don't have the necessary permissions to perform this action.",
		causes: ["Insufficient permissions", "Parental controls", "Account issues"],
		solutions: [
			"Check your account permissions",
			"Verify parental control settings",
			"Sign out and sign back in",
			"Contact Xbox Support",
		],
	},
	{
		code: "0x8027025a",
		platform: "Xbox",
		name: "App Launch Error",
		description: "Xbox took too long to start the application.",
		causes: ["App corruption", "Server issues", "Slow storage"],
		solutions: [
			"Restart the Xbox",
			"Clear persistent storage",
			"Uninstall and reinstall the app",
			"Check Xbox server status",
		],
	},
	{
		code: "0x87e107df",
		platform: "Xbox",
		name: "Disc Read Error",
		description: "The Xbox cannot read the game disc.",
		causes: ["Scratched or dirty disc", "Disc drive malfunction"],
		solutions: [
			"Clean the disc with a soft cloth",
			"Try another disc to test the drive",
			"Power cycle the Xbox",
			"Contact Xbox Support for hardware repair",
		],
	},
	{
		code: "E200",
		platform: "Xbox",
		name: "Startup Error",
		description: "The Xbox encountered an error during startup.",
		causes: ["System update failure", "HDD corruption"],
		solutions: [
			"Perform a hard reset (hold power for 10 seconds)",
			"Offline system update via USB",
			"Factory reset (keeps games and apps)",
		],
	},
	{
		code: "E105",
		platform: "Xbox",
		name: "System Error",
		description: "The Xbox has encountered a system error.",
		causes: ["HDD failure", "Corrupted system files"],
		solutions: [
			"Restart the console",
			"Offline system update",
			"Factory reset",
			"Contact Xbox Support for repair",
		],
	},
	{
		code: "E102",
		platform: "Xbox",
		name: "System Update Error",
		description: "The Xbox encountered an error during a system update.",
		causes: ["Failed update installation", "Network issues during update"],
		solutions: ["Offline system update via USB", "Factory reset", "Check your network connection"],
	},
	{
		code: "E203",
		platform: "Xbox",
		name: "Update Error",
		description: "An error occurred during the system update.",
		causes: ["Corrupted update", "Storage issues"],
		solutions: ["Offline system update via USB", "Factory reset", "Contact Xbox Support"],
	},

	// ─── Epic Games ──────────────────────────────────────────────
	{
		code: "LS-0013",
		platform: "Epic Games",
		name: "Launch Error",
		description: "The game could not be started.",
		causes: ["Game files corrupted", "Missing dependencies", "Antivirus blocking"],
		solutions: [
			"Verify game files in Epic Games Launcher",
			"Install missing Visual C++ redistributables",
			"Add the game to antivirus exceptions",
			"Run as administrator",
		],
	},
	{
		code: "AS-3",
		platform: "Epic Games",
		name: "Authentication Failed",
		description: "Failed to authenticate with Epic Games services.",
		causes: ["Invalid credentials", "Two-factor authentication issue", "Server problems"],
		solutions: [
			"Check your login credentials",
			"Verify 2FA method",
			"Reset your password",
			"Check Epic Games server status",
		],
	},
	{
		code: "SU-MN-B",
		platform: "Epic Games",
		name: "Update Required",
		description: "A game update is required before you can play.",
		causes: ["Outdated game version", "Auto-update disabled"],
		solutions: [
			"Check for updates in Epic Games Launcher",
			"Enable auto-updates",
			"Restart the launcher",
		],
	},
	{
		code: "500",
		platform: "Epic Games",
		name: "Internal Server Error",
		description: "Epic Games servers encountered an internal error.",
		causes: ["Server-side issue", "High traffic (e.g., Fortnite events)"],
		solutions: ["Try again later", "Check Epic Games status page", "Restart the launcher"],
	},
	{
		code: "502",
		platform: "Epic Games",
		name: "Bad Gateway",
		description: "Epic Games received an invalid response from upstream servers.",
		causes: ["Server overload", "Maintenance"],
		solutions: ["Wait and try again", "Check Epic Games status", "Restart your launcher"],
	},
	{
		code: "504",
		platform: "Epic Games",
		name: "Gateway Timeout",
		description: "The request to Epic Games servers timed out.",
		causes: ["Server overload", "Network congestion"],
		solutions: ["Try again later", "Check your internet connection", "Check Epic Games status"],
	},

	// ─── Windows ─────────────────────────────────────────────────
	{
		code: "0x80004005",
		platform: "Windows",
		name: "Unspecified Error",
		description: "An unspecified error occurred. This is a generic error code.",
		causes: [
			"Corrupted system files",
			"Permission issues",
			"Failed Windows Update",
			"Antivirus interference",
		],
		solutions: [
			"Run Windows Update Troubleshooter",
			"Run SFC /scannow in Command Prompt",
			"Disable antivirus temporarily",
			"Take ownership of the file/folder",
		],
	},
	{
		code: "0x80070002",
		platform: "Windows",
		name: "File Not Found",
		description: "The system cannot find the file specified.",
		causes: ["Missing system files", "Corrupted Windows Update", "Registry errors"],
		solutions: [
			"Run SFC /scannow",
			"Run DISM /Online /Cleanup-Image /RestoreHealth",
			"Delete SoftwareDistribution folder and retry update",
			"Check disk for errors (chkdsk /f)",
		],
	},
	{
		code: "0x80070057",
		platform: "Windows",
		name: "Invalid Parameter",
		description: "The parameter is incorrect.",
		causes: ["Invalid file path", "Corrupted partition", "Registry corruption"],
		solutions: [
			"Check file paths for special characters",
			"Run SFC /scannow",
			"Create a new user profile",
			"Format the partition (backup first)",
		],
	},
	{
		code: "0x800F0922",
		platform: "Windows",
		name: "Update Installation Failed",
		description:
			"Windows Update failed to install. Could be a .NET Framework or feature update issue.",
		causes: [
			"Insufficient disk space on System Reserved partition",
			"VPN blocking update",
			".NET Framework issue",
		],
		solutions: [
			"Disconnect VPN before updating",
			"Free up space on the System Reserved partition",
			"Run Windows Update Troubleshooter",
			"Manually install the update from Microsoft Update Catalog",
		],
	},
];

export default function ErrorCodeLookup() {
	const [search, setSearch] = useState("");
	const [platform, setPlatform] = useState<string>("All");
	const [expanded, setExpanded] = useState<Set<string>>(new Set());
	const [copiedCode, setCopiedCode] = useState<string | null>(null);

	const filtered = useMemo(() => {
		const q = search.toLowerCase().trim();
		return ERROR_DATABASE.filter((entry) => {
			if (platform !== "All" && entry.platform !== platform) return false;
			if (!q) return true;
			return (
				entry.code.toLowerCase().includes(q) ||
				entry.name.toLowerCase().includes(q) ||
				entry.description.toLowerCase().includes(q) ||
				entry.causes.some((c) => c.toLowerCase().includes(q)) ||
				entry.solutions.some((s) => s.toLowerCase().includes(q))
			);
		});
	}, [search, platform]);

	const toggleExpand = useCallback((code: string) => {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(code)) {
				next.delete(code);
			} else {
				next.add(code);
			}
			return next;
		});
	}, []);

	const handleCopy = useCallback(async (entry: ErrorCodeEntry) => {
		const text = [
			`Error: ${entry.code} - ${entry.name}`,
			`Platform: ${entry.platform}`,
			`Description: ${entry.description}`,
			`Causes: ${entry.causes.join("; ")}`,
			`Solutions: ${entry.solutions.join("; ")}`,
		].join("\n");
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			/* ignore */
		}
		setCopiedCode(entry.code);
		setTimeout(() => setCopiedCode(null), 2000);
	}, []);

	return (
		<div>
			<div class="flex flex-wrap items-center gap-3 mb-4">
				<div class="flex-1" style="min-width: 200px">
					<input
						type="text"
						class="input w-full"
						placeholder="Search by code, keyword, or description..."
						value={search}
						onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
					/>
				</div>
				<div>
					<select
						class="input"
						value={platform}
						onChange={(e) => setPlatform((e.target as HTMLSelectElement).value)}
					>
						{PLATFORMS.map((p) => (
							<option value={p} key={p}>
								{p}
							</option>
						))}
					</select>
				</div>
			</div>

			<div class="text-body-sm text-muted mb-3">
				{filtered.length} error code{filtered.length !== 1 ? "s" : ""} found
			</div>

			<div class="space-y-2">
				{filtered.map((entry) => {
					const isExpanded = expanded.has(entry.code);
					return (
						<div key={entry.code} class="card">
							<div
								class="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-elevated transition-colors"
								onClick={() => toggleExpand(entry.code)}
							>
								<span class="font-mono font-bold text-body-lg" style="color: var(--color-error)">
									{entry.code}
								</span>
								<span class="font-medium flex-1">{entry.name}</span>
								<span class="badge">{entry.platform}</span>
								<button
									class="btn-secondary text-body-sm"
									onClick={(e) => {
										e.stopPropagation();
										handleCopy(entry);
									}}
								>
									{copiedCode === entry.code ? "Copied!" : "Copy"}
								</button>
							</div>

							{isExpanded && (
								<div class="px-4 pb-4 pt-0 border-t border-hairline">
									<p class="text-body-sm text-muted mt-3">{entry.description}</p>

									<div class="mt-3">
										<span class="text-caption-uppercase text-muted">Common Causes</span>
										<ul class="list-disc list-inside text-body-sm mt-1 space-y-1">
											{entry.causes.map((cause) => (
												<li key={cause}>{cause}</li>
											))}
										</ul>
									</div>

									<div class="mt-3">
										<span class="text-caption-uppercase text-muted">Solutions</span>
										<ol class="list-decimal list-inside text-body-sm mt-1 space-y-1">
											{entry.solutions.map((solution) => (
												<li key={solution}>{solution}</li>
											))}
										</ol>
									</div>
								</div>
							)}
						</div>
					);
				})}
			</div>

			{filtered.length === 0 && (
				<div class="text-center py-12">
					<p class="text-muted">No error codes found matching your search.</p>
					<p class="text-body-sm text-muted mt-1">
						Try a different code or keyword, or change the platform filter.
					</p>
				</div>
			)}
		</div>
	);
}
