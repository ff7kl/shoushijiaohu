import {chromium} from 'file:///C:/Users/natural/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const browser=await chromium.launch({headless:true,executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe"});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.goto('http://127.0.0.1:5173');
await page.waitForFunction(()=>!!window.theatre);
await page.locator('details').last().locator('summary').click();
await page.locator('#simulate').check();
for(let i=0;i<5;i++)for(const value of [0,.5,1]){
 await page.evaluate(({i,value})=>{for(let j=0;j<5;j++){const e=document.querySelector(`#sim-${j}`);e.value=j===i?value:0;e.dispatchEvent(new Event('input'));}},{i,value});
 await page.waitForTimeout(650);
 await page.screenshot({path:`screenshots/pose-${i}-${value}.png`});
 const errors=await page.evaluate(()=>{const t=window.theatre;return t.limbs.flatMap(l=>{const root=l.root.clone();root.y+=t.driver.values[2]*.55;return Math.abs(root.distanceTo(l.joint.position)-l.a)>1e-6||Math.abs(l.joint.position.distanceTo(l.end)-l.b)>1e-6||![...l.end,...l.joint.position].every(Number.isFinite)?['bad limb']:[];});});
 if(errors.length)throw Error(errors);
}
await browser.close();console.log('15 个独立模拟姿势截图及渲染关节检查通过');


