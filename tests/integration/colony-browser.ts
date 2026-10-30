import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {CURRENT_RELEASE_VERSION} from '../../apps/web/src/PatchNotes';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(version=>localStorage.setItem('circlewar-update-reward-version-v1',version),CURRENT_RELEASE_VERSION);
  await page.goto(process.env.TEST_WEB||'http://127.0.0.1:5174/');
  await page.getByRole('button',{name:'Đóng thông báo',exact:true}).first().waitFor({timeout:3000}).then(async()=>{for(let i=0;i<3;i++){const close=page.getByRole('button',{name:'Đóng thông báo',exact:true});if(await close.count())await close.first().click();}}).catch(()=>{});
  await page.getByRole('button',{name:'Mở menu điều hướng',exact:true}).click();
  await page.getByRole('button',{name:'Cài đặt',exact:true}).click();
  await page.getByLabel('Mã truy cập',{exact:true}).fill('1824');
  await page.getByRole('button',{name:'Mở công cụ',exact:true}).click();
  const form=page.locator('.colony-page');
  for(const [label,value] of [['Người chơi ảo','4'],['Số thế hệ','1'],['Lượt ghép cặp / thế hệ','1'],['Đội vào vòng đánh giá','1'],['Đối thủ đánh giá / đội','2']])await form.getByLabel(label,{exact:true}).fill(value);
  await form.getByRole('button',{name:'Bắt đầu mô phỏng',exact:true}).click();
  await form.getByRole('status').filter({hasText:'Hoàn tất'}).waitFor({timeout:120000});
  assert.match(await form.getByRole('status').innerText(),/8 trận/);
  assert.equal(await form.locator('canvas').count(),0);
  assert.equal(await form.locator('tbody tr').count(),4);
  const results=form.getByRole('region',{name:'Kết quả mô phỏng'});
  assert.equal(await results.getByLabel('Tập số liệu',{exact:true}).inputValue(),'all');
  for(const [name,count] of [['Nhân vật',33],['Trang bị',34],['Nhân vật × Trang bị',1122],['Nhân vật × Bí kỹ',132]] as const){
    const tab=results.getByRole('button',{name:`${name} ${count}`,exact:true});await tab.click();
    assert.equal(await results.locator('tbody tr').count(),25);
    await results.getByRole('button',{name:'Trang sau',exact:true}).click();
    assert.ok(await results.locator('tbody tr').count()>0);
    assert.doesNotMatch(await results.innerText(),/NaN|Infinity/);
  }
  for(const name of ['Nhân vật','Trang bị','Nhân vật × Trang bị','Nhân vật × Bí kỹ','Đội']){
    await results.getByRole('button',{name:new RegExp('^'+name+' \\d+$')}).click();
    assert.ok(await results.locator('tbody tr').count()>0);
  }
  const games=results.getByRole('columnheader',{name:/Số trận/});
  await games.getByRole('button').click();assert.equal(await games.getAttribute('aria-sort'),'descending');
  await games.getByRole('button').click();assert.equal(await games.getAttribute('aria-sort'),'ascending');
  await results.getByLabel('Tập số liệu',{exact:true}).selectOption('training');
  await results.getByLabel('Số trận tối thiểu',{exact:true}).fill('1000');
  assert.equal(await results.locator('tbody tr').count(),0);
  await results.getByLabel('Số trận tối thiểu',{exact:true}).fill('0');
  await results.getByLabel('Tìm kết quả',{exact:true}).fill('xyz-no-result');
  assert.equal(await results.locator('tbody tr').count(),0);
  await results.getByLabel('Tìm kết quả',{exact:true}).fill('');
  mkdirSync('reports/colony',{recursive:true});
  await results.screenshot({path:'reports/colony/results-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await results.screenshot({path:'reports/colony/results-mobile.png'});
  await page.setViewportSize({width:1280,height:1000});
  await form.getByRole('button',{name:'Bắt đầu mô phỏng',exact:true}).click();
  await form.getByRole('button',{name:'Dừng',exact:true}).click();
  assert.match(await form.getByRole('status').innerText(),/Đã dừng/);
  assert.deepEqual(errors,[]);
  await page.setViewportSize({width:390,height:844});
  mkdirSync('reports/colony',{recursive:true});
  await page.screenshot({path:'reports/colony/mobile.png',fullPage:true});
  console.log('PASS: configurable UI, 8-battle worker smoke, held-out result, no canvas, cancellation, mobile, no page errors.');
}finally{await browser.close();}
