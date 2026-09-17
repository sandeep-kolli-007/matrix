import { createElement } from 'react';
export function EntityDatePicker({ mode, value, label, onChange }: { mode: 'date' | 'time'; value: string; label: string; onChange: (value: string) => void }) {
  return createElement('input', { type: mode, value, 'aria-label': label, onChange: (event: { target: { value: string } }) => onChange(event.target.value), style: { minHeight: 44, padding: 10, borderRadius: 12, fontSize: 16, width: '100%', boxSizing: 'border-box' } });
}
