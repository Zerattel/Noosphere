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
  const getHitboxTarget = (element) => element?.closest('[id^="Hitboxes_"]');

  const handleMouseMove = (event) => {
    const target = getHitboxTarget(event.target);
    
    if (!target) {
      if (tooltip.visible) setTooltip(prev => ({ ...prev, visible: false }));
      return;
    }

    const id = target.id;
    // Координаты берем относительно внешнего контейнера карты, чтобы тултип не улетал при зуме
    const rect = event.currentTarget.getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;

    // Логика: Наведение на звезду (только если мы уже приблизили созвездие)
    if (id.startsWith('Hitboxes_system_') && currentZoomLevel === 'constellation') {
      const systemKey = id.replace('Hitboxes_', '');
      const data = mapData[systemKey];
      if (data) {
        setTooltip({ visible: true, x: cursorX, y: cursorY, title: data.title, desc: data.description });
      }
    } 
    // Логика: Наведение на созвездие (только на глобальной карте)
    else if (id.startsWith('Hitboxes_constellations_') && currentZoomLevel === 'sector') {
      const constName = id.replace('Hitboxes_constellations_', '');
      
      // Визуальная подсветка
      const customView = document.querySelector(`#constellation_view_${constName}`);
      if (customView) customView.classList.add(styles.highlightedConstellation);
      else target.classList.add(styles.highlightedHitbox);
      
      // Тултип для созвездия
      const data = mapData['constellations_' + constName];
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
    
    if (target && target.id.startsWith('Hitboxes_constellations_')) {
      const constName = target.id.replace('Hitboxes_constellations_', '');
      const customView = document.querySelector(`#constellation_view_${constName}`);
      if (customView) customView.classList.remove(styles.highlightedConstellation);
      target.classList.remove(styles.highlightedHitbox);
    }
  };

  const handleClick = (event, zoomToElement) => {
    const target = getHitboxTarget(event.target);
    if (!target) return;
    
    const id = target.id;

    if (id.startsWith('Hitboxes_constellations_') && currentZoomLevel === 'sector') {
      const constName = id.replace('Hitboxes_constellations_', '');
      setActiveConstellation(constName);
      setCurrentZoomLevel('constellation');
      setTooltip(prev => ({ ...prev, visible: false }));

      // Плавный кинематографичный наезд (зум x3, длительность 800мс)
      if (zoomToElement) zoomToElement(target, 3, 800);
    } 
    else if (id.startsWith('Hitboxes_system_') && currentZoomLevel === 'constellation') {
      const systemKey = id.replace('Hitboxes_', '');
      // Перенаправление на локальную карту системы
      history.push(`/docs/system-stub?system=${systemKey}`);
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