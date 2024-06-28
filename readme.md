# Template for creating fastify + typescript + sourcemap + .env applications, compliant with Hubup's policy

This is a template for realising node microservices. It contains the basics features to be efficient and compliant with Hubup's policy.

It does not use any extra heavy framework, just the basics to be easily updatable and maintainable.

You need to read the features before using it.

Furthermore, you MUST edit the readme.md file to explain what your service does, and fill the parameters in the .env that are describing the service (such as the host machine, the storage path, etc.).

## sourcemap support

The main.ts file has on top the following line: `require('source-map-support').install(); `. This is needed to have the stack trace with typescript files and line numbers.


## .env

the `.env.prod` file contains the production environment variables. The .env.dev file contains the development variable.

The .env loaded depends on the `process.env.NODE_ENV` variable. If it is equal to `production`, the `.env.prod` file is loaded, otherwise the `.env.dev` file is loaded.

The loading of this .env file is done by the `dotenv` package on the top of the main.ts file.

Used with pm2, with the script `prod.reload.sh`, the `NODE_ENV` variable is set to `production` and the `.env.prod` file is loaded.

Used with `npm run start`, the `NODE_ENV` variable is set to `development` and the `.env.dev` file is loaded.

## pm2

The file `prod.pm2.js` is the configuration file for pm2. It is used to start the application in production mode.

You can do it manually by using `pm2 start prod.pm2.js`. Also, it is used by the script `prod.reload.sh` to reload the application.

You can customize this script to fit your needs, but it's mostly not required.


## prod.reload.sh

This script is intended to be used directly in production. Here are the things it does : 
1. pulling the latest version of the repository
2. installing the dependencies
3. building the application
4. reloading the application with pm2
5. save the pm2 configuration to keep it working after restart

You can customize this script to fit your needs, but it is mostly not required.


## fastify

In this template, the fastify is created under webServer/server.ts. The routes are under `webServer/controllers/<controller>.ts`.

Note : This project does not implements fastify cors. You can add it if you need it.


## Best practices

Type your variables as much as possible. It will help you to avoid errors and to have a better code. **This must be the default behavior, and having them not typed should be an exception.**

The interfaces are stored under `interfaces/`. The interfaces are named `I<name>.ts`. Interfaces can be organized with subfolders.

The code must be well documented. You need to write your microservices having in mind that any developer will have to maintain it. So, you need to document it as much as possible. The documentation must be clear and easy to understand. It must be written in english.
