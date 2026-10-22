/** No automatic translation of customer text. These are controlled unit labels only. */
export const germanUnits: Record<string, string> = { item: 'Stück', hour: 'Stunde', month: 'Monat', percent: 'Prozent', fixed: 'Pauschale' };
export const missingGerman = '[Deutsche Übersetzung fehlt]';
export function germanText(english: string | null | undefined, german: string | null | undefined) {
  return german?.trim() || (english?.trim() ? missingGerman : '');
}
