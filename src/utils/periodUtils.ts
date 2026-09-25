import { PayPeriod } from '../types';

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

/**
 * Returns the PayPeriod for a specific target month (0-indexed) and year.
 * Period runs from the 16th of the previous month to the 15th of the target month.
 * Example: year = 2026, monthIndex = 7 (August)
 * Start: 2026-07-16
 * End: 2026-08-15
 * Name: "รอบเดือนสิงหาคม 2026"
 */
export function getAutoPeriodForMonth(year: number, monthIndex: number): PayPeriod {
  const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
  const prevYear = monthIndex === 0 ? year - 1 : year;

  const startStr = `${prevYear}-${String(prevMonthIndex + 1).padStart(2, '0')}-16`;
  const endStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-15`;
  const monthName = THAI_MONTHS[monthIndex];

  return {
    id: `p-${year}-${String(monthIndex + 1).padStart(2, '0')}`,
    name: `รอบเดือน${monthName} ${year}`,
    start: startStr,
    end: endStr
  };
}

/**
 * Automatically determines the current PayPeriod for any reference date.
 * If the date is 1st-15th, it belongs to the period ending on the 15th of this month.
 * If the date is 16th-31st, it belongs to the period ending on the 15th of next month.
 */
export function getCurrentAutoPeriod(refDate: Date = new Date()): PayPeriod {
  const day = refDate.getDate();
  let m = refDate.getMonth();
  let y = refDate.getFullYear();

  if (day > 15) {
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }

  return getAutoPeriodForMonth(y, m);
}

/**
 * Generates a list of consecutive 16th-15th PayPeriods surrounding a reference date.
 */
export function generateAutoPeriodsList(refDate: Date = new Date(), countBefore = 6, countAfter = 5): PayPeriod[] {
  const day = refDate.getDate();
  let currentM = refDate.getMonth();
  let currentY = refDate.getFullYear();

  if (day > 15) {
    currentM += 1;
    if (currentM > 11) {
      currentM = 0;
      currentY += 1;
    }
  }

  const periods: PayPeriod[] = [];
  for (let offset = -countBefore; offset <= countAfter; offset++) {
    let targetM = currentM + offset;
    let targetY = currentY;
    while (targetM < 0) {
      targetM += 12;
      targetY -= 1;
    }
    while (targetM > 11) {
      targetM -= 12;
      targetY += 1;
    }
    periods.push(getAutoPeriodForMonth(targetY, targetM));
  }

  return periods;
}

export interface AllowancePeriod {
  id: string;
  name: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  year: number;
  monthIndex: number; // 0-indexed
  monthName: string;
}

/**
 * Returns the allowance calculation cycle (21st of prev month to 20th of target month).
 * Example: year = 2026, monthIndex = 8 (กันยายน)
 * Start: 2026-08-21
 * End: 2026-09-20
 * Name: "รอบเดือนกันยายน 2026"
 */
export function getAllowancePeriodForMonth(year: number, monthIndex: number): AllowancePeriod {
  const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
  const prevYear = monthIndex === 0 ? year - 1 : year;

  const startStr = `${prevYear}-${String(prevMonthIndex + 1).padStart(2, '0')}-21`;
  const endStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-20`;
  const monthName = THAI_MONTHS[monthIndex];

  return {
    id: `allowance-${year}-${String(monthIndex + 1).padStart(2, '0')}`,
    name: `รอบเดือน${monthName} ${year}`,
    start: startStr,
    end: endStr,
    year,
    monthIndex,
    monthName
  };
}

/**
 * Finds which 21st-20th allowance period a given date belongs to.
 * Example 1: 2026-08-21 -> belongs to September 2026 (2026-08-21 to 2026-09-20)
 * Example 2: 2026-09-20 -> belongs to September 2026
 * Example 3: 2026-09-21 -> belongs to October 2026
 */
export function getAllowancePeriodForDate(dateStr: string): AllowancePeriod {
  if (!dateStr || dateStr.length < 10) {
    const now = new Date();
    return getAllowancePeriodForMonth(now.getFullYear(), now.getMonth());
  }

  const parts = dateStr.split('-');
  let y = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10) - 1; // 0-indexed
  const d = parseInt(parts[2], 10);

  if (d >= 21) {
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }

  return getAllowancePeriodForMonth(y, m);
}

/**
 * Resolves the corresponding allowance period for a curtain pay period.
 * Uses the month of curtainPeriod.end as the anchor.
 * Example: Curtain period ending in Sep 2026 (e.g. 2026-09-15) -> Allowance period 2026-08-21 to 2026-09-20 (Sep 2026).
 */
export function getAllowancePeriodMatchingCurtainPeriod(curtainPeriod?: PayPeriod): AllowancePeriod {
  if (!curtainPeriod || !curtainPeriod.end) {
    const now = new Date();
    return getAllowancePeriodForMonth(now.getFullYear(), now.getMonth());
  }

  const parts = curtainPeriod.end.split('-');
  const y = parseInt(parts[0], 10) || new Date().getFullYear();
  const m = (parseInt(parts[1], 10) || (new Date().getMonth() + 1)) - 1;

  return getAllowancePeriodForMonth(y, m);
}
