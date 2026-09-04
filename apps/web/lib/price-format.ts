export function localizedPrice(value: string, locale: string) {
  const replacements: Record<string, Array<[RegExp, string]>> = {
    en: [[/^от /, 'from '], [/\/час/g, '/hour'], [/\/месяц/g, '/month'], [/ за модуль/g, ' per module'], [/ \/ товар/g, ' / item'], [/ \/ предмет/g, ' / item'], [/ \/ фото/g, ' / photo'], [/ в одну сторону/g, ' one way'], [/от суммы/g, 'of the amount'], [/мин\./g, 'min.'], [/\/км/g, '/km'], [/^(\d+),(\d+) \€\/km$/, '$1.$2 €/km']],
    de: [[/^от /, 'ab '], [/\/час/g, '/Std.'], [/\/месяц/g, '/Monat'], [/ за модуль/g, ' pro Modul'], [/ \/ товар/g, ' / Artikel'], [/ \/ предмет/g, ' / Objekt'], [/ \/ фото/g, ' / Foto'], [/ в одну сторону/g, ' einfache Fahrt'], [/от суммы/g, 'des Betrags'], [/мин\./g, 'mind.'], [/\/км/g, '/km']],
    uk: [[/^от /, 'від '], [/\/час/g, '/год'], [/\/месяц/g, '/місяць'], [/ за модуль/g, ' за модуль'], [/ \/ товар/g, ' / товар'], [/ \/ предмет/g, ' / предмет'], [/ \/ фото/g, ' / фото'], [/ в одну сторону/g, ' в один бік'], [/от суммы/g, 'від суми'], [/мин\./g, 'мін.'], [/\/км/g, '/км']],
    ru: [],
    sk: [[/^от /, 'od '], [/\/час/g, '/hod.'], [/\/месяц/g, '/mesiac'], [/ за модуль/g, ' za modul'], [/ \/ товар/g, ' / položka'], [/ \/ предмет/g, ' / predmet'], [/ \/ фото/g, ' / fotografia'], [/ в одну сторону/g, ' jedným smerom'], [/от суммы/g, 'zo sumy'], [/мин\./g, 'min.'], [/\/км/g, '/km']],
    fr: [[/^от /, 'à partir de '], [/\/час/g, '/heure'], [/\/месяц/g, '/mois'], [/ за модуль/g, ' par module'], [/ \/ товар/g, ' / article'], [/ \/ предмет/g, ' / objet'], [/ \/ фото/g, ' / photo'], [/ в одну сторону/g, ' aller simple'], [/от суммы/g, 'du montant'], [/мин\./g, 'min.'], [/\/км/g, '/km']],
  };
  return (replacements[locale] ?? replacements.en).reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), value);
}
