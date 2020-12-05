/* eslint-disable global-require */
const Path = require('path');
const Hapi = require('@hapi/hapi');
const Vision = require('@hapi/vision');
const Inert = require('@hapi/inert');
const Nunjucks = require('nunjucks');
const awaitFilter = require('nunjucks-await-filter');
const Vue = require('vue');
const renderer = require('vue-server-renderer').createRenderer();
const fs = require('fs/promises');
const { nanoid } = require('nanoid');

const { builder } = require('./builder');

const internals = {
  templatePath: '.',
};

internals.rootHandler = function (request, h) {
  const relativePath = Path.relative(`${__dirname}/../..`, `${__dirname}/templates/${internals.templatePath}`);

  return h.view('index', {
    title: `Running ${relativePath} | hapi ${request.server.version}`,
    message: 'Hello Nunjucks!',
  });
};

internals.main = async function () {
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
    engines: {
      njk: {
        compile: (src, options) => {
          const template = Nunjucks.compile(src, options.environment, options.filename);

          return (context) => {
            return new Promise((resolve, reject) => {
              template.render(context, (err, res) => {
                if (err) {
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

          return next();
        },
      },
    },
    path: `${__dirname}/templates`,
    isCached: false,
    context: {
      csrBlocks: {},
      async renderComponent(path, context = {}) {
        const component = require(`./dist/server/${path}`).default;
        const id = nanoid(10);
        const css = await fs.readFile(`./dist/server/${path}.css`, 'utf8');
        // const js = await fs.readFile(`./dist/client/${path}.js`, 'utf8');

        this.ctx.csrBlocks[path] = {
          css,
          js: `
          import ${path} from '/public/client/${path}.js'
        
          new Vue({ render: createElement => createElement(${path}).default }).$mount('#vue-${id}');
          `,
        };

        try {
          const html = await renderer.renderToString(new Vue(component, context));
          const result = `<div id="vue-${id}">${html}</div>`;

          return result;
        } catch (error) {
          console.error(error);
        }
      },
    },
  });

  server.route({ method: 'GET', path: '/', handler: internals.rootHandler });
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
