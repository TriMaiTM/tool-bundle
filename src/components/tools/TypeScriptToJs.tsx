import { useState, useMemo, useCallback } from "preact/hooks";

interface StripResult {
  code: string;
  removedCount: number;
}

function stripTypeScript(code: string): StripResult {
  let result = code;
  let removedCount = 0;

  // Remove single-line comments and multi-line comments temporarily to avoid matching inside them
  const commentPlaceholders: string[] = [];
  result = result.replace(/\/\/.*$/gm, (match) => {
    commentPlaceholders.push(match);
    return `__COMMENT_${commentPlaceholders.length - 1}__`;
  });
  result = result.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    commentPlaceholders.push(match);
    return `__COMMENT_${commentPlaceholders.length - 1}__`;
  });

  // Remove string literals temporarily to avoid matching inside them
  const stringPlaceholders: string[] = [];
  result = result.replace(/(["'`])(?:(?!\1|\\).|\\.)*\1/g, (match) => {
    stringPlaceholders.push(match);
    return `__STRING_${stringPlaceholders.length - 1}__`;
  });

  // 1. Remove interface blocks: interface X { ... }
  result = result.replace(
    /(?:export\s+)?interface\s+\w+(?:\s+extends\s+[^{]+)?\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g,
    (match) => {
      removedCount++;
      return `/* ${match.trim().split("\n")[0].substring(0, 60)}... */`;
    },
  );

  // 2. Remove type declarations: type X = ... ;
  result = result.replace(
    /(?:export\s+)?type\s+\w+(?:<[^>]+>)?\s*=\s*[^;]+;/g,
    (match) => {
      removedCount++;
      return `/* ${match.trim().substring(0, 60)} */`;
    },
  );

  // 3. Remove enum declarations: enum X { ... }
  result = result.replace(
    /(?:const\s+)?(?:export\s+)?enum\s+\w+\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g,
    (match) => {
      removedCount++;
      return `/* ${match.trim().split("\n")[0].substring(0, 60)}... */`;
    },
  );

  // 4. Remove 'as Type' assertions
  result = result.replace(/\s+as\s+[A-Z]\w*(?:<[^>]+>)?(?:\[\])?/g, () => {
    removedCount++;
    return "";
  });

  // 5. Remove 'satisfies' keyword
  result = result.replace(/\s+satisfies\s+[A-Z]\w*(?:<[^>]+>)?/g, () => {
    removedCount++;
    return "";
  });

  // 6. Remove implements clauses
  result = result.replace(
    /\s+implements\s+[A-Z]\w*(?:<[^>]+>)?(?:\s*,\s*[A-Z]\w*(?:<[^>]+>)?)*/g,
    () => {
      removedCount++;
      return "";
    },
  );

  // 7. Remove access modifiers and readonly: private, protected, public, readonly
  result = result.replace(
    /(?:^|\n)(\s*)(?:private|protected|public)\s+(?!.*\()/gm,
    (match, indent) => {
      removedCount++;
      return indent;
    },
  );
  result = result.replace(/\s+readonly\s+/g, () => {
    removedCount++;
    return " ";
  });

  // 8. Remove generic type parameters from function calls: func<T>() -> func()
  result = result.replace(
    /(?<=\w)<[A-Z]\w*(?:\s*,\s*[A-Z]\w*)*(?:\s+extends\s+[^>]+)?>/g,
    (match) => {
      // Only remove if it looks like a generic type parameter (not comparison operators)
      if (match.includes("{") || match.includes('"') || match.includes("'"))
        return match;
      removedCount++;
      return "";
    },
  );

  // 9. Remove type annotations: ': Type' after parameters and variables
  // Match ': TypeName' patterns (with optional generics, arrays, union types)
  result = result.replace(
    /:\s*(?:string|number|boolean|void|any|never|unknown|bigint|symbol|null|undefined|object|[A-Z]\w*(?:<[^>]+>)?)(?:\[\])?(?:\s*\|[^=;,{)]+)?(?=\s*[=;,\)\}\s])/g,
    (match) => {
      removedCount++;
      return "";
    },
  );

  // 10. Remove function return type annotations: ): Type {
  result = result.replace(
    /\)\s*:\s*(?:string|number|boolean|void|any|never|unknown|bigint|symbol|null|undefined|object|[A-Z]\w*(?:<[^>]+>)?)(?:\[\])?(?:\s*\|[^;{]+)?(?=\s*\{)/g,
    (match) => {
      // Keep the ) but remove the type
      removedCount++;
      return ")";
    },
  );

  // 11. Remove standalone type imports: import type { ... }
  result = result.replace(
    /import\s+type\s+\{[^}]*\}\s+from\s+["'][^"']+["'];?\s*\n?/g,
    (match) => {
      removedCount++;
      return "";
    },
  );

  // Restore strings
  result = result.replace(
    /__STRING_(\d+)__/g,
    (_, idx) => stringPlaceholders[parseInt(idx)],
  );

  // Restore comments
  result = result.replace(
    /__COMMENT_(\d+)__/g,
    (_, idx) => commentPlaceholders[parseInt(idx)],
  );

  // Clean up empty comment blocks left by removed declarations
  result = result.replace(/\/\*\s*\*\/\s*\n?/g, "");

  // Clean up extra blank lines
  result = result.replace(/\n{3,}/g, "\n\n");

  return { code: result.trim(), removedCount };
}

const SAMPLE_TS = `interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

type UserRole = "admin" | "user" | "guest";

interface AdminUser extends User {
  permissions: string[];
}

enum Status {
  Active = "ACTIVE",
  Inactive = "INACTIVE",
  Pending = "PENDING",
}

function greetUser<T extends User>(user: T): string {
  return \`Hello, \${user.name}!\`;
}

function processUser(user: AdminUser): void {
  const status = Status.Active as Status;
  const role: UserRole = user.role;
  console.log(role);
}

class UserService implements UserService {
  private users: User[] = [];
  readonly apiUrl: string = "/api/users";

  async getUser(id: number): Promise<User | null> {
    return this.users.find((u: User) => u.id === id) ?? null;
  }

  addUser(user: Omit<User, "id">): void {
    const newUser: User = { ...user, id: Date.now() };
    this.users.push(newUser);
  }
}

type UserMap = Map<string, User[]>;

const users: User[] = [];
const admin = users.find((u): u is AdminUser => u.role === "admin");`;

export default function TypeScriptToJs() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return { code: "", removedCount: 0 };
    try {
      return stripTypeScript(input);
    } catch {
      return { code: "Error processing TypeScript", removedCount: 0 };
    }
  }, [input]);

  const handleCopy = useCallback(async () => {
    if (result.code) {
      await navigator.clipboard.writeText(result.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [result.code]);

  const handleSample = useCallback(() => {
    setInput(SAMPLE_TS);
  }, []);

  return (
    <div>
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <button
          class="btn-secondary text-body-sm"
          style="height: 36px"
          onClick={handleSample}
        >
          Load Sample
        </button>

        {result.removedCount > 0 && (
          <span class="badge badge-yellow">
            {result.removedCount} type annotation
            {result.removedCount !== 1 ? "s" : ""} removed
          </span>
        )}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label class="text-caption-uppercase text-muted block mb-2">
            Input TypeScript
          </label>
          <textarea
            class="textarea"
            style="min-height: 400px; font-family: var(--font-mono); font-size: 13px"
            placeholder="Paste your TypeScript here..."
            value={input}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          />
        </div>
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-caption-uppercase text-muted">
              Output JavaScript
            </label>
            {result.code && (
              <button
                class="text-body-sm text-primary hover:text-primary-active transition-colors"
                onClick={handleCopy}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          <textarea
            class="textarea"
            style="min-height: 400px; font-family: var(--font-mono); font-size: 13px"
            value={result.code}
            readOnly
            placeholder="JavaScript output will appear here..."
          />
        </div>
      </div>
    </div>
  );
}
