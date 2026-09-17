import { matrixTheme } from '@/data/matrix-theme';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { LifeEntity, listEntities } from '@/data/lifeos-store';
import { useLifeOS } from '@/providers/lifeos-provider';

export function useRecords() {
  const { appearance } = useLifeOS();
  const dark = appearance === 'dark';
  const p = matrixTheme(appearance);
  const [items, setItems] = useState<LifeEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const token = ++generation.current; setLoading(true);
    try { const records = await listEntities(); if (token === generation.current) { setItems(records.filter(item => !item.archivedAt)); setError(false); } }
    catch { if (token === generation.current) setError(true); }
    finally { if (token === generation.current) setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void reload(); return () => { generation.current++; }; }, [reload]));
  return { items, loading, error, reload, p };
}
