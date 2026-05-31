'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Field } from '@/lib/types/field';
import { MOCK_FIELDS } from '@/lib/mock-data/fields';
import { deserializeFields, type FieldJson } from '@/lib/utils/serialize-field';
import { parseJsonResponse } from '@/lib/fetch/parse-json-response';

export function useFields() {
  const [fields, setFields] = useState<Field[]>(MOCK_FIELDS);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'mock' | 'database'>('mock');
  const [fetchError, setFetchError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setFetchError(null);
    try {
      const res = await fetch('/api/fields');
      const { data, error } = await parseJsonResponse<{
        fields: FieldJson[];
        source: string;
      }>(res);
      if (error && !data?.fields?.length) {
        setFetchError(error);
        setFields(MOCK_FIELDS);
        setSource('mock');
        return;
      }
      if (data?.fields?.length) {
        setFields(deserializeFields(data.fields));
        setSource(data.source === 'database' ? 'database' : 'mock');
      }
    } catch {
      setFetchError('No se pudo cargar los campos del servidor');
      setFields(MOCK_FIELDS);
      setSource('mock');
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

  return { fields, loading, source, fetchError, refresh, getFieldById };
}
