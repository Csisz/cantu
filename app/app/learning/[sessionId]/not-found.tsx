import Link from "next/link";

export default function LearningNotFound() {
  return (
    <main className="learningLoadError">
      <h1>Ez a tanulás nem érhető el.</h1>
      <p>Lehet, hogy törölted, vagy nem ehhez a fiókhoz tartozik.</p>
      <Link href="/app#library-title">Vissza a saját tanulásaimhoz</Link>
    </main>
  );
}
