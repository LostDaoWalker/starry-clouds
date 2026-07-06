import { ICONS, type IconKey } from "../lib/icons";

type GameIconProps = {
  name: IconKey;
  size?: "sm" | "md" | "lg";
  alt?: string;
};

export function GameIcon({ name, size = "md", alt = "" }: GameIconProps) {
  return (
    <img
      className={`game-icon game-icon-${size}`}
      src={ICONS[name]}
      alt={alt}
      draggable={false}
    />
  );
}
