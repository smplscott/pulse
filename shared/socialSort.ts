export function sortByRepeatsThenRecency<T extends { id: number; createdAt?: Date | string | null }>(
  items: T[],
  repeatsById: Map<number, number>,
): T[] {
  return [...items].sort((a, b) => {
    const repeatDiff = (repeatsById.get(b.id) ?? 0) - (repeatsById.get(a.id) ?? 0);
    if (repeatDiff !== 0) return repeatDiff;
    return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
  });
}

export function sortBySocialScoreThenRecency<T extends { id: number; createdAt?: Date | string | null }>(
  items: T[],
  scoreById: Map<number, number>,
): T[] {
  return [...items].sort((a, b) => {
    const scoreDiff = (scoreById.get(b.id) ?? 0) - (scoreById.get(a.id) ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
  });
}

export function matchesFollowedArtist(name: string | null | undefined, followed: Set<string>): boolean {
  if (!name) return false;
  return followed.has(name.trim().toLowerCase());
}

export function filterAttending<T extends { attendingAt?: Date | string | null }>(
  items: T[],
  attendingOnly: boolean,
): T[] {
  return attendingOnly ? items.filter(item => !!item.attendingAt) : items;
}
