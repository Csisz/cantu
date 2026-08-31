import type { LearningAnalysis } from "@/lib/analysis/schema";
import styles from "../app.module.css";

export function GrammarCard({ analysis, onNext }: { analysis: LearningAnalysis; onNext: () => void }) {
  return (
    <section className={styles.lessonCard} aria-labelledby="lesson-grammar-title">
      <span className={styles.lessonEyebrow}>Why Here?</span>
      <h2 id="lesson-grammar-title" tabIndex={-1}>Miért pont így mondják?</h2>
      {analysis.grammar.length > 0 ? (
        <div className={styles.grammarInsights}>
          {analysis.grammar.map((note) => (
            <article key={note.titleHu}>
              <h3>{note.titleHu}</h3>
              <p>{note.explanationHu}</p>
              {"example" in note && note.example ? (
                <div className={styles.grammarExample}>
                  <span>Új példa · nem a forrás része</span>
                  <strong lang="it">{note.example.italian}</strong>
                  <p>{note.example.meaningHu}</p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.lessonLead}>Most a használható mintán van a hangsúly.</p>
      )}
      {analysis.transfer.length > 0 ? (
        <div className={styles.transferChallenge}>
          <span>Új tanítási példák · nem a forrás részei</span>
          <h3>Próbáld más helyzetben</h3>
          <ul>
            {analysis.transfer.map((example) => (
              <li key={example.italian}>
                <strong lang="it">{example.italian}</strong>
                <p>{example.meaningHu}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <button className={styles.lessonPrimary} type="button" onClick={onNext}>Jöhet a próba</button>
    </section>
  );
}
