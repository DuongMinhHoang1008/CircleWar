import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addLocatorHandler(page.locator('.gift-modal-backdrop'),async()=>{await page.getByRole('button',{name:'Đóng thông báo',exact:true}).first().click();},{noWaitAfter:true});
 const nav=async()=>{await page.getByRole('button',{name:'Mở menu điều hướng',exact:true}).click();};
 await page.goto(process.env.TEST_WEB||'http://127.0.0.1:5174/');
 await page.waitForTimeout(1000);await nav();
 assert.equal(await page.getByRole('button',{name:'Mô phỏng đàn kiến',exact:true}).count(),0);
 await page.getByRole('button',{name:'Cài đặt',exact:true}).click();
 await page.getByLabel('Mã truy cập',{exact:true}).fill('1111');await page.getByRole('button',{name:'Mở công cụ',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'Mã không hợp lệ.'}).waitFor();assert.equal(await page.locator('.colony-page').count(),0);
 await page.getByLabel('Mã truy cập',{exact:true}).fill('1824');await page.getByRole('button',{name:'Mở công cụ',exact:true}).click();
 await page.locator('.colony-page').waitFor();assert.match(await page.locator('.colony-page [role=status]').innerText(),/Sẵn sàng/);
 await page.reload();await page.waitForTimeout(500);await nav();
 assert.equal(await page.getByRole('button',{name:'Mô phỏng đàn kiến',exact:true}).count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: hidden by default, wrong code rejected, 1824 opens tool without running simulation, reload locks again.');
}finally{await browser.close();}
