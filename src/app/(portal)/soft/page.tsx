import { HeroCard } from "@/components/cards/hero-card";
import { NewsCard } from "@/components/cards/news-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { Card } from "@/components/ui/card";
import { getAllHeroes, getSoftConfig, getSoftNews } from "@/lib/content/repository";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "SOFT",
  description: "The premium SOFT hub for MLBB meta-defining stories and curated hero priority.",
  path: "/soft",
});

export default async function SoftPage() {
  const [heroes, stories, softConfig] = await Promise.all([
    getAllHeroes(),
    getSoftNews(),
    getSoftConfig(),
  ]);

  const priorityHeroes = heroes.filter((hero) => softConfig.heroPriority.includes(hero.slug));

  return (
    <div className="mx-auto flex w-[min(100%-1.5rem,88rem)] flex-col gap-12">
      <Card className="overflow-hidden border-cyan-300/20 bg-[radial-gradient(circle_at_top,rgba(101,230,255,0.22),transparent_35%),linear-gradient(180deg,rgba(12,18,31,0.95),rgba(3,8,16,0.95))] p-8 md:p-10">
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">SOFT hub</p>
            <h1 className="font-display text-5xl leading-none text-white md:text-6xl">
              {softConfig.headline}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              {softConfig.description}
            </p>
          </div>
          <div className="space-y-4">
            {softConfig.manifesto.map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-white/10 bg-white/6 px-5 py-4 text-sm leading-6 text-slate-100"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Priority Reads"
          title="Curated articles with SOFT status."
          description="These stories receive visual priority and ranking influence throughout the portal."
          soft
        />
        <div className="grid gap-5 lg:grid-cols-2">
          {stories.slice(0, 4).map((story) => (
            <NewsCard key={story.slug} story={story} large />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Hero Priority"
          title="Hero-specific SOFT materials stay close to their strongest subjects."
          description="SOFT hero emphasis is explicit, not buried behind a generic tag filter."
          soft
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {priorityHeroes.map((hero) => (
            <HeroCard key={hero.slug} hero={hero} />
          ))}
        </div>
      </section>
    </div>
  );
}

