const fs = require('fs/promises');
const path = require('path');
const Nunjucks = require('nunjucks');
const awaitFilter = require('nunjucks-await-filter');

const { nanoid } = require('nanoid');
const { createSSRApp } = require('vue');
const { renderToString } = require('@vue/server-renderer');

const internals = {
  templatepath: '.',
  ssrBundlespath: './dist/server/',
  csrBundlespath: './dist/client/',
};

internals.renderComponent = async function renderComponent(componentName, context = {}) {
  const componentpath = path.resolve(internals.ssrBundlespath, `${componentName}.js`);
  const component = require(componentpath);
  const css = await fs.readFile(path.resolve(internals.ssrBundlespath, `${componentName}.css`), 'utf8');
  const js = await fs.readFile(path.resolve(internals.csrBundlespath, `${componentName}.js`), 'utf8');
  const id = nanoid(10);

  let result;

  this.ctx.csrBlocks[componentName] = {
    css,
    js: `${js}

    Vue.createSSRApp(${componentName}, ${JSON.stringify(context.props)}).mount('#vue-${id}', true)`,
  };

  try {
    const vueApp = createSSRApp(component, context.props);
    const html = await renderToString(vueApp, context.state);

    result = `<div id="vue-${id}">${html}</div>`;
  } catch (error) {
    console.error(error);
    result = error;
  }

  return this.env.filters.safe(result);
};

exports.viewManager = (server, opts) => {
  Object.keys(opts).forEach((i) => (internals[i] = opts[i]));

  return {
    isCached: false,
    path: `${__dirname}/templates`,
    defaultExtension: 'njk',
    engines: {
      njk: {
        compile: (src, options) => {
          const template = Nunjucks.compile(src, options.environment, options.filename);

          return (context) => {
            return new Promise((resolve, reject) => {
              template.render(context, (err, res) => {
                if (err) {
                  console.error(err);
                  reject(err);
                }

                resolve(res);
              });
            });
          };
        },
        prepare: (options, next) => {
          options.compileOptions.environment = Nunjucks.configure(options.path, { watch: false });

          const env = options.compileOptions.environment;

          awaitFilter(env);

          // add the renderComponent function to nunjucks
          env.addGlobal('renderComponent', internals.renderComponent);

          return next();
        },
      },
    },
    context: {
      csrBlocks: {},
    },
  };
};
