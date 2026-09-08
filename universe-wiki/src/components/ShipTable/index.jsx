import React, {useEffect, useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {usePluginData} from '@docusaurus/useGlobalData';
import styles from './styles.module.css';

const STORAGE_KEY = 'noosphere-ship-table-columns-v1';

// Порядок «редкости» маркеров профильных особенностей — используется,
// чтобы показать в бейдже самый значимый маркер корабля.
const FEATURE_RANK = ['🟢', '🟡', '🔴', '🟣', '💀'];

function topFeatureMarker(features) {
  let best = -1;
  for (const f of features) {
    const marker = f.slice(0, 2).trim();
    const idx = FEATURE_RANK.indexOf(marker);
    if (idx > best) best = idx;
  }
  return best >= 0 ? FEATURE_RANK[best] : '—';
}

function numericValue(str) {
  if (!str) return null;
  const digits = str.replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : null;
}

const CATEGORY_LABELS_FALLBACK = {
  'small-tonnage-ships': 'Малый тоннаж',
  'medium-tonnage-ships': 'Средний тоннаж',
  'capital-ships': 'Капитальные',
};

// Специальные псевдо-столбцы, не входящие в fields из инфобокса.
const EXTRA_COLUMNS = [
  {key: 'cost', label: 'Цена'},
  {key: 'features', label: 'Особ.'},
];

function loadStoredColumns() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (e) {
    return null;
  }
}

function saveStoredColumns(keys) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch (e) {
    // localStorage может быть недоступен (приватный режим и т.п.) — не критично
  }
}

function ShipThumb({ship}) {
  const src = useBaseUrl(ship.image || '');
  if (!ship.image) return <div className={styles.thumbPlaceholder} />;
  return <img src={src} alt="" className={styles.thumb} />;
}

function IconText({value, icon}) {
  const src = useBaseUrl(icon || '');
  if (value === null || value === undefined) return <span>—</span>;
  return (
    <span className={styles.iconText}>
      {icon && <img src={src} alt="" className={styles.icon} />}
      {value}
    </span>
  );
}

function FeaturesBadge({features}) {
  if (!features || features.length === 0) return <span>—</span>;
  const marker = topFeatureMarker(features);
  return (
    <span className={styles.tooltipWrap}>
      <span className={styles.badge}>{marker}</span>
      <span className={styles.tooltip}>
        {features.map((f, i) => (
          <React.Fragment key={i}>
            {f}
            {i < features.length - 1 && <br />}
          </React.Fragment>
        ))}
      </span>
    </span>
  );
}

export default function ShipTable() {
  const {ships, categories, fieldMeta} = usePluginData('docusaurus-plugin-ship-table');

  // Все доступные столбцы (характеристики из инфобокса + цена/особенности)
  const allColumns = useMemo(() => [...(fieldMeta || []), ...EXTRA_COLUMNS], [fieldMeta]);
  const allColumnKeys = useMemo(() => allColumns.map((c) => c.key), [allColumns]);

  const [visibleKeys, setVisibleKeys] = useState(allColumnKeys);
  const [columnsPanelOpen, setColumnsPanelOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(1);

  // Подхватываем сохранённый выбор столбцов один раз после монтирования
  useEffect(() => {
    const stored = loadStoredColumns();
    if (stored) {
      // отфильтровываем ключи, которых больше не существует (например,
      // characteristic переименовали) — иначе получим пустые столбцы
      const filtered = stored.filter((k) => allColumnKeys.includes(k));
      if (filtered.length) setVisibleKeys(filtered);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleColumn(key) {
    setVisibleKeys((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      saveStoredColumns(next);
      return next;
    });
  }

  function resetColumns() {
    setVisibleKeys(allColumnKeys);
    saveStoredColumns(allColumnKeys);
  }

  const visibleColumns = useMemo(
    () => allColumns.filter((c) => visibleKeys.includes(c.key)),
    [allColumns, visibleKeys]
  );

  function getShipField(ship, key) {
    return ship.fields.find((f) => f.key === key) || null;
  }

  function sortAccessor(ship, key) {
    if (key === 'cost') return numericValue(ship.cost);
    if (key === 'features') return ship.features.length;
    const field = getShipField(ship, key);
    if (!field) return null;
    // тоннаж/специализация — текстовые, остальное числовое
    if (key === 'tonnage' || key === 'specialization' || key === 'manufacturer') {
      return field.value;
    }
    return numericValue(field.value);
  }

  const categoryList = useMemo(() => Object.entries(categories || {}), [categories]);

  const filtered = useMemo(() => {
    let list = ships || [];
    if (category !== 'all') {
      list = list.filter((s) => s.category === category);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((s) => {
        const manufacturer = getShipField(s, 'manufacturer');
        const specialization = getShipField(s, 'specialization');
        return (
          s.name.toLowerCase().includes(q) ||
          (manufacturer && manufacturer.value && manufacturer.value.toLowerCase().includes(q)) ||
          (specialization && specialization.value && specialization.value.toLowerCase().includes(q))
        );
      });
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const va = sortAccessor(a, sortKey);
        const vb = sortAccessor(b, sortKey);
        if (va === null || va === undefined || va === '') return 1;
        if (vb === null || vb === undefined || vb === '') return -1;
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sortDir;
        return String(va).localeCompare(String(vb), 'ru') * sortDir;
      });
    }
    return list;
  }, [ships, category, query, sortKey, sortDir]);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => -d);
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  }

  if (!ships) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <input
          type="text"
          className={styles.search}
          placeholder="Поиск по названию, производителю, специализации…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className={styles.tabs}>
          <button
            className={category === 'all' ? styles.tabActive : styles.tab}
            onClick={() => setCategory('all')}
          >
            Все ({(ships || []).length})
          </button>
          {categoryList.map(([key, label]) => {
            const count = (ships || []).filter((s) => s.category === key).length;
            if (!count) return null;
            return (
              <button
                key={key}
                className={category === key ? styles.tabActive : styles.tab}
                onClick={() => setCategory(key)}
              >
                {CATEGORY_LABELS_FALLBACK[key] || label} ({count})
              </button>
            );
          })}
        </div>
        <div className={styles.columnsMenu}>
          <button className={styles.tab} onClick={() => setColumnsPanelOpen((v) => !v)}>
            Столбцы ▾
          </button>
          {columnsPanelOpen && (
            <div className={styles.columnsPanel}>
              {allColumns.map((col) => (
                <label key={col.key} className={styles.columnOption}>
                  <input
                    type="checkbox"
                    checked={visibleKeys.includes(col.key)}
                    onChange={() => toggleColumn(col.key)}
                  />
                  {col.label}
                </label>
              ))}
              <button className={styles.resetBtn} onClick={resetColumns}>
                Показать все
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th></th>
              <th onClick={() => handleSort('name')} className={styles.th}>
                Название
                {sortKey === 'name' && <span className={styles.sortArrow}>{sortDir === 1 ? ' ▲' : ' ▼'}</span>}
              </th>
              {visibleColumns.map((col) => (
                <th key={col.key} onClick={() => handleSort(col.key)} className={styles.th}>
                  {col.label}
                  {sortKey === col.key && (
                    <span className={styles.sortArrow}>{sortDir === 1 ? ' ▲' : ' ▼'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((ship) => (
              <tr key={ship.id}>
                <td className={styles.thumbCell}>
                  <ShipThumb ship={ship} />
                </td>
                <td className={styles.nameCell}>
                  <Link to={ship.slug}>{ship.name}</Link>
                </td>
                {visibleColumns.map((col) => {
                  if (col.key === 'cost') {
                    return <td key={col.key}>{ship.cost || '—'}</td>;
                  }
                  if (col.key === 'features') {
                    return (
                      <td key={col.key}>
                        <FeaturesBadge features={ship.features} />
                      </td>
                    );
                  }
                  const field = getShipField(ship, col.key);
                  return (
                    <td key={col.key}>
                      <IconText value={field ? field.value : null} icon={field ? field.icon : null} />
                    </td>
                  );
                })}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={visibleColumns.length + 2} className={styles.empty}>
                  Ничего не найдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
