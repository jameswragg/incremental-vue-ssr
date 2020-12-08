const Path = require('path');
const rollup = require('rollup');
const globby = require('globby');
const mkdirp = require('mkdirp');

const { terser } = require('rollup-plugin-terser');
const VuePlugin = require('rollup-plugin-vue');
const scss = require('rollup-plugin-scss');
const { writeFileSync, existsSync, mkdirSync } = require('fs');
const CleanCSS = require('clean-css');

const entryFiles = Path.join(__dirname, './src/vue/**/*.vue');

const isProduction = process.env.NODE_ENV === 'production';

const config = (name, path) => [
  // SSR build.
  {
    input: path,
    output: {
      format: 'cjs',
      dir: 'dist/server',
      exports: 'auto',
    },
    plugins: [
      VuePlugin({ template: { optimizeSSR: true } }),
      scss({
        output(style) {
          writeFileSync(`dist/server/${name}.css`, new CleanCSS().minify(style).styles);
        },
      }),
    ],
    external: ['vue'],
  },
  // Browser build.
  {
    input: path,
    output: {
      format: 'iife',
      dir: 'dist/client',
      name,
      exports: 'auto',
      globals: {
        vue: 'Vue',
      },
    },
    plugins: [
      VuePlugin(),
      scss({
        output(style) {
          writeFileSync(`dist/client/${name}.css`, new CleanCSS().minify(style).styles);
        },
      }),
      isProduction && terser(),
    ],
    external: ['vue'],
  },
];

exports.builder = async (options) => {
  async function createConfig(conf) {
    try {
      const bundle = await rollup.rollup(conf);
      const { output } = await bundle.generate(conf.output);

      await bundle.write(conf.output);

      return Promise.resolve(output);
    } catch (err) {
      console.error(err);
      return Promise.reject(err);
    }
  }

  const collection = await globby(entryFiles);
  const promises = [];

  await mkdirp(options.ssrBundlespath);
  await mkdirp(options.csrBundlespath);

  console.log(`Building SFCs...`);

  collection.forEach((pathToFile) => {
    const parts = pathToFile.split('/');
    let name = parts[parts.length - 1];

    name = name.replace('.vue', '');

    config(name, pathToFile).forEach((c) => promises.push(createConfig(c)));
  });

  await Promise.allSettled(promises);

  console.log('Completed build.');
};
