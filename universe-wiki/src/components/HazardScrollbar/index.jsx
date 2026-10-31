import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

// Кастомный скроллбар страницы: хазард-лента, а текущее положение — яркая "маска" на ней.
// Работает только на устройствах с мышью. На телефонах остаётся родной скроллбар.
const MIN_THUMB = 48; // минимальная высота яркого участка, px
const INSET = 5;      // отступ ленты от краёв рейла сверху/снизу (как в исходнике)

export default function HazardScrollbar() {
  const [enabled, setEnabled] = useState(false);
  const [m, setM] = useState({ visible: false, track: 0, top: 0, size: 0 });
  const stripesRef = useRef(null);
  const dragRef = useRef(null);
  const rafRef = useRef(0);

  // Включаем только для мыши
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Прячем родной скроллбар и освобождаем место под рейл (см. styles.module.css)
  useEffect(() => {
    if (!enabled) return undefined;
    document.documentElement.classList.add('hazard-scroll');
    return () => document.documentElement.classList.remove('hazard-scroll');
  }, [enabled]);

  // Пересчёт положения ползунка
  useEffect(() => {
    if (!enabled) return undefined;

    const measure = () => {
      rafRef.current = 0;
      const doc = document.documentElement;
      const view = doc.clientHeight;
      const total = doc.scrollHeight;
      const track = Math.max(view - INSET * 2, 0);
      if (total <= view + 1 || track <= 0) {
        setM((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }
      const size = Math.min(track, Math.max(MIN_THUMB, (track * view) / total));
      const maxTop = track - size;
      const ratio = doc.scrollTop / (total - view);
      const top = maxTop * Math.min(Math.max(ratio, 0), 1);
      setM({ visible: true, track, top, size });
    };
    const schedule = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(measure);
    };

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // высота страницы меняется при переходах, раскрытии меню и подгрузке картинок
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);
    ro.observe(document.documentElement);

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [enabled]);

  // --- Перетаскивание и клик по ленте ---
  const scrollToThumbTop = (thumbTop) => {
    const doc = document.documentElement;
    const maxTop = m.track - m.size;
    if (maxTop <= 0) return;
    const ratio = Math.min(Math.max(thumbTop / maxTop, 0), 1);
    window.scrollTo({ top: ratio * (doc.scrollHeight - doc.clientHeight), behavior: 'instant' });
  };

  const pointerY = (e) => e.clientY - stripesRef.current.getBoundingClientRect().top;

  const onPointerDown = (e) => {
    if (e.button !== 0 || !m.visible) return;
    const y = pointerY(e);
    const onThumb = y >= m.top && y <= m.top + m.size;
    // клик мимо ползунка — центрируем его под курсором, дальше тянем как обычно
    const offset = onThumb ? y - m.top : m.size / 2;
    dragRef.current = { offset };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (!onThumb) scrollToThumbTop(y - offset);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    scrollToThumbTop(pointerY(e) - dragRef.current.offset);
  };

  const onPointerUp = (e) => {
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  if (!enabled || !m.visible) return null;

  const bottom = m.track - m.top - m.size;

  return (
    <div
      className={styles.rail}
      aria-hidden="true"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* тусклая лента (как в исходнике: белые полосы с прозрачностью .1) */}
      <div className={styles.stripes} ref={stripesRef}>
        <span className={styles.dim} />
      </div>
      {/* яркая лента — та же полоса, но видна только в окне ползунка (clip-path),
          а glow на обёртке светится наружу на 4px */}
      <div className={clsx(styles.stripes, styles.stripesLit)}>
        <div className={styles.glow}>
          <span className={styles.lit} style={{ clipPath: `inset(${m.top}px 0 ${bottom}px 0)` }} />
        </div>
      </div>
    </div>
  );
}
