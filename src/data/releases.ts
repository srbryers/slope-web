// Fetch all GitHub releases for slope at build time.
// Optional GITHUB_TOKEN env var for higher rate limits (60/hr unauth vs 5000/hr auth).

export interface Release {
  tag: string;
  name: string;
  body: string;
  publishedAt: string;
  htmlUrl: string;
}

const RELEASES_API = 'https://api.github.com/repos/srbryers/slope/releases';

export async function fetchReleases(): Promise<Release[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  const token = import.meta.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const releases: Release[] = [];
  let page = 1;

  try {
    while (true) {
      const url = `${RELEASES_API}?per_page=100&page=${page}`;
      const res = await fetch(url, { headers });
      if (!res.ok) break;

      const data = (await res.json()) as Array<{
        tag_name: string;
        name: string | null;
        body: string | null;
        published_at: string;
        html_url: string;
        draft: boolean;
      }>;

      if (data.length === 0) break;

      for (const r of data) {
        if (r.draft) continue;
        releases.push({
          tag: r.tag_name,
          name: r.name || r.tag_name,
          body: r.body || '',
          publishedAt: r.published_at,
          htmlUrl: r.html_url,
        });
      }

      // No more pages if fewer than per_page returned
      if (data.length < 100) break;
      page++;
    }
  } catch {
    // Graceful degradation — build still succeeds with empty releases
    return [];
  }

  return releases;
}
