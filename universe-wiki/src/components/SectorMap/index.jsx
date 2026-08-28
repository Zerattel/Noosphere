import React, { useState, useEffect } from 'react';
import { useHistory } from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import clsx from 'clsx';
import styles from './styles.module.css';
import mapData from './mapData.json';

export default function SectorMap() {
  const history = useHistory();
  const mapUrl = useBaseUrl('/img/map.svg');
  
  const [svgContent, setSvgContent] = useState('');
  const [currentZoomLevel, setCurrentZoomLevel] = useState('sector'); 
  const [activeConstellation, setActiveConstellation] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, title: '', desc: '' });

  useEffect(() => {
    fetch(mapUrl)
      .then((res) => res.text())
      .then((text) => setSvgContent(text))
      .catch((err) => console.error('Ошибка загрузки карты:', err));
  }, [mapUrl]);

  // Универсальный поиск: ищет ID и на <g>, и на <rect>, <path> и т.д.
  const getHitboxTarget = (element) => element?.closest('[id^="hitbox_"], [id^="hitbox-"]');

  const getHitboxCategory = (hitboxEl) => {
    if (!hitboxEl) return null;
    if (hitboxEl.closest('#Hitboxes_constellations')) return 'constellation';
    if (hitboxEl.closest('#Hitboxes')) return 'system';
    return null;
  };

  const getHitboxName = (hitboxEl) => hitboxEl.id.replace(/^hitbox[_-]/, '');

  const handleMouseMove = (event) => {
    const target = getHitboxTarget(event.target);
    const category = getHitboxCategory(target);

    if (!target || !category) {
      if (tooltip.visible) setTooltip(prev => ({ ...prev, visible: false }));
      return;
    }

    const name = getHitboxName(target);
    const rect = event.currentTarget.getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;

    // Наведение на звезду — только когда приближено нужное созвездие
    if (category === 'system' && currentZoomLevel === 'constellation') {
      const data = mapData['system_' + name];
      if (data) {
        setTooltip({ visible: true, x: cursorX, y: cursorY, title: data.title, desc: data.description });
      }
      // Хитбоксы звёзд намеренно никогда не подсвечиваются
    }
    // Наведение на созвездие — только на карте сектора
    else if (category === 'constellation' && currentZoomLevel === 'sector') {
      const customView = document.querySelector(`#constellation_view_${name}`);
      if (customView) customView.classList.add(styles.highlightedConstellation);
      else target.classList.add(styles.highlightedHitbox);

      const data = mapData['constellations_' + name];
      if (data) {
        setTooltip({ visible: true, x: cursorX, y: cursorY, title: data.title, desc: data.description });
      }
    } else {
      if (tooltip.visible) setTooltip(prev => ({ ...prev, visible: false }));
    }
  };

  const handleMouseOut = (event) => {
    setTooltip(prev => ({ ...prev, visible: false }));
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
    const target = getHitboxTarget(event.target);
    const category = getHitboxCategory(target);
    if (!target || !category) return;

    const name = getHitboxName(target);

    if (category === 'constellation' && currentZoomLevel === 'sector') {
      setActiveConstellation(name);
      setCurrentZoomLevel('constellation');
      setTooltip(prev => ({ ...prev, visible: false }));

      // Плавный кинематографичный наезд (зум x3, длительность 800мс)
      if (zoomToElement) zoomToElement(target, 3, 800);
    }
    else if (category === 'system' && currentZoomLevel === 'constellation') {
      history.push(`/docs/system-stub?system=${name}`);
    }
  };

  return (
    <div 
      className={styles.mapWrapper} 
      onMouseMove={handleMouseMove}
      onMouseOut={handleMouseOut}
    >
      <TransformWrapper 
        initialScale={1} 
        minScale={1} 
        maxScale={10} 
        limitToBounds={true}
        // Запрещаем перехват клика, если мышь не сдвинулась (различает клик и паннинг)
        doubleClick={{ disabled: true }} 
      >
        {({ zoomToElement, resetTransform }) => (
          <>
            {currentZoomLevel === 'constellation' && (
              <button 
                className={styles.backButton} 
                style={{ display: currentZoomLevel === 'constellation' ? 'block' : 'none' }}
                onClick={() => { 
                  resetTransform(800); 
                  setCurrentZoomLevel('sector'); 
                  setActiveConstellation(null); 
                  setTooltip(prev => ({...prev, visible: false}));
                }}
              >
                ОТМЕНИТЬ ФОКУС
              </button>
            )}
            
            <TransformComponent wrapperClass={styles.transformWrapper}>
              <div 
                className={styles.svgContainer}
                onClick={(e) => handleClick(e, zoomToElement)}
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      <div 
        className={clsx(styles.tooltip, tooltip.visible && styles.tooltipVisible)}
        style={{ left: tooltip.x, top: tooltip.y }}
      >
        <div className={styles.tooltipLine}></div>
        <div className={styles.tooltipContent}>
          <div className={styles.tooltipTitle}>{tooltip.title}</div>
          <div className={styles.tooltipDesc}>{tooltip.desc}</div>
        </div>
      </div>
    </div>
  );
} 