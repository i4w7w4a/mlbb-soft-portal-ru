import { PublicShell } from "@/components/layout/public-shell";
import { getAllHeroes, getAllNews } from "@/lib/content/repository";

export default async function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [heroes, news] = await Promise.all([getAllHeroes(), getAllNews(true)]);

  return (
    <PublicShell heroes={heroes} news={news}>
      {children}
    </PublicShell>
  );
}

