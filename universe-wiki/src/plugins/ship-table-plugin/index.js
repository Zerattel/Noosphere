const fs = require('fs');
const path = require('path');

const VEHICLES_DIR = path.join('docs', 'lore', 'vehicles');

// Категории, которые попадают в таблицу кораблей, и их порядок.
// Чтобы добавить/убрать категорию — просто отредактируйте этот список.
// Категории, которых здесь нет (например apparats, ground-vehicles),
// в таблицу не попадают, даже если внутри лежат статьи с тем же шаблоном.
const ALLOWED_CATEGORIES = [
  'small-tonnage-ships',
  'medium-tonnage-ships',
  'capital-ships',
];

// Канонический порядок характеристик корабля (соответствует порядку
// строк в инфобоксе статьи). key используется как идентификатор столбца
// на фронтенде.
const FIELD_KEYS = [
  ['Тоннаж', 'tonnage'],
  ['Специализация', 'specialization'],
  ['Производитель', 'manufacturer'],
  ['Внешн. ОМ', 'extSlots'],
  ['Инжен. ОМ', 'engSlots'],
  ['Конденсатор', 'capacitor'],
  ['Генерация', 'regen'],
  ['Маса', 'mass'],
  ['Сигнатура', 'signature'],
  ['Корпус', 'hull'],
  ['Броня', 'armor'],
  ['Барьер', 'shield'],
];

function firstImgSrc(html) {
  if (!html) return null;
  const m = html.match(/require\(\s*['"]@site\/(static\/img\/[^'"]+)['"]\s*\)/);
  return m ? '/' + m[1].replace(/^static\//, '') : null;
}

function extractText(html) {
  if (!html) return '';
  return html
    // markdown-ссылки вида [Текст](путь) -> Текст
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // все теги/JSX-компоненты
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p, out);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(p);
    }
  }
}

function readCategoryLabel(dir) {
  try {
    const raw = fs.readFileSync(path.join(dir, '_category_.json'), 'utf-8');
    const json = JSON.parse(raw);
    return json.label || null;
  } catch (e) {
    return null;
  }
}

/**
 * Парсит один файл корабля, построенный по стандартному шаблону
 * (<div className="sci-fi-infobox">...). Файлы без этого блока пропускаются,
 * поэтому обычные лор-статьи не мешают.
 *
 * Важно: характеристики (infobox-label/infobox-value) ищутся по всему
 * файлу целиком, без попытки сначала «вырезать» блок infobox-grid отдельной
 * регуляркой — так парсинг не зависит от количества пробелов/переносов
 * строк перед закрывающими тегами, которое может отличаться от статьи
 * к статье.
 */
function parseShipFile(filePath, docsDir, vehiclesDir) {
  const raw = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
  if (!raw.includes('sci-fi-infobox')) return null;

  const titleMatch = raw.match(/^#\s+(.+)$/m);
  const name = titleMatch ? titleMatch[1].trim() : path.basename(filePath, '.md');

  const imageTagMatch = raw.match(/<img\s+src=\{require\(\s*['"]@site\/static\/img\/vehicles[^}]*\}\s*\/>/);
  const image = imageTagMatch ? firstImgSrc(imageTagMatch[0]) : null;

  // Пары label/value ищем по всему файлу — они встречаются только внутри
  // infobox-grid, так что этого достаточно и это устойчивее к форматированию.
  const pairRe = /<div\s+className=(["'])infobox-label\1>([\s\S]*?)<\/div>\s*<div\s+className=(["'])infobox-value\3>([\s\S]*?)<\/div>/g;
  const fieldsByLabel = {};
  let m;
  while ((m = pairRe.exec(raw))) {
    const label = extractText(m[2]).replace(/:$/, '').trim();
    const valueHtml = m[4];
    const value = extractText(valueHtml).trim();
    const icon = firstImgSrc(valueHtml) || firstImgSrc(m[2]);
    fieldsByLabel[label] = {value, icon};
  }

  const fields = FIELD_KEYS.map(([label, key]) => ({
    key,
    label,
    value: fieldsByLabel[label] ? fieldsByLabel[label].value : null,
    icon: fieldsByLabel[label] ? fieldsByLabel[label].icon : null,
  }));

  const boxMatch = raw.match(/<div\s+className=(["'])sci-fi-box\1>([\s\S]*?)<\/div>/);
  let features = [];
  if (boxMatch) {
    features = boxMatch[2]
      .split(/<br\s*\/?>/)
      .map((s) => extractText(s))
      .filter((s) => s && !/^Профильные особенности/.test(s));
  }

  const costMatch = raw.match(/Стоимость:\s*([^\n<]+)/);
  const cost = costMatch ? costMatch[1].trim() : null;

  const relativeToDocs = path.relative(docsDir, filePath).replace(/\\/g, '/').replace(/\.md$/, '');
  const relativeToVehicles = path.relative(vehiclesDir, filePath).replace(/\\/g, '/').replace(/\.md$/, '');
  const category = relativeToVehicles.split('/')[0];

  return {
    id: relativeToVehicles,
    slug: '/' + relativeToDocs,
    category,
    name,
    image,
    fields,
    cost,
    features,
  };
}

module.exports = function shipTablePlugin(context) {
  const vehiclesDir = path.join(context.siteDir, VEHICLES_DIR);
  const docsDir = path.join(context.siteDir, 'docs');

  return {
    name: 'docusaurus-plugin-ship-table',

    async loadContent() {
      const fieldMeta = FIELD_KEYS.map(([label, key]) => ({key, label}));
      if (!fs.existsSync(vehiclesDir)) return {ships: [], categories: {}, fieldMeta};

      const files = [];
      walk(vehiclesDir, files);

      const ships = files
        .map((f) => parseShipFile(f, docsDir, vehiclesDir))
        .filter(Boolean)
        .filter((ship) => ALLOWED_CATEGORIES.includes(ship.category));

      const categories = {};
      for (const name of ALLOWED_CATEGORIES) {
        const dir = path.join(vehiclesDir, name);
        if (fs.existsSync(dir)) {
          categories[name] = readCategoryLabel(dir) || name;
        }
      }

      ships.sort((a, b) => {
        const ao = ALLOWED_CATEGORIES.indexOf(a.category);
        const bo = ALLOWED_CATEGORIES.indexOf(b.category);
        if (ao !== bo) return ao - bo;
        return a.name.localeCompare(b.name, 'ru');
      });

      return {ships, categories, fieldMeta};
    },

    async contentLoaded({content, actions}) {
      actions.setGlobalData(content);
    },

    getPathsToWatch() {
      return [path.join(VEHICLES_DIR, '**', '*.md')];
    },
  };
};
