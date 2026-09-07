/**
 * Runs `task` over `items` with at most `limit` in flight.
 * Results keep the input order. Used to speed up per-item AI calls without
 * firing an unbounded number of upstream requests at once.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await task(items[index], index);
    }
  });

  await Promise.all(workers);
  return results;
}
