import Image from "next/image";
import {
  ROBOT_COACH_ASSETS,
  ROBOT_COACH_COPY,
  type RobotCoachState,
} from "@/lib/learning/robot-coach";
import styles from "../app.module.css";

export function RobotCoach({ state, message }: { state: RobotCoachState; message?: string }) {
  const asset = ROBOT_COACH_ASSETS[state];
  return (
    <aside className={styles.robotCoach} data-state={state} aria-label="Cantu robot útmutatása">
      <div className={styles.robotCoachImage} aria-hidden="true">
        <Image src={asset.staticSrc} alt="" fill sizes="96px" />
      </div>
      <p>{message ?? ROBOT_COACH_COPY[state]}</p>
    </aside>
  );
}
