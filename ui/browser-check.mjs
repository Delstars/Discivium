import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('browser-evidence', {recursive:true});
const browser=await chromium.launch({headless:true});
const base='http://127.0.0.1:8000';
const users=[['student','Alex Chen'],['lecturer','Dr. Morgan'],['admin','Campus Administrator'],['advisor','Academic Advisor']];
try {
  for (const [username,name] of users) {
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    await page.goto(base+'/ui/');
    await page.locator('#login-username').fill(username);
    await page.locator('#login-password').fill('DemoOnly!2026');
    await page.getByRole('button',{name:'Sign In',exact:true}).click();
    await page.getByRole('navigation',{name:'Primary navigation'}).waitFor();
    const state=await page.evaluate(async()=>{const r=await fetch('/api/state');return r.json()});
    assert.equal(state.user.username,username);
    assert.equal(state.user.name,name);
    await page.waitForTimeout(300);
    await page.screenshot({path:'browser-evidence/'+username+'-desktop.png',fullPage:true});
    const nav=page.getByRole('navigation',{name:'Primary navigation'}).first();
    const buttons=await nav.getByRole('button').all();
    for (const b of buttons) {
      if(await b.isVisible()) { await b.click(); await page.waitForTimeout(150); }
    }
    if(username==='lecturer'){
      await page.goto(base+'/ui/#/course/1');
      const tabs=page.getByRole('tablist',{name:'Lecturer course tools'});
      await tabs.waitFor();
      for(const tab of await tabs.getByRole('tab').all()){await tab.click();await page.waitForTimeout(120);}
      await page.getByRole('button',{name:'Publish Assignment',exact:true}).first().click();
      await page.getByRole('dialog').waitFor();
      await page.keyboard.press('Escape');
    }
    assert.deepEqual(errors,[],username+' page exceptions');
    await page.setViewportSize({width:390,height:844});
    await page.goto(base+'/ui/#/overview');
    await page.waitForTimeout(400);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),username+' mobile page overflow');
    await page.screenshot({path:'browser-evidence/'+username+'-mobile.png',fullPage:true});
    const logout=await page.evaluate(async()=>{const s=await (await fetch('/api/session')).json();return (await fetch('/api/logout',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':s.csrf},body:'{}'})).status});
    assert.equal(logout,200);
    await context.close();
    console.log('Verified live login and visible navigation: '+username);
  }
} finally {await browser.close();}
