import { useCallback, useEffect, useState } from "preact/hooks";

interface Tool {
	id: string;
	name: string;
	description: string;
	category: string;
	slug: string;
}

interface Category {
	id: string;
	name: string;
	color: string;
}

interface Props {
	tool: Tool;
	category?: Category;
}

export default function ToolCardWithFavorite({ tool, category }: Props) {
	const [favorited, setFavorited] = useState(false);

	useEffect(() => {
		try {
			const favorites: string[] = JSON.parse(localStorage.getItem("toolbundle_favorites") || "[]");
			setFavorited(favorites.includes(tool.id));
		} catch {}
	}, [tool.id]);

	const handleFavorite = useCallback(
		(e: Event) => {
			e.preventDefault();
			e.stopPropagation();
			try {
				const favorites: string[] = JSON.parse(
					localStorage.getItem("toolbundle_favorites") || "[]",
				);
				const index = favorites.indexOf(tool.id);
				if (index >= 0) {
					favorites.splice(index, 1);
					setFavorited(false);
				} else {
					favorites.push(tool.id);
					setFavorited(true);
				}
				localStorage.setItem("toolbundle_favorites", JSON.stringify(favorites));
			} catch {}
		},
		[tool.id],
	);

	const href = `/${tool.category}/${tool.slug}`;
	const catColor = category?.color || "#888";

	return (
		<a
			href={href}
			style="display: block; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 20px; text-decoration: none; transition: all 0.2s ease; position: relative;"
			class="group"
		>
			{/* Favorite button */}
			<button
				onClick={handleFavorite}
				style={`position: absolute; top: 12px; right: 12px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; border: none; background: ${favorited ? "#faff6920" : "transparent"}; color: ${favorited ? "#faff69" : "#5a5a5a"}; cursor: pointer; transition: all 0.15s ease;`}
				title={favorited ? "Remove from favorites" : "Add to favorites"}
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill={favorited ? "currentColor" : "none"}
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
				</svg>
			</button>

			<div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px;">
				<div
					style={`width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: ${catColor}15; color: ${catColor};`}
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="3" y="3" width="18" height="18" rx="2" />
						<circle cx="8.5" cy="8.5" r="1.5" />
						<path d="m21 15-5-5L5 21" />
					</svg>
				</div>
				<span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #5a5a5a;">
					{category?.name?.replace(" Tools", "") || ""}
				</span>
			</div>

			<h3 style="font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 6px;">
				{tool.name}
			</h3>
			<p style="font-size: 14px; color: #888888; line-height: 1.5; margin: 0;">
				{tool.description}
			</p>
		</a>
	);
}
