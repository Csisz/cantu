import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { AuthUserDTO } from "@/lib/auth/types";
import type { LearningExperienceSnapshot } from "@/lib/data/learning-experience";
import styles from "../app.module.css";
import { LearningPlayer } from "./LearningPlayer";

export function LearningSessionShell({ user, experience }: {
  user: AuthUserDTO;
  experience: LearningExperienceSnapshot;
}) {
  return (
    <main className={styles.appPage}>
      <header className={styles.appHeader}>
        <Link className={styles.brand} href="/" aria-label="Vissza a Cantu kezdőlapjára"><span aria-hidden="true" />Cantu</Link>
        <div className={styles.headerMeta}><span>{user.displayName ?? user.email}</span><ThemeToggle /></div>
      </header>
      <div className={styles.appBackdrop} aria-hidden="true" />
      <section className={styles.learningRouteMain} aria-labelledby="saved-learning-title">
        <div className={styles.savedLearningHeading}>
          <span className={styles.kicker}>Saját tanulásom</span>
          <h1 id="saved-learning-title">Folytasd ott, ahol abbahagytad.</h1>
          <p>A privát, származtatott tanulási eredményhez nincs szükség a teljes eredeti forrásra.</p>
        </div>
        <LearningPlayer
          sessionId={experience.sessionId}
          analysis={experience.analysis}
          initialProgress={experience.progress}
          initialSavedChunkIndices={experience.savedChunkIndices}
        />
        <Link className={styles.backToStudio} href="/app#library-title">← Vissza a Saját tanulásaimhoz</Link>
      </section>
    </main>
  );
}
