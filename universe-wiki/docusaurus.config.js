// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Достаёт путь первой картинки из статьи (инфобокс) для og:image
const FIRST_IMG_RE =
  /<img\b[^>]*?\bsrc=(?:\{\s*require\(\s*['"]([^'"]+)['"]\s*\)(?:\.default)?\s*\}|["']([^"']+)["'])/;

/** @param {string} content */
function extractFirstImage(content) {
  const m = content.match(FIRST_IMG_RE);
  if (!m) return undefined;
  const src = m[1] || m[2];
  if (src.startsWith('@site/static/')) return src.slice('@site/static/'.length);
  if (src.startsWith('@site/')) return undefined; // не из static, og:image не получится
  if (/^https?:\/\//.test(src)) return src;
  return src.replace(/^\//, '');
}

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Noosphere Wiki',
  tagline: 'База знаний и документация Hayat Sector RP',
  favicon: 'img/hsrpico.ico',

  future: { v4: true },

  markdown: {
    parseFrontMatter: async (params) => {
      const result = await params.defaultParseFrontMatter(params);
      if (!result.frontMatter.image) {
        const img = extractFirstImage(result.content);
        if (img) result.frontMatter.image = img;
      }
      return result;
    },
  },

  url: 'https://zerattel.github.io',
  // Динамический путь: корень для localhost, /Noosphere/ для GitHub Pages
  baseUrl: process.env.NODE_ENV === 'development' ? '/' : '/Noosphere/',

  organizationName: 'Zerattel',
  projectName: 'Noosphere',
  trailingSlash: false, 

  onBrokenLinks: 'warn',
  plugins: ['./src/plugins/ship-table-plugin'],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],
  
  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css',
      type: 'text/css',
      integrity: 'sha384-odtC+0UGZ/qTGb2814/9OxlqqwKa/O23xZ32s/WOTxRjOaE99lC6vXzGgZ8b3L',
      crossorigin: 'anonymous',
    },
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/embed-banner.png', // Твой кастомный эмбед
      colorMode: {
        defaultMode: 'dark', 
        disableSwitch: true, 
        respectPrefersColorScheme: false, 
      },
      navbar: {
        title: 'NOOSPHERE — Hayat Sector Wiki',
        
        logo: {
          href: 'https://zerattel.github.io/Noosphere/main',
          alt: 'My Site Logo',
          src: 'img/hsrp.webp',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Wiki',
          },
          {
            to: '/map',          // Путь к нашей созданной странице
            label: 'Карта Сектора', // Текст на кнопке
            position: 'left',    // Слева или справа (right)
          },
          {
            href: 'https://github.com/Zerattel/Noosphere',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

// Экспортируем собранную переменную
export default config;