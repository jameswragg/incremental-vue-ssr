const path = require('path');
const Hapi = require('@hapi/hapi');
const Vision = require('@hapi/vision');
const Inert = require('@hapi/inert');

const { builder } = require('./builder');
const { viewManager } = require('./view-manager');

const options = {
  ssrBundlespath: '../dist/server/',
  csrBundlespath: '../dist/client/',
};

const main = async function main() {
  const server = Hapi.Server({
    host: '0.0.0.0',
    port: 3000,
    routes: {
      files: {
        relativeTo: path.join(__dirname, './dist'),
      },
    },
  });

  // use rollup to create individual server & client bundles
  await builder(options);

  // hapi plugins to provide templating + static file serving
  await server.register(Vision);
  await server.register(Inert);
  server.views(viewManager(server, { options }));

  // setup routes
  server.route({
    method: 'GET',
    path: '/',
    handler: async (request, h) => {
      const context = {
        title: `Running hapi ${request.server.version} with Nunjucks server-rendered templates`,
        count: 4,
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
      };

      return h.view('index', context);
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

main();
