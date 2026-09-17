import { fieldsForEntity } from './entity-fields';
import { validateLogItems } from './log-items';

export function validateEntityInput(type: string, title: string, values: Record<string, string>): string | null {
  if (!title.trim()) return 'Add a name for this item.';
  if (title.trim().length > 200) return 'Keep the name under 200 characters.';
  const logError = validateLogItems(type, values.logItems);
  if (logError) return logError;
  for (const field of fieldsForEntity(type)) {
    const value = values[field.key]?.trim();
    if (!value) continue;
    if (field.input === 'date') {
      const parsed = new Date(`${value}T12:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
        return `${field.label}: enter a real date as YYYY-MM-DD.`;
      }
    }
    if (field.input === 'time' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return `${field.label}: use 24-hour time, such as 09:30.`;
    if (field.keyboard === 'numeric' && (!/^\d+(\.\d+)?$/.test(value) || !Number.isFinite(Number(value)))) {
      return `${field.label}: enter a positive number or zero, without symbols or units.`;
    }
    if (field.keyboard === 'email-address' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return `${field.label}: enter a valid email address.`;
    }
    if (field.keyboard === 'url') {
      try {
        const url = new URL(value);
        if (!['https:', 'http:'].includes(url.protocol) || !url.hostname) return `${field.label}: use an http or https link.`;
      } catch { return `${field.label}: enter a complete link, starting with https://.`; }
    }
  }
  if (type === 'Trip' && values.start && values.end && values.end < values.start) return 'End date must be on or after the start date.';
  if (type === 'Book' && Number(values.progress) > 100) return 'Progress must be between 0 and 100.';
  if (type === 'Movie' && Number(values.rating) > 10) return 'Rating must be between 0 and 10.';
  if (type === 'Cycle Log' && values.cycleDay?.trim() && (!Number.isSafeInteger(Number(values.cycleDay)) || Number(values.cycleDay) < 1)) return 'Cycle day must be a whole number of 1 or more.';
  return null;
}
