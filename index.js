/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const Path = require('path');
const Hapi = require('@hapi/hapi');
const Vision = require('@hapi/vision');
const Inert = require('@hapi/inert');
const Nunjucks = require('nunjucks');
const awaitFilter = require('nunjucks-await-filter');

const fs = require('fs/promises');
const { nanoid } = require('nanoid');
const { createSSRApp } = require('vue');
const { renderToString } = require('@vue/server-renderer');

const { builder } = require('./builder');

const internals = {
  templatePath: '.',
  ssrBundlesPath: './dist/server/',
  csrBundlesPath: './dist/client/',
};

internals.renderComponent = async function renderComponent(componentName, context = {}) {
  const componentPath = Path.resolve(internals.ssrBundlesPath, `${componentName}.js`);
  const component = require(componentPath);
  const css = await fs.readFile(Path.resolve(internals.ssrBundlesPath, `${componentName}.css`), 'utf8');
  const js = await fs.readFile(Path.resolve(internals.csrBundlesPath, `${componentName}.js`), 'utf8');
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

internals.main = async function main() {
  const server = Hapi.Server({
    host: '0.0.0.0',
    port: 3000,
    routes: {
      files: {
        relativeTo: Path.join(__dirname, './dist'),
      },
    },
  });

  await builder();

  await server.register(Vision);
  await server.register(Inert);

  server.views({
    defaultExtension: 'njk',
    path: `${__dirname}/templates`,
    isCached: false,
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

          env.addGlobal('renderComponent', internals.renderComponent);

          return next();
        },
      },
    },
    context: {
      csrBlocks: {},
    },
  });

  server.route({
    method: 'GET',
    path: '/',
    handler: async (request, h) => {
      // server handler does stuff

      return h.view('index', {
        title: `Running hapi ${request.server.version} with Nunjucks server-rendered templates`,
        carouselItems: [
          {
            name: 'james',
          },
          {
            name: 'bob',
          },
          {
            name: 'sarah',
          },
        ],
      });
    },
  });

  server.route({
    method: 'GET',
    path: '/public/{param*}',
    handler: {
      directory: {
        path: '.',
        redirectToSlash: true,
      },
    },
  });

  await server.start();

  console.log(`Server is running at ${server.info.uri}`);
};

internals.main();
