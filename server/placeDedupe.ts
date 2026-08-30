export function normalizePlaceDedupeKey(name: string, city: string, country: string): string {
  return [name, city, country]
    .map(value =>
      value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .replace(/\s+/g, "-"),
    )
    .join("|");
}
