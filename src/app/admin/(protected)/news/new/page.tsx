import { NewsEditor } from "@/components/admin/news-editor";
import { Card } from "@/components/ui/card";
import { getAllHeroes } from "@/lib/content/repository";

export default async function AdminNewsCreatePage() {
  const heroes = await getAllHeroes();

  return (
    <div className="space-y-6">
      <Card className="space-y-3">
        <p className="font-display text-3xl text-white">Quick editor</p>
        <p className="text-sm leading-6 text-slate-400">
          Form mode and JSON mode share the same schema, preview and save path.
        </p>
      </Card>
      <NewsEditor heroes={heroes} />
    </div>
  );
}

