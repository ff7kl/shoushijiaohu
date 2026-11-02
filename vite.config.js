import {execSync} from 'node:child_process';
import {defineConfig} from 'vite';
const base=process.env.DEPLOY_BASE || '/shoushijiaohu/';
if(!base.startsWith('/')||!base.endsWith('/')||base.includes('..'))throw new Error('DEPLOY_BASE 必须是 / 或 /仓库名/ 形式');
const sha=process.env.GITHUB_SHA || execSync('git rev-parse HEAD').toString().trim();
export default defineConfig({define:{__BUILD_SHA__:JSON.stringify(sha.slice(0,7)+(process.env.GITHUB_SHA?'':'-local'))},base,server:{host:'127.0.0.1'},preview:{host:'127.0.0.1'}});
