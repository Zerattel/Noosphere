import React, { useState } from 'react';
import { createPortal } from 'react-dom';

export default function SciFiTooltip({ children, desc }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    setCoords({ x: e.clientX, y: e.clientY });
  };

  // Проверка на то, что код выполняется в браузере (важно для Docusaurus при сборке)
  const isBrowser = typeof window !== 'undefined';

  return (
    <>
      <span
        className="tooltip-trigger"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onMouseMove={handleMouseMove}
      >
        {children}
      </span>

      {isBrowser && visible && createPortal(
        <div
          className="tooltip tooltipVisible"
          style={{
            position: 'fixed', /* fixed идеально работает с e.clientX / e.clientY */
            transform: `translate(${coords.x}px, ${coords.y}px)`,
            zIndex: 9999
          }}
        >
          <div className="tooltipLine"></div>
          <div className="tooltipContent">
            {/* children — это само слово, которое мы оборачиваем */}
            <h4 className="tooltipTitle">{children}</h4>
            <p className="tooltipDesc">{desc}</p>
          </div>
        </div>,
        document.body /* Рендерим в корень страницы, чтобы тултип не обрезался другими блоками */
      )}
    </>
  );
}