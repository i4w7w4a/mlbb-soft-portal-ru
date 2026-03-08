import { HeroesExplorer } from "@/components/explorers/heroes-explorer";
import { SectionHeading } from "@/components/layout/section-heading";
import { getAllHeroes } from "@/lib/content/repository";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Heroes",
  description: "Explore all MLBB heroes with role, lane and editorial filters.",
  path: "/heroes",
});

export default async function HeroesPage() {
  const heroes = await getAllHeroes();

  return (
    <div className="mx-auto flex w-[min(100%-1.5rem,88rem)] flex-col gap-10">
      <SectionHeading
        eyebrow="Hero Index"
        title="A catalog that treats every hero like an editorial world."
        description="Fast filters, premium cards and scalable hero entry points for continuous coverage."
      />
      <HeroesExplorer heroes={heroes} />
    </div>
  );
}

