import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import clsx from 'clsx';
import styles from './styles.module.css';
import mapData from './mapData.json';

export default function SectorMap() {
  const history = useHistory();
  const mapUrl = useBaseUrl('/img/map.svg');
  
  // Предзагрузка путей для аудио (положи файлы в static/sounds/)
  const hoverSounds = [
    useBaseUrl('/sounds/map_hover_1.wav'),
    useBaseUrl('/sounds/map_hover_2.wav'),
    useBaseUrl('/sounds/map_hover_3.wav'),
    useBaseUrl('/sounds/map_hover_4.wav'),
  ];
  const warpSoundUrl = useBaseUrl('/sounds/map_warp_01.wav');
  const zoomInSoundUrl = useBaseUrl('/sounds/map_zoomin_0.wav');
  const zoomOutSoundUrl = useBaseUrl('/sounds/map_zoomout_0.wav');
  
  const [svgContent, setSvgContent] = useState('');
  const [currentZoomLevel, setCurrentZoomLevel] = useState('sector'); 
  const [activeConstellation, setActiveConstellation] = useState(null);
  const [isWarping, setIsWarping] = useState(false);

  // Рефы для прямых DOM-манипуляций тултипа (убираем лаги анимаций карты)
  const tooltipRef = useRef(null);
  const tooltipTitleRef = useRef(null);
  const tooltipDescRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const currentHoverIdRef = useRef(null);

  useEffect(() => {
    fetch(mapUrl)
      .then((res) => res.text())
      .then((text) => setSvgContent(text))
      .catch((err) => console.error('Ошибка загрузки карты:', err));
  }, [mapUrl]);

  const getHitboxTarget = (element) => element?.closest('[id^="hitbox_"], [id^="hitbox-"]');

  const getHitboxCategory = (hitboxEl) => {
    if (!hitboxEl) return null;
    if (hitboxEl.closest('#Hitboxes_constellations')) return 'constellation';
    if (hitboxEl.closest('#Hitboxes')) return 'system';
    return null;
  };

  const getHitboxName = (hitboxEl) => hitboxEl.id.replace(/^hitbox[_-]/, '');

  const hideTooltip = () => {
    clearTimeout(hoverTimerRef.current);
    if (tooltipRef.current) {
      tooltipRef.current.classList.remove(styles.tooltipVisible);
    }
    currentHoverIdRef.current = null;
  };

  const playHoverSound = () => {
    const randomSound = hoverSounds[Math.floor(Math.random() * hoverSounds.length)];
    const audio = new Audio(randomSound);
    audio.volume = 0.5;
    audio.play().catch(() => {}); // Игнорируем ошибки автоплея браузера
  };

  const playZoomInSound = () => {
    new Audio(zoomInSoundUrl).play().catch(() => {});
  };

  const playZoomOutSound = () => {
    new Audio(zoomOutSoundUrl).play().catch(() => {});
  };

  const handleMouseMove = (event) => {
    if (isWarping) return;

    // Прямое обновление координат без ререндера React
    if (tooltipRef.current) {
      const rect = event.currentTarget.getBoundingClientRect();
      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;
      // Смещение вправо на 25px и вверх на 35px, как было задумано
      tooltipRef.current.style.transform = `translate(${cursorX + 25}px, ${cursorY - 35}px)`;
    }

    const target = getHitboxTarget(event.target);
    const category = getHitboxCategory(target);

    if (!target || !category) {
      hideTooltip();
      return;
    }

    const name = getHitboxName(target);
    const hitboxId = `${category}_${name}`;

    // Проверяем соответствие текущему уровню зума
    const isValidTarget = 
      (category === 'system' && currentZoomLevel === 'constellation') ||
      (category === 'constellation' && currentZoomLevel === 'sector');

    if (!isValidTarget) {
      hideTooltip();
      return;
    }

    // Если навели на новую цель (созвездие или звезду)
    if (currentHoverIdRef.current !== hitboxId) {
      hideTooltip(); // Скрываем предыдущий
      currentHoverIdRef.current = hitboxId;
      
      const dataKey = category === 'system' ? 'system_' + name : 'constellations_' + name;
      const data = mapData[dataKey];

      if (category === 'constellation') {
        const customView = document.querySelector(`#constellation_view_${name}`);
        if (customView) customView.classList.add(styles.highlightedConstellation);
        else target.classList.add(styles.highlightedHitbox);
      }

      if (data) {
        // Запускаем 1-секундную задержку
        hoverTimerRef.current = setTimeout(() => {
          if (tooltipTitleRef.current && tooltipDescRef.current && tooltipRef.current) {
            tooltipTitleRef.current.innerText = data.title;
            tooltipDescRef.current.innerText = data.description;
            tooltipRef.current.classList.add(styles.tooltipVisible);
            playHoverSound();
          }
        }, 500);
      }
    }
  };

  const handleMouseOut = (event) => {
    hideTooltip();
    const target = getHitboxTarget(event.target);
    const category = getHitboxCategory(target);

    if (target && category === 'constellation') {
      const name = getHitboxName(target);
      const customView = document.querySelector(`#constellation_view_${name}`);
      if (customView) customView.classList.remove(styles.highlightedConstellation);
      target.classList.remove(styles.highlightedHitbox);
    }
  };

  const handleClick = (event, zoomToElement) => {
    if (isWarping) return;
    
    const target = getHitboxTarget(event.target);
    const category = getHitboxCategory(target);
    if (!target || !category) return;

    const name = getHitboxName(target);

    if (category === 'constellation' && currentZoomLevel === 'sector') {
      setActiveConstellation(name);
      setCurrentZoomLevel('constellation');
      hideTooltip();
      playZoomInSound();

      if (zoomToElement) zoomToElement(target, 3, 800);

      // Показываем имена звёзд этого созвездия (см. пункт про constellationtitles)
      const titlesGroup = document.querySelector(`#titles_${name}`);
      if (titlesGroup) titlesGroup.classList.add(styles.activeTitles);
    }
    else if (category === 'system' && currentZoomLevel === 'constellation') {
      event.preventDefault();
      hideTooltip();

      if (zoomToElement) zoomToElement(target, 8, 800, 'easeInQuad');

      setIsWarping(true);

      const warpAudio = new Audio(warpSoundUrl);
      warpAudio.play().catch(() => {});

      setTimeout(() => {
        history.push(`/Noosphere/lore/systems/${name}`);
      }, 800);
    }
  };

  return (
    <div 
      className={clsx(
        styles.mapWrapper,
        isWarping && styles.warpActive
      )} 
      onMouseMove={handleMouseMove}
      onMouseOut={handleMouseOut}
    >
      <TransformWrapper 
        initialScale={1} 
        minScale={1} 
        maxScale={10} 
        limitToBounds={true}
        doubleClick={{ disabled: true }} 
      >
        {({ zoomToElement, resetTransform }) => (
          <>
            {currentZoomLevel === 'constellation' && !isWarping && (
              <button 
                className={styles.backButton} 
                onClick={() => { 
                  playZoomOutSound();
                  resetTransform(800); 
                  setCurrentZoomLevel('sector'); 

                  if (activeConstellation) {
                    const titlesGroup = document.querySelector(`#titles_${activeConstellation}`);
                    if (titlesGroup) titlesGroup.classList.remove(styles.activeTitles);
                  }

                  setActiveConstellation(null); 
                  hideTooltip();
                }}
              >
                ОТМЕНИТЬ ФОКУС
              </button>
            )}
            
            <TransformComponent wrapperClass={styles.transformWrapper}>
              <div 
                // Динамически применяем класс для блокировки слоев
                className={clsx(
                  styles.svgContainer, 
                  currentZoomLevel === 'sector' ? styles.viewLevelSector : styles.viewLevelConstellation
                )}
                onClick={(e) => handleClick(e, zoomToElement)}
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {/* Тултип вынесен из состояния React, управляется через DOM (Ref) */}
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