import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { pt } from 'date-fns/locale';

/**
 * Formats a date into a long form Portuguese format like "Segunda-feira, 12 de Junho de 2023"
 */
export function formatDateToLongPtBR(date: Date): string {
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt });
}

/**
 * Formats a date to Brazilian date format (DD/MM/YYYY)
 */
export function formatToBrazilianDate(date: Date): string {
  return format(date, 'dd/MM/yyyy', { locale: pt });
}

/**
 * Formats a date relative to today (Hoje, Amanhã, etc.)
 */
export function formatRelativeDate(date: Date): string {
  if (isToday(date)) {
    return 'Hoje';
  } else if (isTomorrow(date)) {
    return 'Amanhã';
  } else if (isYesterday(date)) {
    return 'Ontem';
  } else {
    return format(date, 'dd/MM/yyyy', { locale: pt });
  }
}

/**
 * Gets the name of the day of the week in Portuguese
 */
export function getDayOfWeekName(date: Date): string {
  return format(date, 'EEEE', { locale: pt });
}

/**
 * Formats a date range
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  const startDay = format(startDate, 'd', { locale: pt });
  const endDay = format(endDate, 'd', { locale: pt });
  const month = format(endDate, 'MMMM', { locale: pt });
  const year = format(endDate, 'yyyy', { locale: pt });
  
  return `${startDay} a ${endDay} de ${month}, ${year}`;
}

/**
 * Converts a date to ISO format (YYYY-MM-DD)
 */
export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
