const Bundler = require('parcel-bundler');
const Path = require('path');

const entryFiles = Path.join(__dirname, './src/vue/*.vue');

const base = {
  watch: false,
  contentHash: false,
};

const serverOptions = {
  ...base,
  outDir: './dist/server', // The out directory to put the build files in, defaults to dist
  target: 'node',
};

const clientOptions = {
  ...base,
  outDir: './dist/client', // The out directory to put the build files in, defaults to dist
  target: 'browser',
};

exports.builder = async () => {
  await new Bundler(entryFiles, serverOptions).bundle();
  await new Bundler(entryFiles, clientOptions).bundle();
};

// (async function () {

//   const component = require("./dist/server/mybutton").default;

//   try {
//     const result = await renderer.renderToString(new Vue(component));
//     console.log(result);
//   } catch (error) {
//     console.error(error);
//   }
// })();
