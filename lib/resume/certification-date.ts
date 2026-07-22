const monthNumbers: Record<string, number> = {
  january: 1,
  enero: 1,
  february: 2,
  febrero: 2,
  march: 3,
  marzo: 3,
  april: 4,
  abril: 4,
  may: 5,
  mayo: 5,
  june: 6,
  junio: 6,
  july: 7,
  julio: 7,
  august: 8,
  agosto: 8,
  september: 9,
  septiembre: 9,
  october: 10,
  octubre: 10,
  november: 11,
  noviembre: 11,
  december: 12,
  diciembre: 12,
};

export function certificationDateScore(value?: string) {
  const normalized = (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
  const year = Number(normalized.match(/\b(19|20)\d{2}\b/)?.[0] ?? 0);
  if (!year) return Number.NEGATIVE_INFINITY;

  const numericMonth = normalized.match(/\b(?:19|20)\d{2}[-/]?(0?[1-9]|1[0-2])\b/)?.[1];
  const namedMonth = Object.entries(monthNumbers).find(([name]) =>
    normalized.includes(name)
  )?.[1];
  const month = numericMonth ? Number(numericMonth) : namedMonth ?? 0;
  return year * 12 + month;
}

export function newestCertificationsFirst<T extends { issuedAt?: string }>(
  certifications: T[]
) {
  return certifications
    .map((certification, index) => ({ certification, index }))
    .sort(
      (left, right) =>
        certificationDateScore(right.certification.issuedAt) -
          certificationDateScore(left.certification.issuedAt) ||
        left.index - right.index
    )
    .map(({ certification }) => certification);
}
