"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ROBOT_COACH_ASSETS,
  ROBOT_COACH_COPY,
  type RobotCoachState,
} from "@/lib/learning/robot-coach";
import styles from "../app.module.css";

export function RobotCoach({ state, message }: { state: RobotCoachState; message?: string }) {
  const asset = ROBOT_COACH_ASSETS[state];
  const [reducedMotion, setReducedMotion] = useState(true);
  const [failedState, setFailedState] = useState<RobotCoachState | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  const showVideo = Boolean(asset.animatedSrc) && !reducedMotion && failedState !== state;
  return (
    <aside className={styles.robotCoach} data-state={state} aria-label="Cantu robot útmutatása">
      <div className={styles.robotCoachImage} aria-hidden="true">
        {showVideo ? (
          <video
            key={asset.animatedSrc}
            className={styles.robotCoachVideo}
            src={asset.animatedSrc!}
            poster={asset.staticSrc}
            autoPlay
            muted
            playsInline
            loop={asset.loop}
            preload="metadata"
            onError={() => setFailedState(state)}
          />
        ) : <Image src={asset.staticSrc} alt="" fill sizes="96px" />}
      </div>
      <p>{message ?? ROBOT_COACH_COPY[state]}</p>
    </aside>
  );
}
