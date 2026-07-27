'use client';

import { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';

const locales = ['en', 'de', 'uk', 'ru', 'sk', 'fr'] as const;
type Locale = (typeof locales)[number];
type Localized = Record<Locale, string>;
type Item = {
  id?: string;
  code: string;
  name: Localized;
  price: string;
  note: Localized;
  sortOrder: number;
  active: boolean;
};
type Section = {
  id?: string;
  number: string;
  title: Localized;
  subtitle: Localized;
  sortOrder: number;
  active: boolean;
  items: Item[];
};

type UnknownRecord = Record<string, unknown>;

const emptyLocalized = (): Localized => ({ en: '', de: '', uk: '', ru: '', sk: '', fr: '' });

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? value as UnknownRecord : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeLocalized(value: unknown): Localized {
  const data = asRecord(value);
  return {
    en: asString(data.en),
    de: asString(data.de),
    uk: asString(data.uk),
    ru: asString(data.ru),
    sk: asString(data.sk),
    fr: asString(data.fr),
  };
}

function normalizeItem(value: unknown): Item {
  const item = asRecord(value);
  return {
    id: asString(item.id) || undefined,
    code: asString(item.code),
    name: normalizeLocalized(item.name),
    price: asString(item.price),
    note: normalizeLocalized(item.note),
    sortOrder: asNumber(item.sortOrder),
    active: typeof item.active === 'boolean' ? item.active : true,
  };
}

function normalizeSection(value: unknown): Section {
  const section = asRecord(value);
  return {
    id: asString(section.id) || undefined,
    number: asString(section.number),
    title: normalizeLocalized(section.title),
    subtitle: normalizeLocalized(section.subtitle),
    sortOrder: asNumber(section.sortOrder),
    active: typeof section.active === 'boolean' ? section.active : true,
    items: Array.isArray(section.items) ? section.items.map(normalizeItem) : [],
  };
}

export function PriceSpreadsheet({ initialSections }: { initialSections: unknown[] }) {
  const [sections, setSections] = useState<Section[]>(initialSections.map(normalizeSection));
  const [language, setLanguage] = useState<Locale>('en');
  const [deletedSectionIds, setDeletedSectionIds] = useState<string[]>([]);
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  function updateSection(index: number, patch: Partial<Section>) {
    setSections((current) => current.map((section, itemIndex) => itemIndex === index ? { ...section, ...patch } : section));
  }

  function updateSectionText(index: number, field: 'title' | 'subtitle', value: string) {
    setSections((current) => current.map((section, itemIndex) => itemIndex === index
      ? { ...section, [field]: { ...section[field], [language]: value } }
      : section));
  }

  function updateItem(sectionIndex: number, itemIndex: number, patch: Partial<Item>) {
    setSections((current) => current.map((section, index) => index !== sectionIndex ? section : {
      ...section,
      items: section.items.map((item, indexInSection) => indexInSection === itemIndex ? { ...item, ...patch } : item),
    }));
  }

  function updateItemText(sectionIndex: number, itemIndex: number, field: 'name' | 'note', value: string) {
    setSections((current) => current.map((section, index) => index !== sectionIndex ? section : {
      ...section,
      items: section.items.map((item, indexInSection) => indexInSection === itemIndex
        ? { ...item, [field]: { ...item[field], [language]: value } }
        : item),
    }));
  }

  function addSection() {
    setSections((current) => [...current, {
      number: String(current.length + 1).padStart(2, '0'),
      title: emptyLocalized(),
      subtitle: emptyLocalized(),
      sortOrder: current.length,
      active: true,
      items: [],
    }]);
  }

  function deleteSection(index: number) {
    const section = sections[index];
    if (section.id) setDeletedSectionIds((ids) => [...new Set([...ids, section.id as string])]);
    const itemIds = section.items.flatMap((item) => item.id ? [item.id] : []);
    if (itemIds.length) setDeletedItemIds((ids) => [...new Set([...ids, ...itemIds])]);
    setSections((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function addItem(sectionIndex: number) {
    setSections((current) => current.map((section, index) => index === sectionIndex ? {
      ...section,
      items: [...section.items, {
        code: '',
        name: emptyLocalized(),
        price: '',
        note: emptyLocalized(),
        sortOrder: section.items.length,
        active: true,
      }],
    } : section));
  }

  function deleteItem(sectionIndex: number, itemIndex: number) {
    const item = sections[sectionIndex].items[itemIndex];
    if (item.id) setDeletedItemIds((ids) => [...new Set([...ids, item.id as string])]);
    setSections((current) => current.map((section, index) => index === sectionIndex
      ? { ...section, items: section.items.filter((_, indexInSection) => indexInSection !== itemIndex) }
      : section));
  }

  async function save() {
    setBusy(true);
    setMessage('Saving all prices…');
    const payload = {
      sections: sections.map((section, sectionIndex) => ({
        ...section,
        sortOrder: sectionIndex,
        items: section.items.map((item, itemIndex) => ({ ...item, sortOrder: itemIndex })),
      })),
      deletedSectionIds,
      deletedItemIds,
    };

    try {
      const response = await fetch('/api/admin/prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        const data = asRecord(result);
        const error = typeof data.error === 'string'
          ? data.error
          : 'Please check required fields, translations and unique service codes.';
        throw new Error(error);
      }
      if (!Array.isArray(result)) throw new Error('The server returned an unexpected response.');
      setSections(result.map(normalizeSection));
      setDeletedSectionIds([]);
      setDeletedItemIds([]);
      setMessage('All price changes were saved. The public website now uses the updated table.');
    } catch (error) {
      setMessage(`Could not save: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="price-admin">
      <div className="price-admin__sticky panel">
        <div className="translation-tabs" role="tablist" aria-label="Price translation language">
          {locales.map((locale) => (
            <button type="button" role="tab" aria-selected={language === locale} key={locale} className={language === locale ? 'is-active' : ''} onClick={() => setLanguage(locale)}>
              {locale.toUpperCase()}
            </button>
          ))}
        </div>
        <div>
          <button type="button" className="admin-secondary" onClick={addSection}><Plus aria-hidden="true" size={17} />Add section</button>
          <button type="button" className="admin-primary" onClick={save} disabled={busy}><Save aria-hidden="true" size={17} />Save all changes</button>
        </div>
      </div>

      {sections.map((section, sectionIndex) => (
        <section className="panel price-sheet-section" key={section.id ?? `new-${sectionIndex}`}>
          <header>
            <input className="price-section-number" value={section.number} onChange={(event) => updateSection(sectionIndex, { number: event.target.value })} aria-label="Section number" />
            <div>
              <input className="price-section-title" value={section.title[language]} onChange={(event) => updateSectionText(sectionIndex, 'title', event.target.value)} placeholder={`Section title (${language.toUpperCase()})`} />
              <input value={section.subtitle[language]} onChange={(event) => updateSectionText(sectionIndex, 'subtitle', event.target.value)} placeholder={`Section subtitle (${language.toUpperCase()})`} />
            </div>
            <label className="admin-checkbox"><input type="checkbox" checked={section.active} onChange={(event) => updateSection(sectionIndex, { active: event.target.checked })} />Active</label>
            <button type="button" className="icon-danger" title="Delete section" onClick={() => deleteSection(sectionIndex)}><Trash2 aria-hidden="true" size={18} /></button>
          </header>

          <div className="price-sheet-table-wrap">
            <table className="price-sheet-table">
              <thead><tr><th>Code</th><th>Service name ({language.toUpperCase()})</th><th>Price</th><th>Note ({language.toUpperCase()})</th><th>Active</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {section.items.map((item, itemIndex) => (
                  <tr key={item.id ?? `new-item-${itemIndex}`}>
                    <td><input value={item.code} onChange={(event) => updateItem(sectionIndex, itemIndex, { code: event.target.value.toUpperCase() })} /></td>
                    <td><textarea rows={2} value={item.name[language]} onChange={(event) => updateItemText(sectionIndex, itemIndex, 'name', event.target.value)} /></td>
                    <td><input value={item.price} onChange={(event) => updateItem(sectionIndex, itemIndex, { price: event.target.value })} /></td>
                    <td><textarea rows={2} value={item.note[language]} onChange={(event) => updateItemText(sectionIndex, itemIndex, 'note', event.target.value)} /></td>
                    <td><input aria-label={`Active ${item.code || 'service'}`} type="checkbox" checked={item.active} onChange={(event) => updateItem(sectionIndex, itemIndex, { active: event.target.checked })} /></td>
                    <td><button type="button" className="icon-danger" title="Delete service" onClick={() => deleteItem(sectionIndex, itemIndex)}><Trash2 aria-hidden="true" size={17} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="admin-add-row" onClick={() => addItem(sectionIndex)}><Plus aria-hidden="true" size={17} />Add service row</button>
        </section>
      ))}
      <p className="admin-message" aria-live="polite">{message}</p>
    </div>
  );
}
