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
