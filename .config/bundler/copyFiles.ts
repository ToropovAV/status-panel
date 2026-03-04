import { getPluginJson, hasReadme } from './utils.ts';

const pluginJson = getPluginJson();
const logoPaths: string[] = Array.from(new Set([pluginJson.info?.logos?.large, pluginJson.info?.logos?.small])).filter(
  Boolean
);

export const copyFilePatterns = [
  { from: hasReadme() ? 'README.md' : '../README.md', to: '.', force: true },
  { from: 'plugin.json', to: '.' },
  { from: '../LICENSE', to: '.', noErrorOnMissing: false },
  { from: '../CHANGELOG.md', to: '.', force: true },
  { from: '**/*.json', to: '.' },
  { from: '**/query_help.md', to: '.', noErrorOnMissing: true },
  ...logoPaths.map((logoPath) => ({ from: logoPath, to: logoPath })),
  // Copy screenshots from docs/screenshots/ to img/ for Grafana plugin catalog
  {
    from: '../docs/screenshots/*.png',
    to: 'img/screenshot-[name][ext]',
    noErrorOnMissing: true,
  },
];
