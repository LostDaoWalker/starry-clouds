import { useEffect, useState } from "react";
import type { PlayerClass } from "../game";

const FRAME_COUNT = 16;
const MS_PER_FRAME = 125;

type SpriteActorProps = {
  playerClass: PlayerClass;
  facing?: "left" | "right";
  variant?: "walk" | "portrait";
};

export function SpriteActor({
  playerClass,
  facing = "right",
  variant = "walk",
}: SpriteActorProps) {
  const [frame, setFrame] = useState(0);
  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    if (variant !== "walk") return;
    const id = window.setInterval(() => {
      setFrame((f) => (f + 1) % FRAME_COUNT);
    }, MS_PER_FRAME);
    return () => window.clearInterval(id);
  }, [variant]);

  const src =
    variant === "portrait"
      ? `${base}sprites/${playerClass}.png`
      : `${base}sprites/walk/${playerClass}/frame-${String(frame).padStart(2, "0")}.png`;

  return (
    <img
      className={`sprite-actor sprite-${facing} sprite-${variant}`}
      src={src}
      alt=""
      draggable={false}
    />
  );
}
