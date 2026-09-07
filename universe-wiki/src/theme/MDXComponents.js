import React from 'react';
// Импортируем стандартные компоненты Docusaurus
import MDXComponents from '@theme-original/MDXComponents';
// Импортируем ваш тултип
import SciFiTooltip from '@site/src/components/SciFiTooltip';

export default {
  // Распространяем стандартные компоненты (чтобы не сломать заголовки, ссылки и т.д.)
  ...MDXComponents,
  // Добавляем наш тултип
  SciFiTooltip,
};