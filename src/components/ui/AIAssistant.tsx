import { useState, useCallback, useRef, useEffect } from "preact/hooks";
import { generateResponse, getQuickActions } from "../../utils/ai-assistant";

interface Message {
	role: "user" | "assistant";
	content: string;
}

export default function AIAssistant() {
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const [showBubble, setShowBubble] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const quickActions = getQuickActions();

	const bubbleTexts = [
		"Ask me anything! 💬",
		"Need help finding a tool? 🔍",
		"Try: 'convert PNG to JPG' 📸",
		"Try: 'generate a password' 🔐",
		"I can help! Just ask ✨",
		"What tool do you need? 🛠️",
	];

	const [bubbleText, setBubbleText] = useState(bubbleTexts[0]);

	// Periodically show speech bubble when chat is closed
	useEffect(() => {
		if (isOpen) {
			setShowBubble(false);
			return;
		}

		// Show bubble every 45 seconds, dismiss after 5 seconds
		const showBubbleOnce = () => {
			const randomText = bubbleTexts[Math.floor(Math.random() * bubbleTexts.length)];
			setBubbleText(randomText);
			setShowBubble(true);
			setTimeout(() => setShowBubble(false), 5000);
		};

		// First show after 8 seconds
		const initialTimer = setTimeout(showBubbleOnce, 8000);
		// Then every 45 seconds
		const interval = setInterval(showBubbleOnce, 45000);

		return () => {
			clearTimeout(initialTimer);
			clearInterval(interval);
		};
	}, [isOpen]);

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [messages, scrollToBottom]);

	useEffect(() => {
		if (isOpen) {
			setTimeout(() => inputRef.current?.focus(), 100);
		}
	}, [isOpen]);

	// Welcome message on first open
	useEffect(() => {
		if (isOpen && messages.length === 0) {
			setMessages([
				{
					role: "assistant",
					content:
						"Hi! 👋 I'm your ToolBundle assistant. Ask me anything — I'll help you find the right tool!",
				},
			]);
		}
	}, [isOpen, messages.length]);

	const handleSend = useCallback(() => {
		const q = input.trim();
		if (!q || isTyping) return;

		setMessages((prev) => [...prev, { role: "user", content: q }]);
		setInput("");
		setIsTyping(true);

		// Simulate typing delay for better UX
		setTimeout(
			() => {
				const response = generateResponse(q);
				setMessages((prev) => [...prev, { role: "assistant", content: response }]);
				setIsTyping(false);
			},
			300 + Math.random() * 400,
		);
	}, [input, isTyping]);

	const handleQuickAction = useCallback((query: string) => {
		setMessages((prev) => [...prev, { role: "user", content: query }]);
		setIsTyping(true);

		setTimeout(
			() => {
				const response = generateResponse(query);
				setMessages((prev) => [...prev, { role: "assistant", content: response }]);
				setIsTyping(false);
			},
			300 + Math.random() * 400,
		);
	}, []);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSend();
			}
			if (e.key === "Escape") {
				setIsOpen(false);
			}
		},
		[handleSend],
	);

	const handleClear = useCallback(() => {
		setMessages([]);
	}, []);

	// Simple markdown-like rendering for links and bold
	function renderContent(content: string) {
		const parts: string[] = [];
		const remaining = content;

		// Split by newlines first
		const lines = remaining.split("\n");
		const elements: any[] = [];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			if (line.trim() === "") {
				elements.push(<div style="height: 8px;" />);
				continue;
			}

			// Process inline formatting
			const processed = processInline(line);
			elements.push(<p style="margin: 0 0 4px 0;">{processed}</p>);
		}

		return elements;
	}

	function processInline(text: string): any[] {
		const parts: any[] = [];
		let remaining = text;
		let key = 0;

		while (remaining.length > 0) {
			// Bold: **text**
			const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
			// Link: [text](url)
			const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/);

			let nextMatch: {
				type: string;
				index: number;
				full: string;
				groups: string[];
			} | null = null;

			if (boldMatch && boldMatch.index !== undefined) {
				nextMatch = {
					type: "bold",
					index: boldMatch.index,
					full: boldMatch[0],
					groups: [boldMatch[1]],
				};
			}
			if (linkMatch && linkMatch.index !== undefined) {
				if (!nextMatch || linkMatch.index < nextMatch.index) {
					nextMatch = {
						type: "link",
						index: linkMatch.index,
						full: linkMatch[0],
						groups: [linkMatch[1], linkMatch[2]],
					};
				}
			}

			if (!nextMatch) {
				parts.push(remaining);
				break;
			}

			// Text before match
			if (nextMatch.index > 0) {
				parts.push(remaining.slice(0, nextMatch.index));
			}

			if (nextMatch.type === "bold") {
				parts.push(
					<strong key={key++} style="color: var(--color-ink); font-weight: 600;">
						{nextMatch.groups[0]}
					</strong>,
				);
			} else if (nextMatch.type === "link") {
				const href = nextMatch.groups[1];
				const isInternal = href.startsWith("/");
				parts.push(
					<a
						key={key++}
						href={href}
						style="color: var(--color-primary); text-decoration: underline; text-underline-offset: 2px;"
						{...(isInternal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
					>
						{nextMatch.groups[0]}
					</a>,
				);
			}

			remaining = remaining.slice(nextMatch.index + nextMatch.full.length);
		}

		return parts;
	}

	return (
		<>
			{/* Floating Button */}
			<button
				id="ai-assistant-toggle"
				onClick={() => setIsOpen(!isOpen)}
				aria-label="AI Assistant"
				style="position: fixed; bottom: 24px; right: 24px; z-index: 80; width: 56px; height: 56px; border-radius: 9999px; background: var(--color-primary); color: var(--color-on-primary); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(230, 0, 35, 0.3); transition: transform 0.2s ease, box-shadow 0.2s ease;"
			>
				{isOpen ? (
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				) : (
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
					</svg>
				)}

				{/* Dynamic speech bubble */}
				{showBubble && !isOpen && (
					<div style="position: absolute; bottom: 64px; right: 0; white-space: nowrap; padding: 10px 16px; background: var(--color-surface-card); border: 1px solid var(--color-hairline); border-radius: 20px 20px 4px 20px; font-size: 13px; color: var(--color-body); box-shadow: 0 4px 16px rgba(0,0,0,0.1); animation: bubble-pop 0.3s ease-out; pointer-events: none;">
						{bubbleText}
					</div>
				)}
			</button>

			{/* Chat Modal */}
			{isOpen && (
				<div
					style="position: fixed; bottom: 96px; right: 24px; z-index: 80; width: 400px; max-width: calc(100vw - 48px); max-height: 600px; display: flex; flex-direction: column; background: var(--color-canvas); border: 1px solid var(--color-hairline); border-radius: 32px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); overflow: hidden;"
					role="dialog"
					aria-modal="true"
					aria-label="AI Assistant"
				>
					{/* Header */}
					<div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--color-hairline);">
						<div style="display: flex; align-items: center; gap: 10px;">
							<div style="width: 32px; height: 32px; border-radius: 9999px; background: var(--color-primary); display: flex; align-items: center; justify-content: center;">
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="white"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
								</svg>
							</div>
							<div>
								<div style="font-size: 14px; font-weight: 600; color: var(--color-ink);">
									AI Assistant
								</div>
								<div style="font-size: 12px; color: var(--color-mute);">
									Ask me anything about tools
								</div>
							</div>
						</div>
						<div style="display: flex; gap: 4px;">
							{messages.length > 1 && (
								<button
									onClick={handleClear}
									aria-label="Clear chat"
									style="padding: 6px; background: none; border: none; cursor: pointer; color: var(--color-mute); border-radius: 8px;"
								>
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<polyline points="3 6 5 6 21 6" />
										<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
									</svg>
								</button>
							)}
							<button
								onClick={() => setIsOpen(false)}
								aria-label="Close"
								style="padding: 6px; background: none; border: none; cursor: pointer; color: var(--color-mute); border-radius: 8px;"
							>
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<line x1="18" y1="6" x2="6" y2="18" />
									<line x1="6" y1="6" x2="18" y2="18" />
								</svg>
							</button>
						</div>
					</div>

					{/* Messages */}
					<div style="flex: 1; overflow-y: auto; padding: 16px; min-height: 300px; max-height: 400px;">
						{messages.map((msg, i) => (
							<div
								key={i}
								style={`display: flex; margin-bottom: 12px; ${msg.role === "user" ? "justify-content: flex-end;" : "justify-content: flex-start;"}`}
							>
								<div
									style={`max-width: 85%; padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.5; ${
										msg.role === "user"
											? "background: var(--color-primary); color: var(--color-on-primary); border-bottom-right-radius: 4px;"
											: "background: var(--color-surface-card); color: var(--color-body); border-bottom-left-radius: 4px;"
									}`}
								>
									{renderContent(msg.content)}
								</div>
							</div>
						))}

						{/* Typing indicator */}
						{isTyping && (
							<div style="display: flex; justify-content: flex-start; margin-bottom: 12px;">
								<div style="padding: 10px 14px; border-radius: 16px; border-bottom-left-radius: 4px; background: var(--color-surface-card); display: flex; gap: 4px; align-items: center;">
									<div style="width: 6px; height: 6px; border-radius: 9999px; background: var(--color-mute); animation: ai-bounce 1.4s infinite ease-in-out;" />
									<div style="width: 6px; height: 6px; border-radius: 9999px; background: var(--color-mute); animation: ai-bounce 1.4s infinite ease-in-out 0.2s;" />
									<div style="width: 6px; height: 6px; border-radius: 9999px; background: var(--color-mute); animation: ai-bounce 1.4s infinite ease-in-out 0.4s;" />
								</div>
							</div>
						)}

						{/* Quick actions (shown when no messages except welcome) */}
						{messages.length <= 1 && !isTyping && (
							<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
								{quickActions.map((action) => (
									<button
										key={action.query}
										onClick={() => handleQuickAction(action.query)}
										style="padding: 6px 12px; background: var(--color-surface-card); border: 1px solid var(--color-hairline); border-radius: 9999px; font-size: 12px; color: var(--color-body); cursor: pointer; white-space: nowrap;"
									>
										{action.label}
									</button>
								))}
							</div>
						)}

						<div ref={messagesEndRef} />
					</div>

					{/* Input */}
					<div style="display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--color-hairline); background: var(--color-surface-soft);">
						<input
							ref={inputRef}
							type="text"
							value={input}
							onInput={(e) => setInput((e.target as HTMLInputElement).value)}
							onKeyDown={(e) => handleKeyDown(e as any)}
							placeholder="Ask about any tool..."
							aria-label="Ask AI assistant"
							style="flex: 1; padding: 10px 14px; background: var(--color-canvas); border: 1px solid var(--color-ash); border-radius: 16px; font-size: 14px; color: var(--color-ink); outline: none;"
						/>
						<button
							onClick={handleSend}
							disabled={!input.trim() || isTyping}
							aria-label="Send message"
							style={`width: 40px; height: 40px; border-radius: 9999px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; background: ${input.trim() && !isTyping ? "var(--color-primary)" : "var(--color-surface-card)"}; color: ${input.trim() && !isTyping ? "var(--color-on-primary)" : "var(--color-mute)"};`}
						>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<line x1="22" y1="2" x2="11" y2="13" />
								<polygon points="22 2 15 22 11 13 2 9 22 2" />
							</svg>
						</button>
					</div>
				</div>
			)}

			{/* Typing animation keyframes */}
			<style>{`
        @keyframes ai-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes bubble-pop {
          0% { transform: scale(0.7) translateY(8px); opacity: 0; }
          60% { transform: scale(1.05) translateY(-2px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
		</>
	);
}
