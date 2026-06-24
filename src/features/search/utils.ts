export function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.id;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
