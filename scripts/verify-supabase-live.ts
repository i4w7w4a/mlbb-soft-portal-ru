import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getPublicSiteUrl, hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/supabase/config";

const requiredBuckets = ["heroes", "news", "brand", "social", "misc"] as const;
const requiredEnv = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

function getMissingEnv() {
  return requiredEnv.filter((name) => !process.env[name]);
}

async function main() {
  const missingEnv = getMissingEnv();

  console.log(`Site URL: ${getPublicSiteUrl()}`);
  console.log(`Public Supabase env present: ${hasSupabaseEnv() ? "yes" : "no"}`);
  console.log(`Admin Supabase env present: ${hasSupabaseAdminEnv() ? "yes" : "no"}`);

  if (missingEnv.length) {
    console.error(`Missing env vars: ${missingEnv.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const supabase = createSupabaseAdmin();

  if (!supabase) {
    console.error("Supabase admin client could not be created.");
    process.exitCode = 1;
    return;
  }

  const [{ data: bucketData, error: bucketError }, { data: userData, error: userError }] =
    await Promise.all([
      supabase.storage.listBuckets(),
      supabase.auth.admin.listUsers({ page: 1, perPage: 1 }),
    ]);

  if (bucketError) {
    console.error(`Bucket listing failed: ${bucketError.message}`);
    process.exitCode = 1;
    return;
  }

  if (userError) {
    console.error(`Auth admin check failed: ${userError.message}`);
    process.exitCode = 1;
    return;
  }

  const buckets = bucketData ?? [];
  const bucketMap = new Map(buckets.map((bucket) => [bucket.name, bucket]));
  const missingBuckets = requiredBuckets.filter((bucket) => !bucketMap.has(bucket));

  console.log(`Auth admin reachable: yes (${userData.users.length} user page fetched)`);

  for (const bucketName of requiredBuckets) {
    const bucket = bucketMap.get(bucketName);

    if (!bucket) {
      console.log(`- ${bucketName}: missing`);
      continue;
    }

    const { data, error } = await supabase.storage.from(bucketName).list("", {
      limit: 1,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      console.log(`- ${bucketName}: present but unreadable (${error.message})`);
      process.exitCode = 1;
      continue;
    }

    console.log(
      `- ${bucketName}: present, ${bucket.public ? "public" : "private"}, sample count ${data?.length ?? 0}`,
    );
  }

  if (missingBuckets.length) {
    console.error(`Missing required buckets: ${missingBuckets.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  console.log("Supabase live preflight passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown Supabase preflight failure.");
  process.exitCode = 1;
});
