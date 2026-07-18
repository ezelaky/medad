export function formatArabicDate(date: Date): string {
  return new Intl.DateTimeFormat('ar-EG-u-nu-arab', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}
