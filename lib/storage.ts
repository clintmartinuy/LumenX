const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export function publicStorageUrl(bucket: "product-images" | "job-photos", path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
