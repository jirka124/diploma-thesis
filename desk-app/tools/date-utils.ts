export class DateUtils {
  static toIsoDateTime(date: Date): string {
    return date.toISOString();
  }

  static toDateOnlyIso(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  static startOfLocalDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  static formatLocalDateTime(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}`;
  }

  static parseDatePickerValue(dateValue: string) {
    const [yearRaw, monthRaw, dayRaw] = dateValue.split('/');
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);

    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
      return null;
    }

    return { year, month, day };
  }

  static fromDatePickerToIso(dateValue: string, timeValue: string, fallbackToEndOfDay: boolean) {
    const parsed = this.parseDatePickerValue(dateValue);
    if (!parsed) return undefined;

    const [hourRaw, minuteRaw] = (timeValue || '').split(':');
    const hasTime = Number.isInteger(Number(hourRaw)) && Number.isInteger(Number(minuteRaw));
    const hour = hasTime ? Number(hourRaw) : fallbackToEndOfDay ? 23 : 0;
    const minute = hasTime ? Number(minuteRaw) : fallbackToEndOfDay ? 59 : 0;
    const second = fallbackToEndOfDay ? 59 : 0;
    const ms = fallbackToEndOfDay ? 999 : 0;

    return new Date(parsed.year, parsed.month - 1, parsed.day, hour, minute, second, ms).toISOString();
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
