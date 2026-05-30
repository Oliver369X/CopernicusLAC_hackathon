'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Field } from '@/lib/types/field';
import { MOCK_FIELDS } from '@/lib/mock-data/fields';
import { deserializeFields, type FieldJson } from '@/lib/utils/serialize-field';

export function useFields() {
  const [fields, setFields] = useState<Field[]>(MOCK_FIELDS);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'mock' | 'database'>('mock');

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/fields');
      const data = (await res.json()) as { fields: FieldJson[]; source: string };
      if (data.fields?.length) {
        setFields(deserializeFields(data.fields));
        setSource(data.source === 'database' ? 'database' : 'mock');
      }
    } catch {
      setFields(MOCK_FIELDS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getFieldById = useCallback(
    (id: string) => fields.find((f) => f.id === id),
    [fields]
  );

  return { fields, loading, source, refresh, getFieldById };
}
