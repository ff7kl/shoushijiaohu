import {defineConfig} from 'vite';
const base=process.env.DEPLOY_BASE || '/';
if(!base.startsWith('/')||!base.endsWith('/')||base.includes('..'))throw new Error('DEPLOY_BASE 必须是 / 或 /仓库名/ 形式');
export default defineConfig({base,server:{host:'127.0.0.1'},preview:{host:'127.0.0.1'}});
