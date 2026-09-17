import { supabase } from '../utils/supabase';
import { MatrixRow, normalizeMatrixRow } from './matrix-adapter';
import { LifeEntity, setEntitySource } from './lifeos-store';

export type DataMode = 'account' | 'local' | 'full' | 'empty' | 'sparse' | 'large';
let mode: DataMode = 'account';
let preview: MatrixRow[] = [];
export function getDataMode() { return mode; }
export async function fetchAccountEntities(): Promise<LifeEntity[]> {
  if (!supabase) return [];
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session) return [];
  const rows: MatrixRow[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await supabase.from('entities')
      .select('id,entity_type,data,created_at,updated_at,deleted_at')
      .eq('user_id', session.user.id).is('deleted_at', null).order('id').range(offset, offset + 99);
    if (error) throw error;
    rows.push(...(data as MatrixRow[]));
    if (data.length < 100) break;
  }
  const { data: { session: current } } = await supabase.auth.getSession();
  if (current?.user.id !== session.user.id) return [];
  return rows.map((row) => normalizeMatrixRow(row)).filter((item): item is LifeEntity => !!item);
}
export async function selectDataMode(next: DataMode) {
  if (!__DEV__ && !['account', 'local'].includes(next)) throw new Error('Developer scenarios are unavailable in release builds.');
  if (['full', 'sparse', 'large'].includes(next) && !preview.length) {
    const response = await fetch('http://127.0.0.1:8766/entities.json');
    if (!response.ok) throw new Error('Start the local MATRIX preview server first.');
    const rows: unknown = await response.json();
    if (!Array.isArray(rows) || !rows.every((row) => typeof row.id === 'string' && typeof row.entity_type === 'string' && row.data)) throw new Error('Invalid preview data.');
    preview = rows;
  }
  mode = next;
  if (next === 'account') setEntitySource(fetchAccountEntities);
  else if (next === 'local') setEntitySource(null);
  else setEntitySource(async () => {
    if (next === 'empty') return [];
    const rows = next === 'sparse' ? preview.slice(0, 3) : next === 'large' ? Array.from({ length: 15 }, (_, index) => preview.map((row) => ({ ...row, id: `preview-${index}-${row.id}` }))).flat() : preview;
    return rows.map((row) => normalizeMatrixRow(row, 'preview')).filter((item): item is LifeEntity => !!item);
  }, true);
}
setEntitySource(fetchAccountEntities);
