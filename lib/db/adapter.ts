import { dbQuery, dbQueryOne } from './pool';
import { createStorageApi } from '@/lib/storage/minio';
import { getSessionUser, type SessionUser } from '@/lib/auth/session';

export interface DbError {
  message: string;
}

export interface DbResult<T = unknown> {
  data: T | null;
  error: DbError | null;
}

type Row = Record<string, unknown>;

class TableQuery {
  private table: string;
  private serviceMode: boolean;
  private columns = '*';
  private filters: Array<{ col: string; op: '=' | 'in' | '>=' | '<=' | 'is not null'; val?: unknown }> = [];
  private orderCol?: string;
  private orderAsc = true;
  private limitN?: number;
  private mode: 'select' | 'insert' | 'upsert' | 'update' = 'select';
  private rows: Row | Row[] = {};
  private conflictTarget?: string;
  private returning = false;
  private singleMode: 'none' | 'maybe' | 'one' = 'none';

  constructor(table: string, serviceMode: boolean) {
    this.table = table;
    this.serviceMode = serviceMode;
  }

  select(cols = '*') {
    this.columns = cols;
    this.returning = true;
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push({ col, op: '=', val });
    return this;
  }

  in(col: string, vals: unknown[]) {
    this.filters.push({ col, op: 'in', val: vals });
    return this;
  }

  gte(col: string, val: unknown) {
    this.filters.push({ col, op: '>=', val });
    return this;
  }

  lte(col: string, val: unknown) {
    this.filters.push({ col, op: '<=', val });
    return this;
  }

  not(col: string, operator: string, val: unknown) {
    if (operator === 'is' && val === null) {
      this.filters.push({ col, op: 'is not null' });
    }
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = opts?.ascending ?? true;
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  insert(row: object | object[]) {
    this.mode = 'insert';
    this.rows = row as Row | Row[];
    this.returning = true;
    return this;
  }

  upsert(row: object | object[], opts?: { onConflict?: string }) {
    this.mode = 'upsert';
    this.rows = row as Row | Row[];
    this.conflictTarget = opts?.onConflict;
    this.returning = true;
    return this;
  }

  update(row: object) {
    this.mode = 'update';
    this.rows = row as Row;
    this.returning = true;
    return this;
  }

  maybeSingle(): Promise<DbResult<Row>> {
    this.singleMode = 'maybe';
    this.limitN = 1;
    return this.run() as Promise<DbResult<Row>>;
  }

  single(): Promise<DbResult<Row>> {
    this.singleMode = 'one';
    this.limitN = 1;
    return this.run() as Promise<DbResult<Row>>;
  }

  then<TResult1 = DbResult<Row[]>, TResult2 = never>(
    onfulfilled?: ((value: DbResult<Row[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return (this.run() as Promise<DbResult<Row[]>>).then(onfulfilled, onrejected);
  }

  private buildWhere(startIdx: number): { sql: string; params: unknown[] } {
    const params: unknown[] = [];
    const parts: string[] = [];
    let idx = startIdx;

    for (const f of this.filters) {
      if (f.op === 'in') {
        const vals = f.val as unknown[];
        if (!vals.length) {
          parts.push('1=0');
          continue;
        }
        const placeholders = vals.map(() => `$${idx++}`);
        params.push(...vals);
        parts.push(`${f.col} IN (${placeholders.join(', ')})`);
      } else if (f.op === 'is not null') {
        parts.push(`${f.col} IS NOT NULL`);
      } else if (f.op === '>=' || f.op === '<=') {
        params.push(f.val);
        parts.push(`${f.col} ${f.op} $${idx++}`);
      } else {
        params.push(f.val);
        parts.push(`${f.col} = $${idx++}`);
      }
    }

    return {
      sql: parts.length ? ` WHERE ${parts.join(' AND ')}` : '',
      params,
    };
  }

  private normalizeRows(): Row[] {
    return Array.isArray(this.rows) ? this.rows : [this.rows as Row];
  }

  async run(): Promise<DbResult<Row[] | Row>> {
    try {
      if (this.mode === 'select') {
        const { sql: whereSql, params } = this.buildWhere(1);
        let sql = `SELECT ${this.columns} FROM ${this.table}${whereSql}`;
        if (this.orderCol) {
          sql += ` ORDER BY ${this.orderCol} ${this.orderAsc ? 'ASC' : 'DESC'}`;
        }
        if (this.limitN != null) sql += ` LIMIT ${this.limitN}`;
        const data = await dbQuery<Row>(sql, params);
        return this.wrapRows(data);
      }

      const batch = this.normalizeRows();
      if (!batch.length) return { data: [], error: null };

      if (this.mode === 'insert') {
        const results: Row[] = [];
        for (const row of batch) {
          const cols = Object.keys(row);
          const vals = Object.values(row);
          const placeholders = cols.map((_, i) => `$${i + 1}`);
          const returning = this.returning ? ' RETURNING *' : '';
          const sql = `INSERT INTO ${this.table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')})${returning}`;
          if (this.returning) {
            const inserted = await dbQueryOne<Row>(sql, vals);
            if (inserted) results.push(inserted);
          } else {
            await dbQuery(sql, vals);
          }
        }
        return this.wrapRows(results);
      }

      if (this.mode === 'upsert') {
        const results: Row[] = [];
        for (const row of batch) {
          const cols = Object.keys(row);
          const vals = Object.values(row);
          const placeholders = cols.map((_, i) => `$${i + 1}`);
          const updates = cols
            .filter((c) => c !== this.conflictTarget)
            .map((c) => `${c} = EXCLUDED.${c}`)
            .join(', ');
          const conflict = this.conflictTarget
            ? ` ON CONFLICT (${this.conflictTarget}) DO UPDATE SET ${updates}`
            : '';
          const returning = this.returning ? ' RETURNING *' : '';
          const sql = `INSERT INTO ${this.table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')})${conflict}${returning}`;
          if (this.returning) {
            const upserted = await dbQueryOne<Row>(sql, vals);
            if (upserted) results.push(upserted);
          } else {
            await dbQuery(sql, vals);
          }
        }
        return this.wrapRows(results);
      }

      if (this.mode === 'update') {
        const row = batch[0];
        const cols = Object.keys(row);
        const vals = Object.values(row);
        const setParts = cols.map((c, i) => `${c} = $${i + 1}`);
        const { sql: whereSql, params: whereParams } = this.buildWhere(vals.length + 1);
        const sql = `UPDATE ${this.table} SET ${setParts.join(', ')}${whereSql}${this.returning ? ' RETURNING *' : ''}`;
        const data = await dbQuery<Row>(sql, [...vals, ...whereParams]);
        return this.wrapRows(data);
      }

      return { data: null, error: { message: 'Unsupported query' } };
    } catch (e) {
      return {
        data: null,
        error: { message: e instanceof Error ? e.message : 'Database error' },
      };
    }
  }

  private wrapRows(data: Row[]): DbResult<Row[] | Row> {
    if (this.singleMode === 'maybe') {
      return { data: data[0] ?? null, error: null };
    }
    if (this.singleMode === 'one') {
      if (!data[0]) return { data: null, error: { message: 'No rows' } };
      return { data: data[0], error: null };
    }
    return { data, error: null };
  }
}

export class DbClient {
  constructor(private serviceMode = false) {}

  from(table: string) {
    return new TableQuery(table, this.serviceMode);
  }

  get storage() {
    return createStorageApi();
  }

  get auth() {
    return {
      getUser: async (): Promise<{ data: { user: SessionUser | null } }> => {
        if (this.serviceMode) {
          return { data: { user: null } };
        }
        const user = await getSessionUser();
        return { data: { user } };
      },
      signOut: async () => ({ error: null }),
    };
  }
}

export function createDbClient(serviceMode = false): DbClient {
  return new DbClient(serviceMode);
}

// Compatible alias for existing imports
export type SupabaseClient = DbClient;
