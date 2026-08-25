import { MediaVisual } from "@/components/ui/MediaVisual";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./landing.module.css";

const steps = [
  {
    number: "1",
    title: "Hallgasd meg vagy töltsd fel",
    copy: "Játssz le egy tiszta részletet hangszórón, vagy válassz egy MP3, M4A vagy WAV fájlt.",
  },
  {
    number: "2",
    title: "Cantu felismeri a dalt",
    copy: "Megmutatjuk a lehetséges találatot. A szám csak akkor lesz elfogadva, ha te is megerősíted.",
  },
  {
    number: "3",
    title: "Tanuld meg a refrént és a fontos sorokat",
    copy: "A dal értelmével kezdünk, aztán jönnek a megjegyezhető olasz kifejezések és nyelvi minták.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="hogyan-mukodik" className={styles.how} aria-labelledby="how-title">
      <div className={styles.sectionHeading}>
        <span className={styles.eyebrow}>Három tiszta lépés</span>
        <h2 id="how-title">A daltól az első felismerésig.</h2>
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
