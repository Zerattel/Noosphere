import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useHistory } from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useAllDocsData } from '@docusaurus/plugin-content-docs/client';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import clsx from 'clsx';
import styles from './styles.module.css';
import mapData from './mapData.json';
import { preloadSounds, playSound, unlockAudio } from './soundManager';
import { prepareSvg } from './svgPrepare';

// --- Настройки (можно крутить) ---
const HOVER_DELAY = 500;      // мс до появления тултипа (мышь)
const FIT_RATIO = 0.86;       // какую часть свободной области займёт созвездие
const MIN_SCALE = 1;
const MAX_SCALE = 10;         // должно совпадать с maxScale у TransformWrapper
const TAP_SLOP = 12;          // px: сдвиг пальца, после которого касание считается перетаскиванием
const TOOLTIP_W = 245;        // примерные размеры тултипа — нужны, чтобы он не вылезал за край
const TOOLTIP_BOTTOM_SPACE = 80;
const TOOLTIP_TOP_SPACE = 46;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function SectorMap() {
  const history = useHistory();
  const mapUrl = useBaseUrl('/img/map.svg');
  const systemsBase = useBaseUrl('/lore/systems/').replace(/\/+$/, ''); // без слэша на конце

  // Звуки (файлы лежат в static/sounds/)
  const hoverSounds = [
    useBaseUrl('/sounds/me_map_hover_01.wav'),
    useBaseUrl('/sounds/me_map_hover_02.wav'),
    useBaseUrl('/sounds/me_map_hover_03.wav'),
  ];
  const warpSoundUrl = useBaseUrl('/sounds/map_warp_01.wav');
  const zoomInSoundUrl = useBaseUrl('/sounds/map_zoomin_0.wav');
  const zoomOutSoundUrl = useBaseUrl('/sounds/map_zoomout_0.wav');

  const [svgRaw, setSvgRaw] = useState('');
  const [currentZoomLevel, setCurrentZoomLevel] = useState('sector');
  const [activeConstellation, setActiveConstellation] = useState(null);
  const [isWarping, setIsWarping] = useState(false);
  const [panelLayout, setPanelLayout] = useState(null); // где и какого размера боковая панель

  // Рефы
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const transformRef = useRef(null);
  const tooltipRef = useRef(null);
  const tooltipTitleRef = useRef(null);
  const tooltipDescRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const warpTimerRef = useRef(null);
  const hoveredRef = useRef(null);            // { key, target, category, name }
  const hoverSoundIdxRef = useRef(0);         // для зацикливания звуков наведения
  const lastPointerTypeRef = useRef(null);    // 'mouse' | 'touch' | 'pen'
  const pointerDownRef = useRef(null);        // где началось касание
  const lastSizeRef = useRef({ w: 0, h: 0 });

  // --- Какие звёзды имеют статью (определяем автоматически по папке docs/lore/systems) ---
  const allDocsData = useAllDocsData();
  const articlePaths = useMemo(() => {
    const set = new Set();
    Object.values(allDocsData || {}).forEach((plugin) => {
      (plugin.versions || []).forEach((version) => {
        (version.docs || []).forEach((doc) => {
          set.add(doc.path.replace(/\/+$/, '').toLowerCase());
        });
      });
    });
    return set;
  }, [allDocsData]);

  const hasArticle = (name) => articlePaths.has(`${systemsBase}/${name}`.toLowerCase());

  // --- Загрузка карты и подготовка оверлеев ---
  useEffect(() => {
    fetch(mapUrl)
      .then((res) => res.text())
      .then((text) => setSvgRaw(text))
      .catch((err) => console.error('Ошибка загрузки карты:', err));
  }, [mapUrl]);

  const svgContent = useMemo(
    () => prepareSvg(svgRaw, hasArticle),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [svgRaw, articlePaths, systemsBase]
  );

  // --- Предзагрузка звуков ---
  useEffect(() => {
    preloadSounds([...hoverSounds, warpSoundUrl, zoomInSoundUrl, zoomOutSoundUrl]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Уборка таймеров при уходе со страницы ---
  useEffect(
    () => () => {
      clearTimeout(hoverTimerRef.current);
      clearTimeout(warpTimerRef.current);
    },
    []
  );

  // --- Хелперы по хитбоксам ---
  const getHitboxTarget = (element) => element?.closest('[id^="hitbox_"], [id^="hitbox-"]');

  const getHitboxCategory = (hitboxEl) => {
    if (!hitboxEl) return null;
    if (hitboxEl.closest('#Hitboxes_constellations')) return 'constellation';
    if (hitboxEl.closest('#Hitboxes')) return 'system';
    return null;
  };

  const getHitboxName = (hitboxEl) => hitboxEl.id.replace(/^hitbox[_-]/, '');

  // Наводиться/нажимать можно только на то, что соответствует текущему масштабу
  const isValidForLevel = (category) =>
    (category === 'system' && currentZoomLevel === 'constellation') ||
    (category === 'constellation' && currentZoomLevel === 'sector');

  // --- Звук наведения: по кругу 1 → 2 → 3 → 1 ... ---
  const playHoverSound = () => {
    const url = hoverSounds[hoverSoundIdxRef.current % hoverSounds.length];
    hoverSoundIdxRef.current += 1;
    playSound(url, 0.5);
  };

  // --- Тултип ---
  const positionTooltip = (clientX, clientY) => {
    const tip = tooltipRef.current;
    const wrap = wrapperRef.current;
    if (!tip || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x = Math.min(clientX - rect.left + 25, rect.width - TOOLTIP_W - 8);
    const y = clamp(clientY - rect.top - 35, TOOLTIP_TOP_SPACE, rect.height - TOOLTIP_BOTTOM_SPACE);
    tip.style.transform = `translate(${Math.max(x, 8)}px, ${y}px)`;
  };

  const hideTooltip = () => {
    clearTimeout(hoverTimerRef.current);
    if (tooltipRef.current) {
      tooltipRef.current.classList.remove(styles.tooltipVisible);
    }
  };

  const clearHighlight = () => {
    const hovered = hoveredRef.current;
    if (!hovered || hovered.category !== 'constellation') return;
    const customView = document.querySelector(`#constellation_view_${hovered.name}`);
    if (customView) customView.classList.remove(styles.highlightedConstellation);
    hovered.target.classList.remove(styles.highlightedHitbox);
  };

  const resetHover = () => {
    clearHighlight();
    hideTooltip();
    hoveredRef.current = null;
  };

  // Начать "наведение" на объект (для мыши — с задержкой, для касания — сразу)
  const activateHover = (target, category, name, immediate = false) => {
    const key = `${category}_${name}`;
    if (hoveredRef.current && hoveredRef.current.key === key) return;

    resetHover();
    hoveredRef.current = { key, target, category, name };

    if (category === 'constellation') {
      const customView = document.querySelector(`#constellation_view_${name}`);
      if (customView) customView.classList.add(styles.highlightedConstellation);
      else target.classList.add(styles.highlightedHitbox);
    }

    const data = mapData[(category === 'system' ? 'system_' : 'constellations_') + name];
    if (!data) return;

    const showTooltip = () => {
      if (!hoveredRef.current || hoveredRef.current.key !== key) return; // курсор уже ушёл
      if (!tooltipRef.current || !tooltipTitleRef.current || !tooltipDescRef.current) return;
      tooltipTitleRef.current.innerText = data.title;
      tooltipDescRef.current.innerText = data.description;
      tooltipRef.current.classList.add(styles.tooltipVisible);
      playHoverSound();
    };

    if (immediate) showTooltip();
    else hoverTimerRef.current = setTimeout(showTooltip, HOVER_DELAY);
  };

  // --- Наведение мышью ---
  const handleMouseMove = (event) => {
    // Эмулированные браузером "мышиные" события после касания игнорируем
    if (isWarping || lastPointerTypeRef.current === 'touch') return;

    positionTooltip(event.clientX, event.clientY);

    const target = getHitboxTarget(event.target);
    const category = getHitboxCategory(target);

    if (!target || !category || !isValidForLevel(category)) {
      if (hoveredRef.current) resetHover();
      return;
    }

    activateHover(target, category, getHitboxName(target));
  };

  const handleMouseOut = () => {
    if (lastPointerTypeRef.current === 'touch') return;
    if (hoveredRef.current) resetHover();
  };

  // --- Камера: подогнать созвездие под экран ---
  // Созвездие вписывается в свободную область так, чтобы целиком помещаться
  // по меньшей стороне экрана. Остальное место занимает панель с описанием:
  //   широкий экран  -> панель сбоку (слева или справа, где больше места)
  //   узкий (телефон) -> панель снизу
  const focusConstellation = (target, animationMs = 800) => {
    const controls = transformRef.current;
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!controls || !wrapper || !content || !target) return;

    const W = wrapper.clientWidth;
    const H = wrapper.clientHeight;
    lastSizeRef.current = { w: W, h: H };

    // Положение хитбокса в "родных" координатах карты (без учёта текущего зума)
    const contentRect = content.getBoundingClientRect();
    const currentScale = contentRect.width / (content.offsetWidth || 1) || 1;
    const hitRect = target.getBoundingClientRect();
    const bx = (hitRect.left - contentRect.left) / currentScale;
    const by = (hitRect.top - contentRect.top) / currentScale;
    const bw = hitRect.width / currentScale;
    const bh = hitRect.height / currentScale;
    const cx = bx + bw / 2;
    const cy = by + bh / 2;

    let freeX = 0;
    let freeY = 0;
    let freeW = W;
    let freeH = H;
    let layout;

    if (W >= H) {
      // Широкий экран: панель сбоку
      const size = clamp(W * 0.26, 260, 420);
      const side = cx < content.offsetWidth / 2 ? 'right' : 'left';
      freeW = W - size;
      freeX = side === 'right' ? 0 : size;
      layout = { mode: 'side', side, size };
    } else {
      // Узкий экран: панель снизу
      const size = clamp(H * 0.34, 170, 300);
      freeH = H - size;
      layout = { mode: 'bottom', side: 'bottom', size };
    }

    const scale = clamp(
      Math.min((freeW * FIT_RATIO) / bw, (freeH * FIT_RATIO) / bh),
      MIN_SCALE,
      MAX_SCALE
    );
    const posX = freeX + freeW / 2 - cx * scale;
    const posY = freeY + freeH / 2 - cy * scale;

    setPanelLayout(layout);
    controls.setTransform(posX, posY, scale, animationMs);
  };

  // Если окно изменило размер (поворот телефона, resize) — пересчитываем кадр
  useEffect(() => {
    if (currentZoomLevel !== 'constellation' || !activeConstellation || isWarping) return undefined;

    let timer;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;
        const { w, h } = lastSizeRef.current;
        // игнорируем мелкие скачки высоты (адресная строка на телефонах)
        if (Math.abs(wrapper.clientWidth - w) < 2 && Math.abs(wrapper.clientHeight - h) < 80) return;
        const el = document.querySelector(
          `#Hitboxes_constellations [id="hitbox_${activeConstellation}"], #Hitboxes_constellations [id="hitbox-${activeConstellation}"]`
        );
        if (el) focusConstellation(el, 0);
      }, 150);
    };

    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentZoomLevel, activeConstellation, isWarping]);

  // --- Подтверждение выбора (клик мышью или второе касание) ---
  const confirmSelection = (target, category, name) => {
    if (category === 'constellation') {
      resetHover();
      playSound(zoomInSoundUrl);
      setActiveConstellation(name);
      setCurrentZoomLevel('constellation');
      focusConstellation(target, 800);
      return;
    }

    // Звезда: если статьи нет — звезда не кликабельна
    if (!hasArticle(name)) return;

    resetHover();
    transformRef.current?.zoomToElement(target, 8, 800, 'easeInQuad');
    setIsWarping(true);
    playSound(warpSoundUrl);

    warpTimerRef.current = setTimeout(() => {
      history.push(`${systemsBase}/${name}`);
    }, 800);
  };

  const handleClick = (event) => {
    if (isWarping) return;

    const isTouch = lastPointerTypeRef.current === 'touch';

    // Палец сдвинулся — это было перетаскивание карты, а не нажатие
    if (isTouch && pointerDownRef.current) {
      const dx = event.clientX - pointerDownRef.current.x;
      const dy = event.clientY - pointerDownRef.current.y;
      if (Math.hypot(dx, dy) > TAP_SLOP) return;
    }

    const target = getHitboxTarget(event.target);
    const category = getHitboxCategory(target);

    if (!target || !category || !isValidForLevel(category)) {
      if (isTouch && hoveredRef.current) resetHover(); // тык мимо — убираем подсказку
      return;
    }

    const name = getHitboxName(target);

    if (isTouch) {
      const key = `${category}_${name}`;
      if (!hoveredRef.current || hoveredRef.current.key !== key) {
        // Первое касание = "наведение": подсветка + тултип сразу
        positionTooltip(event.clientX, event.clientY);
        activateHover(target, category, name, true);
        return;
      }
      // Второе касание по тому же объекту = подтверждение
    }

    confirmSelection(target, category, name);
  };

  const handleBack = (resetTransform) => {
    playSound(zoomOutSoundUrl);
    resetTransform(800);
    setCurrentZoomLevel('sector');
    setActiveConstellation(null);
    setPanelLayout(null);
    resetHover();
  };

  // --- Панель с описанием созвездия ---
  const panelData = activeConstellation ? mapData[`constellations_${activeConstellation}`] : null;
  const showPanel = currentZoomLevel === 'constellation' && !isWarping && panelLayout && panelData;

  let panelClass = styles.infoPanelBottom;
  let panelStyle = { height: panelLayout ? panelLayout.size - 12 : undefined };
  if (panelLayout && panelLayout.mode === 'side') {
    panelClass = panelLayout.side === 'left' ? styles.infoPanelLeft : styles.infoPanelRight;
    panelStyle = { width: panelLayout.size - 16 };
  }

  return (
    <div
      ref={wrapperRef}
      className={clsx(styles.mapWrapper, isWarping && styles.warpActive)}
      onMouseMove={handleMouseMove}
      onMouseOut={handleMouseOut}
      onPointerDown={(e) => {
        lastPointerTypeRef.current = e.pointerType;
        pointerDownRef.current = { x: e.clientX, y: e.clientY };
        unlockAudio();
      }}
      onPointerMove={(e) => {
        lastPointerTypeRef.current = e.pointerType;
      }}
    >
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={MIN_SCALE}
        maxScale={MAX_SCALE}
        limitToBounds={true}
        doubleClick={{ disabled: true }}
      >
        {({ resetTransform }) => (
          <>
            {currentZoomLevel === 'constellation' && !isWarping && (
              <button className={styles.backButton} onClick={() => handleBack(resetTransform)}>
                ОТМЕНИТЬ ФОКУС
              </button>
            )}

            <TransformComponent wrapperClass={styles.transformWrapper}>
              <div
                ref={contentRef}
                // Динамически применяем класс для блокировки слоев
                className={clsx(
                  styles.svgContainer,
                  currentZoomLevel === 'sector' ? styles.viewLevelSector : styles.viewLevelConstellation
                )}
                data-active-constellation={activeConstellation || ''}
                onClick={handleClick}
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {showPanel && (
        <aside className={clsx(styles.infoPanel, panelClass)} style={panelStyle}>
          <div className={styles.infoPanelTitle}>{panelData.title}</div>
          <div className={styles.infoPanelDesc}>{panelData.description}</div>
        </aside>
      )}

      <div className={styles.tooltip} ref={tooltipRef}>
        <div className={styles.tooltipLine}></div>
        <div className={styles.tooltipContent}>
          <div className={styles.tooltipTitle} ref={tooltipTitleRef}></div>
          <div className={styles.tooltipDesc} ref={tooltipDescRef}></div>
        </div>
      </div>
    </div>
  );
}