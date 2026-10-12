import { describe, expect, it } from 'vitest';
import { addCalendarMonths, calculatePoshDeadline } from './poshDeadlineHelper';
import type { Incident } from './types';

const at = (iso: string) => new Date(`${iso}T12:00:00`);
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function incident(id: string, date: string, person = 'Rohan Sharma'): Incident {
  return {
    id, created_at: at(date).toISOString(), incident_datetime: at(date).toISOString(), location: '',
    people_involved: [{ id: 'p', name: person, roleOrRelationship: '' }], category: 'Verbal',
    narrative_raw: '', narrative_structured: { summary: '', context: '', keyActions: [], impactDescription: '' },
    witnesses: [], attachments: [], user_edited: false, tags: []
  };
}

describe('addCalendarMonths', () => {
  it('clamps month-end dates instead of overflowing', () => {
    expect(ymd(addCalendarMonths(at('2026-11-30'), 3))).toBe('2027-02-28');
    expect(ymd(addCalendarMonths(at('2027-11-30'), 3))).toBe('2028-02-29'); // leap year
    expect(ymd(addCalendarMonths(at('2026-08-31'), 3))).toBe('2026-11-30');
  });

  it('keeps the same day when it exists and crosses year boundaries', () => {
    expect(ymd(addCalendarMonths(at('2026-01-15'), 3))).toBe('2026-04-15');
    expect(ymd(addCalendarMonths(at('2026-10-20'), 3))).toBe('2027-01-20');
  });
});

describe('calculatePoshDeadline', () => {
  it('counts three calendar months from a single incident', () => {
    const info = calculatePoshDeadline(incident('a', '2026-11-30'), [], at('2027-02-27'));
    expect(info.isPast3Months).toBe(false);
    expect(info.daysRemaining).toBe(1);
  });

  it('runs from the most recent incident in a series with the same person', () => {
    const first = incident('a', '2026-01-10');
    const latest = incident('b', '2026-03-05', ' rohan sharma ');
    const other = incident('c', '2026-06-01', 'Someone Else');
    const info = calculatePoshDeadline(first, [first, latest, other], at('2026-05-01'));
    expect(info.isSeries).toBe(true);
    expect(ymd(info.baseIncidentDate)).toBe('2026-03-05');
    expect(info.isPast3Months).toBe(false);
  });

  it('points to the extension once the window has passed', () => {
    const info = calculatePoshDeadline(incident('a', '2026-01-10'), [], at('2026-05-01'));
    expect(info.isPast3Months).toBe(true);
    expect(info.displayText).toMatch(/extension/i);
  });
});
