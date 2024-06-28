#!/usr/bin/env node

let server,
	isDev = process.argv[2] === 'start',
	{ spawn } = require('child_process'),
	onRebuild = () => {
		// console.log("Re-building.");
		if (isDev) {
			if (server) server.kill('SIGINT')
			let params = ['dist/main.js'];
			if(isDev) {
				params.push('--inspect')
			}
			server = spawn('node', params, { stdio: 'inherit' })
		}
	}

require('esbuild')
	.build({
		entryPoints: ['src/main.ts'],
		outdir: 'dist',
		platform: 'node',
		bundle: true,
		sourcemap: true,
		watch: isDev && { onRebuild },
	})
	.catch(e => {
		console.log("Error on rebuild ! ");
		console.log(e);
	})
	.finally(onRebuild)
