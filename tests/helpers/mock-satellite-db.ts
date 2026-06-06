import type { DbClient } from '@/lib/db/adapter';

export interface MockSatelliteRow {
  zone_id: string;
  reading_date: string;
  ndvi: number;
  ndmi: number;
  ndre?: number | null;
  source?: string;
  captured_at?: string;
  scene_date?: string | null;
  s1_vv?: number | null;
  s1_vh?: number | null;
  science_metadata?: Record<string, unknown> | null;
}

type Filter = { col: string; op: '=' | '<=' | '>='; val: unknown };

function applyFilters(rows: MockSatelliteRow[], filters: Filter[]): MockSatelliteRow[] {
  return rows.filter((r) => {
    for (const f of filters) {
      const v = r[f.col as keyof MockSatelliteRow];
      if (f.op === '=' && v !== f.val) return false;
      if (f.op === '<=' && String(v) > String(f.val)) return false;
      if (f.op === '>=' && String(v) < String(f.val)) return false;
    }
    return true;
  });
}

/** DbClient mínimo in-memory para tests de satellite_readings. */
export function createMockSatelliteService(rows: MockSatelliteRow[]): DbClient {
  const chainState = {
    table: '',
    filters: [] as Filter[],
    orderCol: null as string | null,
    orderAsc: true,
    limitN: null as number | null,
    single: false,
    cols: '*',
  };

  const exec = async () => {
    if (chainState.table !== 'satellite_readings') {
      return { data: chainState.single ? null : [], error: null };
    }
    let result = applyFilters(rows, chainState.filters);
    if (chainState.orderCol) {
      const col = chainState.orderCol;
      result = [...result].sort((a, b) => {
        const av = String(a[col as keyof MockSatelliteRow]);
        const bv = String(b[col as keyof MockSatelliteRow]);
        return chainState.orderAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    if (chainState.limitN != null) {
      result = result.slice(0, chainState.limitN);
    }
    const mapped = result.map((r) => ({
      ...r,
      captured_at: r.captured_at ?? `${r.reading_date}T12:00:00.000Z`,
      source: r.source ?? 'copernicus',
    }));
    if (chainState.single) {
      return { data: mapped[0] ?? null, error: null };
    }
    return { data: mapped, error: null };
  };

  const makeChain = (table: string) => {
    chainState.table = table;
    chainState.filters = [];
    chainState.orderCol = null;
    chainState.orderAsc = true;
    chainState.limitN = null;
    chainState.single = false;
    chainState.cols = '*';

    const chain = {
      select(cols: string) {
        chainState.cols = cols;
        return chain;
      },
      eq(col: string, val: unknown) {
        chainState.filters.push({ col, op: '=', val });
        return chain;
      },
      lte(col: string, val: unknown) {
        chainState.filters.push({ col, op: '<=', val });
        return chain;
      },
      gte(col: string, val: unknown) {
        chainState.filters.push({ col, op: '>=', val });
        return chain;
      },
      order(col: string, opts?: { ascending?: boolean }) {
        chainState.orderCol = col;
        chainState.orderAsc = opts?.ascending ?? true;
        return chain;
      },
      limit(n: number) {
        chainState.limitN = n;
        return chain;
      },
      maybeSingle() {
        chainState.single = true;
        chainState.limitN = 1;
        return exec();
      },
      then<TResult1 = unknown, TResult2 = never>(
        onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
      ) {
        return exec().then(onfulfilled, onrejected);
      },
    };
    return chain;
  };

  return {
    from: (table: string) => makeChain(table),
  } as unknown as DbClient;
}
