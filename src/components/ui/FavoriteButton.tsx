import { useCallback, useEffect, useState } from "preact/hooks";

interface Props {
	toolId: string;
}

export default function FavoriteButton({ toolId }: Props) {
	const [favorited, setFavorited] = useState(false);

	useEffect(() => {
		// Read initial state from localStorage
		try {
			const favorites: string[] = JSON.parse(localStorage.getItem("toolbundle_favorites") || "[]");
			setFavorited(favorites.includes(toolId));
		} catch {}
	}, [toolId]);

	const handleToggle = useCallback(() => {
		try {
			const favorites: string[] = JSON.parse(localStorage.getItem("toolbundle_favorites") || "[]");
			const index = favorites.indexOf(toolId);
			if (index >= 0) {
				favorites.splice(index, 1);
				setFavorited(false);
			} else {
				favorites.push(toolId);
				setFavorited(true);
			}
			localStorage.setItem("toolbundle_favorites", JSON.stringify(favorites));
		} catch {}
	}, [toolId]);

	return (
		<button
			onClick={handleToggle}
			style={`display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 6px; border: 1px solid ${favorited ? "#faff69" : "#2a2a2a"}; background: ${favorited ? "#faff6915" : "transparent"}; color: ${favorited ? "#faff69" : "#888888"}; font-size: 13px; cursor: pointer; transition: all 0.15s ease;`}
			aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
			aria-pressed={favorited}
		>
			<svg
				width="16"
				height="16"
				aria-hidden="true"
				viewBox="0 0 24 24"
				fill={favorited ? "currentColor" : "none"}
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
			</svg>
			{favorited ? "Favorited" : "Favorite"}
		</button>
	);
}
