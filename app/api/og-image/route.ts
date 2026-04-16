import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new Response("Missing url param", { status: 400 });

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Globe72Bot/1.0)" },
      // 5s timeout
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return new Response("Fetch failed", { status: 502 });

    const html = await res.text();
    // Extract og:image content attribute
    const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

    if (!match) return new Response("No og:image found", { status: 404 });

    return Response.json({ imageUrl: match[1] });
  } catch {
    return new Response("Error fetching page", { status: 502 });
  }
}
