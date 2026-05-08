import { useCallback, useState } from "preact/hooks";

interface TechOption {
	id: string;
	name: string;
	category: string;
}

const TECHS: TechOption[] = [
	// Languages
	{ id: "node", name: "Node.js", category: "Languages" },
	{ id: "python", name: "Python", category: "Languages" },
	{ id: "java", name: "Java", category: "Languages" },
	{ id: "go", name: "Go", category: "Languages" },
	{ id: "rust", category: "Languages", name: "Rust" },
	{ id: "csharp", name: "C#", category: "Languages" },
	{ id: "php", name: "PHP", category: "Languages" },
	{ id: "ruby", name: "Ruby", category: "Languages" },
	{ id: "swift", name: "Swift", category: "Languages" },
	{ id: "kotlin", name: "Kotlin", category: "Languages" },
	{ id: "dart", name: "Dart", category: "Languages" },
	// Frameworks
	{ id: "react", name: "React", category: "Frameworks" },
	{ id: "vue", name: "Vue.js", category: "Frameworks" },
	{ id: "angular", name: "Angular", category: "Frameworks" },
	{ id: "svelte", name: "Svelte", category: "Frameworks" },
	{ id: "nextjs", name: "Next.js", category: "Frameworks" },
	{ id: "nuxt", name: "Nuxt.js", category: "Frameworks" },
	{ id: "astro", name: "Astro", category: "Frameworks" },
	{ id: "rails", name: "Rails", category: "Frameworks" },
	{ id: "laravel", name: "Laravel", category: "Frameworks" },
	{ id: "django", name: "Django", category: "Frameworks" },
	{ id: "flask", name: "Flask", category: "Frameworks" },
	{ id: "spring", name: "Spring Boot", category: "Frameworks" },
	{ id: "dotnet", name: ".NET", category: "Frameworks" },
	// Tools
	{ id: "docker", name: "Docker", category: "Tools" },
	{ id: "terraform", name: "Terraform", category: "Tools" },
	{ id: "kubernetes", name: "Kubernetes", category: "Tools" },
	{ id: "gradle", name: "Gradle", category: "Tools" },
	{ id: "maven", name: "Maven", category: "Tools" },
	{ id: "visualstudio", name: "Visual Studio", category: "IDEs" },
	{ id: "vscode", name: "VS Code", category: "IDEs" },
	{ id: "intellij", name: "IntelliJ", category: "IDEs" },
	{ id: "xcode", name: "Xcode", category: "IDEs" },
	{ id: "emacs", name: "Emacs", category: "IDEs" },
	{ id: "vim", name: "Vim", category: "IDEs" },
	{ id: "jetbrains", name: "JetBrains", category: "IDEs" },
	{ id: "windows", name: "Windows", category: "OS" },
	{ id: "macos", name: "macOS", category: "OS" },
	{ id: "linux", name: "Linux", category: "OS" },
];

const GITIGNORE_CONTENT: Record<string, string> = {
	node: "node_modules/\n.env\n.env.local\n.DS_Store\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\n.pnpm-debug.log*\ndist/\nbuild/\ncoverage/",
	python: "__pycache__/\n*.py[cod]\n*.egg-info/\ndist/\nbuild/\n.env\n.venv/\nvenv/\n*.log",
	java: "*.class\n*.jar\n*.war\n*.ear\n/build/\n/out/\n/target/\n*.log\n.DS_Store",
	go: "/bin/\n/vendor/\n*.exe\n*.exe~\n*.dll\n*.so\n*.dylib\n*.test\n*.out\ngo.work",
	rust: "/target/\n*.rs.bk\nCargo.lock\n.DS_Store",
	csharp: "bin/\nobj/\n*.user\n*.suo\n.vs/\n*.nupkg\npackages/\n.DS_Store",
	php: "vendor/\ncomposer.lock\n.env\n*.log\n.DS_Store\n.idea/\n.vscode/",
	ruby: "*.gem\n*.rbc\n/.config\n/coverage/\n/pkg/\n/spec/reports/\n/tmp/\n.DS_Store",
	swift: ".build/\nDerivedData/\n*.xcuserstate\nxcuserdata/\n*.pbxuser\nPods/",
	kotlin: "build/\n*.class\n*.jar\n.idea/\n*.iml\nout/\nlocal.properties",
	dart: ".dart_tool/\nbuild/\n.packages\npubspec.lock\n.dart_tool/",
	react: "node_modules/\nbuild/\n.env.local\n.DS_Store\ndist/",
	vue: "node_modules/\n.DS_Store\ndist/\n*.local",
	angular: "node_modules/\n.DS_Store\ndist/\n.angular/\n.tmp/",
	svelte: "node_modules/\nbuild/\n.DS_Store",
	nextjs: "node_modules/\n.next/\nout/\n.env*.local\n.DS_Store",
	nuxt: "node_modules/\n.nuxt/\n.output/\n.env*.local\n.DS_Store",
	astro: "node_modules/\n.astro/\ndist/\n.DS_Store",
	rails: "log/\ntmp/\n.DS_Store\n*.log\nstorage/\nvendor/bundle/",
	laravel: "/vendor/\npublic/storage\nstorage/*.key\n.env\nHomestead.json\nHomestead.yaml",
	django: "__pycache__/\n*.py[cod]\n*.log\n.env\n*.sqlite3\n/staticfiles/\n/media/",
	flask: "__pycache__/\n*.py[cod]\n.env\ninstance/\n.DS_Store",
	spring: "target/\n*.class\n*.jar\n.DS_Store\n.idea/\n*.iml\n*.log",
	dotnet: "bin/\nobj/\n.vs/\n*.user\n*.suo\npackages/\n*.nupkg",
	docker: "docker-compose.override.yml\n.DS_Store\n*.log",
	terraform: "*.tfstate\n*.tfstate.backup\n.terraform/\n*.tfvars\n!example.tfvars",
	kubernetes: "*.log\n.DS_Store",
	gradle: ".gradle/\nbuild/\n!gradle-wrapper.jar\nlocal.properties",
	maven: "target/\n*.class\n*.jar\n.DS_Store",
	visualstudio: ".vs/\n*.user\n*.suo\nbin/\nobj/\npackages/",
	vscode: ".vscode/\n!.vscode/settings.json\n!.vscode/launch.json\n!.vscode/extensions.json",
	intellij: ".idea/\n*.iml\nout/\n.DS_Store",
	xcode: "xcuserdata/\n*.pbxuser\n*.mode1v3\n*.mode2v3\nDerivedData/\nbuild/",
	emacs: "*~\n.*~\n*.elc\n\\#*\n.DS_Store",
	vim: "*.swp\n*.swo\n*~\nSession.vim\n.netrwhist",
	jetbrains: ".idea/\n*.iml\nout/\n.DS_Store\n*.log",
	windows: "Thumbs.db\nDesktop.ini\n*.log\n.DS_Store",
	macos: ".DS_Store\n.AppleDouble\n.LSOverride\n._*\n.Spotlight-V100\n.Trashes",
	linux: "*~\n.DS_Store\n*.log",
};

export default function GitignoreGenerator() {
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [copied, setCopied] = useState(false);

	const toggle = useCallback((id: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	const result = Array.from(selected)
		.map((id) => {
			const tech = TECHS.find((t) => t.id === id);
			const content = GITIGNORE_CONTENT[id] || "";
			return `# ${tech?.name || id}\n${content}`;
		})
		.join("\n\n");

	const handleCopy = useCallback(async () => {
		if (!result) return;
		try {
			await navigator.clipboard.writeText(result);
		} catch {
			/* ignore */
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [result]);

	const handleDownload = useCallback(() => {
		if (!result) return;
		const blob = new Blob([result], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = ".gitignore";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [result]);

	const categories = [...new Set(TECHS.map((t) => t.category))];

	return (
		<div>
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">Select Technologies</label>
				{categories.map((cat) => (
					<div key={cat} class="mb-3">
						<div class="text-body-sm text-muted mb-1">{cat}</div>
						<div class="flex flex-wrap gap-2">
							{TECHS.filter((t) => t.category === cat).map((tech) => (
								<button
									key={tech.id}
									onClick={() => toggle(tech.id)}
									class={`px-3 py-1.5 rounded-lg text-body-sm transition-all ${selected.has(tech.id) ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark border border-hairline"}`}
								>
									{tech.name}
								</button>
							))}
						</div>
					</div>
				))}
			</div>

			{result && (
				<div class="mb-4">
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Generated .gitignore</label>
						<div class="flex gap-2">
							<button
								class="text-body-sm text-primary hover:text-primary-active"
								onClick={handleCopy}
							>
								{copied ? "Copied!" : "Copy"}
							</button>
							<button
								class="text-body-sm text-primary hover:text-primary-active"
								onClick={handleDownload}
							>
								Download
							</button>
						</div>
					</div>
					<pre class="code-block" style="min-height: 200px; max-height: 500px; overflow-y: auto">
						<code>{result}</code>
					</pre>
				</div>
			)}

			{!result && (
				<div class="bg-surface-elevated rounded-lg p-6 text-center">
					<p class="text-body-sm text-muted">
						Select technologies above to generate your .gitignore file.
					</p>
				</div>
			)}
		</div>
	);
}
