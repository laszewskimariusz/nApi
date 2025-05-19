import { NextResponse } from "next/server";

function parseVersion(tag: string): number[] {
  return tag
    .replace(/^v/, "") // usuń prefix v
    .split(".")
    .map((n) => parseInt(n, 10));
}

function compareVersions(a: string, b: string): number {
  const av = parseVersion(a);
  const bv = parseVersion(b);
  for (let i = 0; i < Math.max(av.length, bv.length); i++) {
    const diff = (bv[i] || 0) - (av[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export async function GET() {
  try {
    const res = await fetch("https://api.github.com/repos/laszewskimariusz/nApi/tags", {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error("GitHub API error");

    const tags = await res.json();
    const versions = tags.map((t: any) => t.name);
    const latest = versions.sort(compareVersions)[0] ?? "untagged";

    return NextResponse.json({ version: `v${latest}` });
  } catch (err) {
    return NextResponse.json({ version: "unknown" }, { status: 500 });
  }
}
