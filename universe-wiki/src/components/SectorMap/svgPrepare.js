// Подготовка текста map.svg ДО того, как он попадёт на страницу.
// Для каждой звезды, у которой ещё нет статьи, мы:
//   1) рисуем красный оверлей строго по центру её хитбокса;
//   2) помечаем сам хитбокс классом "no-article" (чтобы он не был кликабельным).
// Это делается над текстом, а не над живым DOM, поэтому React
// не может "стереть" результат при перерисовке.

const OVERLAY_SIZE = 80; // размер оверлея из Figma (80x80)
const TEMPLATE_ID = 'noArticleTemplate';

// Оверлей из Figma (без clip-path — он был нужен только самой Figma)
const OVERLAY_TEMPLATE = `<g id="${TEMPLATE_ID}">
<rect width="80" height="80" fill="#FF0000" fill-opacity="0.15"/>
<path d="M0 48H3V77H32V80H0V48ZM80 80H48V77H77V48H80V80ZM32 0V3H3V32H0V0H32ZM80 32H77V3H48V0H80V32Z" fill="#FF0000"/>
<path d="M9.14474 73.1579L8 72.0132V64H10.2895L14.8684 68.5789V64H17.1579V73.1579H14.8684V72.0132L10.2895 67.4342V73.1579H9.14474Z" fill="#FF0000" fill-opacity="0.76"/>
<path d="M25.1711 70.8684V66.2895H20.5921V70.8684H25.1711ZM19.4474 73.1579L18.3026 72.0132V65.1447L19.4474 64H26.3158L27.4605 65.1447V72.0132L26.3158 73.1579H19.4474Z" fill="#FF0000" fill-opacity="0.76"/>
<path d="M40.0526 70.8684V66.2895H35.4737V70.8684H40.0526ZM33.1842 73.1579V64H41.1974L42.3421 65.1447V72.0132L41.1974 73.1579H33.1842Z" fill="#FF0000" fill-opacity="0.76"/>
<path d="M50.3553 68.5789V66.2895H45.7763V68.5789H50.3553ZM43.4868 73.1579V65.1447L44.6316 64H51.5L52.6447 65.1447V73.1579H50.3553V70.8684H45.7763V73.1579H43.4868Z" fill="#FF0000" fill-opacity="0.76"/>
<path d="M57.2237 73.1579V66.2895H53.7895V64H62.9474V66.2895H59.5132V73.1579H57.2237Z" fill="#FF0000" fill-opacity="0.76"/>
<path d="M70.9605 68.5789V66.2895H66.3816V68.5789H70.9605ZM64.0921 73.1579V65.1447L65.2368 64H72.1053L73.25 65.1447V73.1579H70.9605V70.8684H66.3816V73.1579H64.0921Z" fill="#FF0000" fill-opacity="0.76"/>
<path d="M60.5178 19.5061L44.4197 40.0122L60.5178 60.5183L40.0117 44.4202L19.5056 60.5183L35.6037 40.0122L19.5056 19.5061L40.0117 35.6042L60.5178 19.5061Z" fill="#FF0000"/>
</g>`;

// Границы пути (bbox) из атрибута d. Хитбоксы звёзд — квадраты из команд M/H/V/L/Z.
function pathBBox(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+/g) || [];
  let cmd = null;
  let x = 0;
  let y = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const add = () => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  };

  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (/[a-zA-Z]/.test(t)) {
      cmd = t;
      i += 1;
    } else if (cmd === 'M' || cmd === 'L') {
      x = parseFloat(tokens[i]);
      y = parseFloat(tokens[i + 1]);
      i += 2;
      add();
      if (cmd === 'M') cmd = 'L';
    } else if (cmd === 'H') {
      x = parseFloat(t);
      i += 1;
      add();
    } else if (cmd === 'V') {
      y = parseFloat(t);
      i += 1;
      add();
    } else {
      return null; // неизвестная команда — не рискуем
    }
  }

  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
}

/**
 * @param {string} rawSvg     исходный текст map.svg
 * @param {(name: string) => boolean} hasArticle  есть ли у звезды статья
 */
export function prepareSvg(rawSvg, hasArticle) {
  if (!rawSvg) return rawSvg;

  const starsStart = rawSvg.indexOf('<g id="Hitboxes">');
  const consStart = rawSvg.indexOf('<g id="Hitboxes_constellations">');
  if (starsStart === -1) return rawSvg;

  const starsEnd = rawSvg.indexOf('</g>', starsStart);
  if (starsEnd === -1) return rawSvg;

  const uses = [];

  const newStarsBlock = rawSvg
    .slice(starsStart, starsEnd)
    .replace(/<path id="(hitbox[_-])([^"]+)" d="([^"]+)"/g, (full, prefix, name, d) => {
      if (hasArticle(name)) return full; // статья есть — звезда остаётся как есть

      const box = pathBBox(d);
      if (!box) {
        console.warn('Не удалось вычислить центр хитбокса звезды:', name);
        return full;
      }

      const cx = (box.minX + box.maxX) / 2;
      const cy = (box.minY + box.maxY) / 2;
      const x = +(cx - OVERLAY_SIZE / 2).toFixed(2);
      const y = +(cy - OVERLAY_SIZE / 2).toFixed(2);

      uses.push(`<use href="#${TEMPLATE_ID}" class="noarticle-overlay" x="${x}" y="${y}"/>`);
      return `<path class="no-article" id="${prefix}${name}" d="${d}"`;
    });

  if (uses.length === 0) {
    return rawSvg.slice(0, starsStart) + newStarsBlock + rawSvg.slice(starsEnd);
  }

  const overlayGroup =
    `<g id="NoArticleOverlays" pointer-events="none">` +
    `<defs>${OVERLAY_TEMPLATE}</defs>` +
    uses.join('') +
    `</g>`;

  // Оверлеи кладём прямо перед слоями хитбоксов — выше названий и звёзд
  const insertAt = consStart !== -1 ? Math.min(consStart, starsStart) : starsStart;

  const rebuilt = rawSvg.slice(0, starsStart) + newStarsBlock + rawSvg.slice(starsEnd);
  return rebuilt.slice(0, insertAt) + overlayGroup + rebuilt.slice(insertAt);
}
