import { MediaVisual } from "@/components/ui/MediaVisual";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./landing.module.css";

const steps = [
  {
    number: "1",
    title: "Hozd azt, amit nem értesz",
    copy: "Hallgass meg egy rövid részletet, nyiss meg egy helyi hangfájlt, vagy írj be egy olasz szöveget.",
  },
  {
    number: "2",
    title: "Ellenőrizd, mit hallott vagy olvasott a Cantu",
    copy: "A pontos forrást mindig te hagyod jóvá, mielőtt elkezdődik a tanulás.",
  },
  {
    number: "3",
    title: "Értsd meg, jegyezd meg, mondd ki",
    copy: "A természetes jelentés után a használható kifejezések és egy rövid aktív gyakorlás következik.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="hogyan-mukodik" className={styles.how} aria-labelledby="how-title">
      <div className={styles.sectionHeading}>
        <span className={styles.eyebrow}>Három tiszta lépés</span>
        <h2 id="how-title">A valódi pillanattól a használható olaszig.</h2>
      </div>
      <div className={styles.steps}>
        {steps.map((step, index) => (
          <Reveal className={styles.step} key={step.number}>
            <span className={styles.stepNumber} aria-hidden="true">
              {step.number}
            </span>
            <div className={styles.stepCopy}>
              <span className={styles.stepKicker}>{index === 0 ? "Belépés" : index === 1 ? "Ellenőrzés" : "Tanulás"}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </div>
            {index === 1 ? (
              <MediaVisual
                className={styles.stepRobot}
                videoSrc="/assets/wave_upload.mp4"
                posterSrc="/robot.png"
                alt="A Cantu robot barátságosan integet"
                sizes="(max-width: 760px) 70vw, 24vw"
                fit="contain"
              />
            ) : null}
          </Reveal>
        ))}
      </div>
    </section>
  );
}
