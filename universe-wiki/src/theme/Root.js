import React from 'react';
import HazardScrollbar from '@site/src/components/HazardScrollbar';

// Root оборачивает всё приложение — сюда удобно вешать глобальные штуки вроде кастомного скроллбара
export default function Root({ children }) {
  return (
    <>
      {children}
      <HazardScrollbar />
    </>
  );
}
