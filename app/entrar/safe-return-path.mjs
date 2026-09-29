export function safeReturnPath(value, origin) {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/painel";

  try {
    const candidate = new URL(value, origin);
    if (candidate.origin !== origin) return "/painel";

    let decodedPath = candidate.pathname;

    for (let pass = 0; pass < 3; pass += 1) {
      const nextPath = decodeURIComponent(decodedPath);
      if (nextPath === decodedPath) break;
      decodedPath = nextPath;
    }

    if (decodedPath.startsWith("//") || decodedPath.includes("\\")) return "/painel";

    return `${candidate.pathname}${candidate.search}${candidate.hash}`;
  } catch {
    return "/painel";
  }
}
