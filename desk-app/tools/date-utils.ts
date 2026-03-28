export class DateUtils {
  static toDateOnlyIso(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  static shiftDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  static dateOnlyToUtcDaySerial(dateOnly: string): number {
    const [yearStr = '0', monthStr = '1', dayStr = '1'] = dateOnly.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  }
}
