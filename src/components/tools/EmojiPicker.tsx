import { useState, useMemo, useCallback } from "preact/hooks";

interface EmojiEntry {
  emoji: string;
  name: string;
}

interface Category {
  id: string;
  label: string;
  icon: string;
  emojis: EmojiEntry[];
}

const CATEGORIES: Category[] = [
  {
    id: "smileys",
    label: "Smileys & People",
    icon: "😀",
    emojis: [
      { emoji: "😀", name: "grinning face" },
      { emoji: "😁", name: "beaming face with smiling eyes" },
      { emoji: "😂", name: "face with tears of joy" },
      { emoji: "🤣", name: "rolling on the floor laughing" },
      { emoji: "😃", name: "grinning face with big eyes" },
      { emoji: "😄", name: "grinning face with smiling eyes" },
      { emoji: "😅", name: "grinning face with sweat" },
      { emoji: "😆", name: "grinning squinting face" },
      { emoji: "😉", name: "winking face" },
      { emoji: "😊", name: "smiling face with smiling eyes" },
      { emoji: "😋", name: "face savoring food" },
      { emoji: "😎", name: "smiling face with sunglasses" },
      { emoji: "🥰", name: "smiling face with hearts" },
      { emoji: "😍", name: "smiling face with heart-eyes" },
      { emoji: "🥲", name: "smiling face with tear" },
      { emoji: "😏", name: "smirking face" },
      { emoji: "🤔", name: "thinking face" },
      { emoji: "😳", name: "flushed face" },
      { emoji: "🥺", name: "pleading face" },
      { emoji: "😭", name: "loudly crying face" },
      { emoji: "😤", name: "face with steam from nose" },
      { emoji: "🤬", name: "face with symbols on mouth" },
      { emoji: "😱", name: "face screaming in fear" },
      { emoji: "🤗", name: "hugging face" },
      { emoji: "🤭", name: "face with hand over mouth" },
      { emoji: "😈", name: "smiling face with horns" },
      { emoji: "😴", name: "sleeping face" },
      { emoji: "🤮", name: "face vomiting" },
      { emoji: "🤡", name: "clown face" },
      { emoji: "💀", name: "skull" },
    ],
  },
  {
    id: "people",
    label: "People & Body",
    icon: "👋",
    emojis: [
      { emoji: "👋", name: "waving hand" },
      { emoji: "🤚", name: "raised back of hand" },
      { emoji: "🖐", name: "hand with fingers splayed" },
      { emoji: "✋", name: "raised hand" },
      { emoji: "🖖", name: "vulcan salute" },
      { emoji: "👌", name: "OK hand" },
      { emoji: "🤌", name: "pinched fingers" },
      { emoji: "🤏", name: "pinching hand" },
      { emoji: "✌️", name: "victory hand" },
      { emoji: "🤞", name: "crossed fingers" },
      { emoji: "🫰", name: "hand with index finger and thumb crossed" },
      { emoji: "🤟", name: "love-you gesture" },
      { emoji: "🤘", name: "sign of the horns" },
      { emoji: "🤙", name: "call me hand" },
      { emoji: "👈", name: "backhand index pointing left" },
      { emoji: "👉", name: "backhand index pointing right" },
      { emoji: "👆", name: "backhand index pointing up" },
      { emoji: "🖕", name: "middle finger" },
      { emoji: "👇", name: "backhand index pointing down" },
      { emoji: "☝️", name: "index pointing up" },
      { emoji: "👍", name: "thumbs up" },
      { emoji: "👎", name: "thumbs down" },
      { emoji: "✊", name: "raised fist" },
      { emoji: "👊", name: "oncoming fist" },
      { emoji: "🤛", name: "left-facing fist" },
      { emoji: "🤜", name: "right-facing fist" },
      { emoji: "👏", name: "clapping hands" },
      { emoji: "🙌", name: "raising hands" },
      { emoji: "🫶", name: "heart hands" },
      { emoji: "🤲", name: "palms up together" },
      { emoji: "🤝", name: "handshake" },
      { emoji: "🙏", name: "folded hands" },
    ],
  },
  {
    id: "animals",
    label: "Animals & Nature",
    icon: "🐶",
    emojis: [
      { emoji: "🐶", name: "dog face" },
      { emoji: "🐱", name: "cat face" },
      { emoji: "🐭", name: "mouse face" },
      { emoji: "🐹", name: "hamster" },
      { emoji: "🐰", name: "rabbit face" },
      { emoji: "🦊", name: "fox" },
      { emoji: "🐻", name: "bear" },
      { emoji: "🐼", name: "panda" },
      { emoji: "🐨", name: "koala" },
      { emoji: "🐯", name: "tiger face" },
      { emoji: "🦁", name: "lion" },
      { emoji: "🐮", name: "cow face" },
      { emoji: "🐷", name: "pig face" },
      { emoji: "🐸", name: "frog" },
      { emoji: "🐵", name: "monkey face" },
      { emoji: "🐔", name: "chicken" },
      { emoji: "🐧", name: "penguin" },
      { emoji: "🐦", name: "bird" },
      { emoji: "🦅", name: "eagle" },
      { emoji: "🦆", name: "duck" },
      { emoji: "🦉", name: "owl" },
      { emoji: "🦇", name: "bat" },
      { emoji: "🐺", name: "wolf" },
      { emoji: "🐴", name: "horse face" },
      { emoji: "🦄", name: "unicorn" },
      { emoji: "🐝", name: "honeybee" },
      { emoji: "🪱", name: "worm" },
      { emoji: "🐛", name: "bug" },
      { emoji: "🦋", name: "butterfly" },
      { emoji: "🐌", name: "snail" },
      { emoji: "🐞", name: "lady beetle" },
    ],
  },
  {
    id: "food",
    label: "Food & Drink",
    icon: "🍕",
    emojis: [
      { emoji: "🍏", name: "green apple" },
      { emoji: "🍎", name: "red apple" },
      { emoji: "🍐", name: "pear" },
      { emoji: "🍊", name: "tangerine" },
      { emoji: "🍋", name: "lemon" },
      { emoji: "🍌", name: "banana" },
      { emoji: "🍉", name: "watermelon" },
      { emoji: "🍇", name: "grapes" },
      { emoji: "🍓", name: "strawberry" },
      { emoji: "🍈", name: "melon" },
      { emoji: "🍒", name: "cherries" },
      { emoji: "🍑", name: "peach" },
      { emoji: "🥭", name: "mango" },
      { emoji: "🍍", name: "pineapple" },
      { emoji: "🥥", name: "coconut" },
      { emoji: "🥝", name: "kiwi fruit" },
      { emoji: "🍅", name: "tomato" },
      { emoji: "🍆", name: "eggplant" },
      { emoji: "🥑", name: "avocado" },
      { emoji: "🥦", name: "broccoli" },
      { emoji: "🌽", name: "ear of corn" },
      { emoji: "🥕", name: "carrot" },
      { emoji: "🧄", name: "garlic" },
      { emoji: "🧅", name: "onion" },
      { emoji: "🥔", name: "potato" },
      { emoji: "🍟", name: "french fries" },
      { emoji: "🍕", name: "pizza" },
      { emoji: "🌭", name: "hot dog" },
      { emoji: "🥪", name: "sandwich" },
      { emoji: "🌮", name: "taco" },
      { emoji: "🌯", name: "burrito" },
    ],
  },
  {
    id: "activities",
    label: "Activities",
    icon: "⚽",
    emojis: [
      { emoji: "⚽", name: "soccer ball" },
      { emoji: "🏀", name: "basketball" },
      { emoji: "🏈", name: "american football" },
      { emoji: "⚾", name: "baseball" },
      { emoji: "🥎", name: "softball" },
      { emoji: "🎾", name: "tennis" },
      { emoji: "🏐", name: "volleyball" },
      { emoji: "🏉", name: "rugby football" },
      { emoji: "🥏", name: "flying disc" },
      { emoji: "🎱", name: "pool 8 ball" },
      { emoji: "🪀", name: "yo-yo" },
      { emoji: "🏓", name: "ping pong" },
      { emoji: "🏸", name: "badminton" },
      { emoji: "🥅", name: "goal net" },
      { emoji: "⛳", name: "flag in hole" },
      { emoji: "🪁", name: "kite" },
      { emoji: "🏹", name: "bow and arrow" },
      { emoji: "🎣", name: "fishing pole" },
      { emoji: "🤿", name: "diving mask" },
      { emoji: "🥊", name: "boxing glove" },
      { emoji: "🥋", name: "martial arts uniform" },
      { emoji: "🎽", name: "running shirt" },
      { emoji: "🛹", name: "skateboard" },
      { emoji: "🛼", name: "roller skate" },
      { emoji: "🥌", name: "curling stone" },
      { emoji: "⛸", name: "ice skate" },
      { emoji: "🎿", name: "skis" },
      { emoji: "🛷", name: "sled" },
      { emoji: "🎯", name: "bullseye" },
      { emoji: "🎮", name: "video game" },
    ],
  },
  {
    id: "travel",
    label: "Travel & Places",
    icon: "✈️",
    emojis: [
      { emoji: "🚗", name: "automobile" },
      { emoji: "🚕", name: "taxi" },
      { emoji: "🚙", name: "sport utility vehicle" },
      { emoji: "🚌", name: "bus" },
      { emoji: "🚎", name: "trolleybus" },
      { emoji: "🏎", name: "racing car" },
      { emoji: "🚓", name: "police car" },
      { emoji: "🚑", name: "ambulance" },
      { emoji: "🚒", name: "fire engine" },
      { emoji: "🚐", name: "minibus" },
      { emoji: "🚚", name: "delivery truck" },
      { emoji: "🚛", name: "articulated lorry" },
      { emoji: "🚜", name: "tractor" },
      { emoji: "🛴", name: "kick scooter" },
      { emoji: "🚲", name: "bicycle" },
      { emoji: "🛵", name: "motor scooter" },
      { emoji: "🏍", name: "motorcycle" },
      { emoji: "🛺", name: "auto rickshaw" },
      { emoji: "🚨", name: "police car light" },
      { emoji: "🚔", name: "oncoming police car" },
      { emoji: "🚍", name: "oncoming bus" },
      { emoji: "🚘", name: "oncoming automobile" },
      { emoji: "🚖", name: "oncoming taxi" },
      { emoji: "🚡", name: "aerial tramway" },
      { emoji: "🚠", name: "mountain cableway" },
      { emoji: "🚟", name: "suspension railway" },
      { emoji: "🚃", name: "railway car" },
      { emoji: "🚋", name: "tram car" },
      { emoji: "✈️", name: "airplane" },
      { emoji: "🚀", name: "rocket" },
    ],
  },
  {
    id: "objects",
    label: "Objects",
    icon: "💡",
    emojis: [
      { emoji: "⌚", name: "watch" },
      { emoji: "📱", name: "mobile phone" },
      { emoji: "📲", name: "mobile phone with arrow" },
      { emoji: "💻", name: "laptop" },
      { emoji: "⌨️", name: "keyboard" },
      { emoji: "🖥", name: "desktop computer" },
      { emoji: "🖨", name: "printer" },
      { emoji: "🖱", name: "computer mouse" },
      { emoji: "🖲", name: "trackball" },
      { emoji: "🕹", name: "joystick" },
      { emoji: "💾", name: "floppy disk" },
      { emoji: "💿", name: "optical disk" },
      { emoji: "📀", name: "dvd" },
      { emoji: "📷", name: "camera" },
      { emoji: "📸", name: "camera with flash" },
      { emoji: "📹", name: "video camera" },
      { emoji: "🎥", name: "movie camera" },
      { emoji: "📞", name: "telephone receiver" },
      { emoji: "☎️", name: "telephone" },
      { emoji: "📺", name: "television" },
      { emoji: "📻", name: "radio" },
      { emoji: "🎙", name: "studio microphone" },
      { emoji: "💡", name: "light bulb" },
      { emoji: "🔦", name: "flashlight" },
      { emoji: "📚", name: "books" },
      { emoji: "📝", name: "memo" },
      { emoji: "✏️", name: "pencil" },
      { emoji: "📌", name: "pushpin" },
      { emoji: "📎", name: "paperclip" },
      { emoji: "🔑", name: "key" },
    ],
  },
  {
    id: "symbols",
    label: "Symbols",
    icon: "❤️",
    emojis: [
      { emoji: "❤️", name: "red heart" },
      { emoji: "🧡", name: "orange heart" },
      { emoji: "💛", name: "yellow heart" },
      { emoji: "💚", name: "green heart" },
      { emoji: "💙", name: "blue heart" },
      { emoji: "💜", name: "purple heart" },
      { emoji: "🖤", name: "black heart" },
      { emoji: "🤍", name: "white heart" },
      { emoji: "💯", name: "hundred points" },
      { emoji: "💢", name: "anger symbol" },
      { emoji: "💫", name: "dizzy" },
      { emoji: "💥", name: "collision" },
      { emoji: "💤", name: "zzz" },
      { emoji: "💨", name: "dashing away" },
      { emoji: "🕳", name: "hole" },
      { emoji: "🎫", name: "ticket" },
      { emoji: "🎰", name: "slot machine" },
      { emoji: "🔢", name: "input numbers" },
      { emoji: "🔤", name: "input latin letters" },
      { emoji: "🔣", name: "input symbols" },
      { emoji: "🔠", name: "input latin uppercase" },
      { emoji: "🔡", name: "input latin lowercase" },
      { emoji: "🔒", name: "locked" },
      { emoji: "🔓", name: "unlocked" },
      { emoji: "🔍", name: "magnifying glass tilted left" },
      { emoji: "🔎", name: "magnifying glass tilted right" },
      { emoji: "♻️", name: "recycling symbol" },
      { emoji: "✅", name: "check mark button" },
      { emoji: "❌", name: "cross mark" },
      { emoji: "⚠️", name: "warning" },
    ],
  },
  {
    id: "flags",
    label: "Flags",
    icon: "🏳️",
    emojis: [
      { emoji: "🏳️", name: "white flag" },
      { emoji: "🏴", name: "black flag" },
      { emoji: "🏁", name: "chequered flag" },
      { emoji: "🚩", name: "triangular flag" },
      { emoji: "🏴‍☠️", name: "pirate flag" },
      { emoji: "🇺🇸", name: "flag United States" },
      { emoji: "🇬🇧", name: "flag United Kingdom" },
      { emoji: "🇫🇷", name: "flag France" },
      { emoji: "🇩🇪", name: "flag Germany" },
      { emoji: "🇯🇵", name: "flag Japan" },
      { emoji: "🇨🇳", name: "flag China" },
      { emoji: "🇰🇷", name: "flag South Korea" },
      { emoji: "🇮🇳", name: "flag India" },
      { emoji: "🇧🇷", name: "flag Brazil" },
      { emoji: "🇨🇦", name: "flag Canada" },
      { emoji: "🇦🇺", name: "flag Australia" },
      { emoji: "🇷🇺", name: "flag Russia" },
      { emoji: "🇮🇹", name: "flag Italy" },
      { emoji: "🇪🇸", name: "flag Spain" },
      { emoji: "🇲🇽", name: "flag Mexico" },
      { emoji: "🇸🇪", name: "flag Sweden" },
      { emoji: "🇳🇴", name: "flag Norway" },
      { emoji: "🇳🇱", name: "flag Netherlands" },
      { emoji: "🇨🇭", name: "flag Switzerland" },
    ],
  },
];

const MAX_RECENT = 20;

export default function EmojiPicker() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [recent, setRecent] = useState<string[]>([]);
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);
  const [copiedEmoji, setCopiedEmoji] = useState<string | null>(null);

  const allEmojis = useMemo(
    () => CATEGORIES.flatMap((cat) => cat.emojis),
    []
  );

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return allEmojis.filter((e) => e.name.includes(q));
  }, [search, allEmojis]);

  const handleEmojiClick = useCallback(async (emoji: string) => {
    await navigator.clipboard.writeText(emoji);
    setCopiedEmoji(emoji);
    setTimeout(() => setCopiedEmoji(null), 1200);

    setRecent((prev) => {
      const filtered = prev.filter((e) => e !== emoji);
      return [emoji, ...filtered].slice(0, MAX_RECENT);
    });
  }, []);

  const displayCategory = useMemo(() => {
    if (filteredEmojis) return null;
    return CATEGORIES.find((c) => c.id === activeCategory);
  }, [activeCategory, filteredEmojis]);

  return (
    <div>
      {/* Search */}
      <div class="mb-4">
        <input
          class="input"
          type="text"
          placeholder="Search emojis by name (e.g. heart, cat, flag)..."
          value={search}
          onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
          style="width: 100%"
        />
      </div>

      {/* Category tabs */}
      {!search.trim() && (
        <div class="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              class={activeCategory === cat.id ? "btn-primary" : "btn-secondary"}
              style="padding: 6px 14px; font-size: 13px"
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Recently Used */}
      {!search.trim() && recent.length > 0 && (
        <div class="mb-4">
          <div class="text-caption-uppercase text-muted mb-2">Recently Used</div>
          <div class="bg-surface-elevated rounded-lg p-3">
            <div class="flex flex-wrap gap-1">
              {recent.map((emoji) => (
                <button
                  key={`recent-${emoji}`}
                  class="badge"
                  style="font-size: 1.4rem; cursor: pointer; padding: 4px 6px; min-width: 36px; text-align: center; background: transparent; border: 1px solid var(--border-color, #e5e7eb); border-radius: 8px"
                  title={`Click to copy ${emoji}`}
                  onClick={() => handleEmojiClick(emoji)}
                  onMouseEnter={() => setHoveredEmoji(emoji)}
                  onMouseLeave={() => setHoveredEmoji(null)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search results or category emojis */}
      <div class="mb-2">
        <div class="text-caption-uppercase text-muted mb-2">
          {search.trim()
            ? `Search Results (${filteredEmojis?.length ?? 0})`
            : displayCategory?.label ?? ""}
        </div>
        <div class="bg-surface-elevated rounded-lg p-3">
          <div
            class="flex flex-wrap gap-1"
            style="max-height: 320px; overflow-y: auto"
          >
            {(search.trim() ? filteredEmojis : displayCategory?.emojis)?.map((entry) => (
              <button
                key={`${entry.emoji}-${entry.name}`}
                style="font-size: 1.6rem; cursor: pointer; padding: 6px 8px; min-width: 44px; text-align: center; background: transparent; border: 1px solid transparent; border-radius: 8px; transition: all 0.15s; position: relative"
                title={entry.name}
                onClick={() => handleEmojiClick(entry.emoji)}
                onMouseEnter={(e) => {
                  setHoveredEmoji(entry.emoji);
                  (e.target as HTMLElement).style.borderColor = "var(--border-color, #e5e7eb)";
                  (e.target as HTMLElement).style.backgroundColor = "var(--color-hover, rgba(0,0,0,0.04))";
                }}
                onMouseLeave={(e) => {
                  setHoveredEmoji(null);
                  (e.target as HTMLElement).style.borderColor = "transparent";
                  (e.target as HTMLElement).style.backgroundColor = "transparent";
                }}
              >
                {entry.emoji}
              </button>
            ))}
            {(search.trim() ? filteredEmojis : displayCategory?.emojis)?.length === 0 && (
              <div class="text-caption-uppercase text-muted" style="padding: 1rem; width: 100%; text-align: center">
                No emojis found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredEmoji && (
        <div
          class="bg-surface-elevated rounded-lg p-3 flex items-center gap-3"
          style="position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 1000; box-shadow: 0 4px 24px rgba(0,0,0,0.15); pointer-events: none"
        >
          <span style="font-size: 2rem">{hoveredEmoji}</span>
          <span class="text-primary" style="font-size: 14px">
            {allEmojis.find((e) => e.emoji === hoveredEmoji)?.name ?? ""}
          </span>
        </div>
      )}

      {/* Copied feedback */}
      {copiedEmoji && (
        <div
          class="bg-surface-elevated rounded-lg p-3 text-center"
          style="position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); z-index: 1000; box-shadow: 0 4px 24px rgba(0,0,0,0.15)"
        >
          <span class="text-primary" style="font-size: 14px">
            ✓ Copied {copiedEmoji} to clipboard
          </span>
        </div>
      )}
    </div>
  );
}
