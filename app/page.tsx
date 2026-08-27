import { Features } from "@/components/landing/Features";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LanguagePositioning } from "@/components/landing/LanguagePositioning";
import { ProblemStatement } from "@/components/landing/ProblemStatement";
import { SourceDemo } from "@/components/landing/SourceDemo";
import styles from "@/components/landing/landing.module.css";

export default function LandingPage() {
  return (
    <main className={styles.landing}>
      <Header />
      <Hero />
      <ProblemStatement />
      <HowItWorks />
      <SourceDemo />
      <Features />
      <LanguagePositioning />
      <FinalCta />
      <Footer />
    </main>
  );
}
