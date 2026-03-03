import CopyWebpackPlugin from 'copy-webpack-plugin';
import ESLintPlugin from 'eslint-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import path from 'path';
import { Configuration, DefinePlugin } from 'webpack';

import { getPackageJson, getPluginJson, hasReadme, getEntries } from './utils';
import { SOURCE_DIR, DIST_DIR } from './constants';

const pluginJson = getPluginJson();
const packageJson = getPackageJson();

const config = async (env: Record<string, string>): Promise<Configuration> => ({
  cache: {
    type: 'filesystem',
    buildDependencies: { config: [__filename] },
  },

  context: path.join(process.cwd(), SOURCE_DIR),
  devtool: env.production ? 'source-map' : 'eval-source-map',
  entry: await getEntries(),

  externals: [
    'lodash', 'jquery', 'moment', 'slate', 'emotion',
    '@emotion/react', '@emotion/css', 'prismjs',
    'react', 'react-dom', 'react-redux', 'redux', 'rxjs',
    'react-router', 'react-router-dom', 'd3', 'angular',
    '@grafana/ui', '@grafana/runtime', '@grafana/data',
    ({ request }: { request?: string }, callback: Function) => {
      const prefix = 'grafana/';
      if (request && request.indexOf(prefix) === 0) {
        return callback(undefined, request.substr(prefix.length));
      }
      callback();
    },
  ],

  mode: env.production ? 'production' : 'development',

  module: {
    rules: [
      {
        exclude: /(node_modules)/,
        test: /\.[tj]sx?$/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              baseUrl: path.resolve(process.cwd(), 'src'),
              target: 'es2018',
              loose: false,
              parser: { syntax: 'typescript', tsx: true, decorators: false, dynamicImport: true },
            },
          },
        },
      },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.s[ac]ss$/, use: ['style-loader', 'css-loader', 'sass-loader'] },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        type: 'asset/resource',
        generator: {
          publicPath: `public/plugins/${pluginJson.id}/img/`,
          outputPath: 'img/',
          filename: Boolean(env.production) ? '[hash][ext]' : '[name][ext]',
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)(\?v=\d+\.\d+\.\d+)?$/,
        type: 'asset/resource',
        generator: {
          publicPath: `public/plugins/${pluginJson.id}/fonts/`,
          outputPath: 'fonts/',
          filename: Boolean(env.production) ? '[hash][ext]' : '[name][ext]',
        },
      },
    ],
  },

  output: {
    clean: { keep: new RegExp('.*?_(amd64|arm(64)?)(.exe)?') },
    filename: '[name].js',
    library: { type: 'amd' },
    path: path.resolve(process.cwd(), DIST_DIR),
    publicPath: '/',
  },

  plugins: [
    // Expose version and plugin id as constants in the bundle
    new DefinePlugin({
      'process.env.PLUGIN_VERSION': JSON.stringify(packageJson.version),
      'process.env.PLUGIN_ID': JSON.stringify(pluginJson.id),
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: hasReadme() ? 'README.md' : '../README.md', to: '.', force: true },
        { from: 'plugin.json', to: '.' },
        { from: '../LICENSE', to: '.', noErrorOnMissing: true },
        { from: '../CHANGELOG.md', to: '.', force: true, noErrorOnMissing: true },
        { from: '**/*.json', to: '.' },
        { from: '**/*.svg', to: '.', noErrorOnMissing: true },
        { from: '**/*.png', to: '.', noErrorOnMissing: true },
        { from: '**/*.html', to: '.', noErrorOnMissing: true },
        { from: 'img/**/*', to: '.', noErrorOnMissing: true },
        { from: 'libs/**/*', to: '.', noErrorOnMissing: true },
        { from: 'static/**/*', to: '.', noErrorOnMissing: true },
      ],
    }),
    new ForkTsCheckerWebpackPlugin({
      async: Boolean(env.development),
      issue: { include: [{ file: '**/*.{ts,tsx}' }] },
      typescript: { configFile: path.join(process.cwd(), 'tsconfig.json') },
    }),
    new ESLintPlugin({
      extensions: ['.ts', '.tsx'],
      lintDirtyModulesOnly: Boolean(env.development),
    }),
  ],

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    modules: [path.resolve(process.cwd(), 'src'), 'node_modules'],
    unsafeCache: true,
  },
});

export default config;
