export function siteUrl(path: string): string {
  if (/^(https?:|mailto:|tel:|#)/i.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/${path.replace(/^\/+/, "")}`;
}
