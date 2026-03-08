import { Card } from "@/components/ui/card";

export default function AdminMediaPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="space-y-4">
        <p className="font-display text-3xl text-white">Media management</p>
        <p className="text-sm leading-6 text-slate-400">
          Public demo assets currently live in `public/images`. When Supabase Storage is configured, this page becomes the upload and browse surface for cover art and hero media.
        </p>
      </Card>
      <Card className="space-y-4">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Recommended buckets</p>
        <div className="space-y-3 text-sm text-slate-200">
          <div className="rounded-2xl border border-white/8 px-4 py-3">heroes</div>
          <div className="rounded-2xl border border-white/8 px-4 py-3">news</div>
          <div className="rounded-2xl border border-white/8 px-4 py-3">social</div>
        </div>
      </Card>
    </div>
  );
}
