import type { APIRoute } from "astro";
export const GET: APIRoute=({site})=>new Response(`User-agent: *\n${process.env.SITE_URL&&!/localhost|127\.0\.0\.1/.test(process.env.SITE_URL)?"Allow: /":"Disallow: /"}\nSitemap: ${new URL(import.meta.env.BASE_URL+"sitemap-index.xml",site).href}\n`);
