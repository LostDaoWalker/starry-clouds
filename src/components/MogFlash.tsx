import { useState } from "react";
import type { MogVerdict } from "../game";
import { moggedSplashUrl } from "../lib/scenes";

type MogFlashState = {
  verdict: MogVerdict;
  delta: number;
};

export function useMogFlash() {
  const [flash, setFlash] = useState<MogFlashState | null>(null);

  const trigger = (verdict: MogVerdict, delta: number) => {
    if (verdict !== "MOGGED") return;
    setFlash({ verdict, delta });
    window.setTimeout(() => setFlash(null), 1200);
  };

  return { flash, trigger };
}

export function MogFlash({ flash }: { flash: MogFlashState | null }) {
  if (!flash) return null;

  return (
    <div className="mog-flash" aria-hidden>
      <img className="mog-splash" src={moggedSplashUrl} alt="" draggable={false} />
      <span className="mog-delta">+{flash.delta} MOG</span>
    </div>
  );
}

export function ActionSceneVignette({ sceneUrl }: { sceneUrl: string | null }) {
  if (!sceneUrl) return null;
  return (
    <div className="action-scene-vignette" aria-hidden>
      <div className="action-scene-bg" style={{ backgroundImage: `url(${sceneUrl})` }} />
    </div>
  );
}

export function useActionScene() {
  const [sceneUrl, setSceneUrl] = useState<string | null>(null);

  const show = (url: string) => {
    setSceneUrl(url);
    window.setTimeout(() => setSceneUrl(null), 1400);
  };

  return { sceneUrl, show };
}
