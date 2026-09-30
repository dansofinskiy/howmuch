import {snapshot,setupComparison} from './comparison.js';
import {calculate} from './calculator.js';
import {fetchRate} from './exchange.js';
import {countries,getRoute} from './routes.js';
const form = document.querySelector('form');
const get = id => document.getElementById(id);
const number = id => Number(get(id).value);
const money = value => new Intl.NumberFormat('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value)+' ₾';
const weight = value => new Intl.NumberFormat('ru-RU',{maximumFractionDigits:3}).format(value);
const comparison=setupComparison(money);
let currentSnapshots=[];
// Editable rough assumptions for one packaged item; not measured product data.
const categories = {
 sneakers: [1.2, 35, 25, 15],
 tshirt: [0.3, 30, 25, 3],
 hoodie: [0.8, 35, 30, 8],
 jeans: [0.9, 35, 30, 5],
 jacket: [1.3, 40, 35, 15],
 phone: [0.5, 20, 12, 8],
 headphones: [0.6, 25, 20, 12],
 laptop: [3, 45, 35, 12],
 book: [0.7, 25, 18, 5],
};
let manualPackage = false;
const packageFields = ['weight', 'length', 'width', 'height'];
function packageDescription() {
 const dims = packageFields.slice(1).map(id => get(id).value);
 const size = dims.every(Boolean) ? dims.map(v=>weight(Number(v))).join(' × ') + ' см' : 'размеры не указаны';
 return `${manualPackage ? 'Свои параметры' : 'Примерно, с упаковкой'}: ${get('weight').value ? weight(number('weight')) + ' кг' : 'укажите вес'} · ${size}`;
}
function updateEstimate() { get('package-estimate').textContent = packageDescription(); }
function applyCategory() {
 const preset = categories[get('category').value];
 manualPackage = !preset;
 packageFields.forEach((id,i)=> { get(id).value = preset ? preset[i] : ''; });
 if (!preset) get('package-details').open = true;
 updateEstimate();
}
get('category').addEventListener('change', applyCategory);
packageFields.forEach(id=>get(id).addEventListener('input',()=>{manualPackage=true;updateEstimate();}));
form.addEventListener('invalid', event=> { const details=event.target.closest('details'); if(details) details.open=true; },true);
applyCategory();
form.addEventListener('submit', event => {
 event.preventDefault(); get('error').hidden=true;
 try {
  const dims=['length','width','height'].map(id=>get(id).value);
  if(dims.some(Boolean) && !dims.every(Boolean)) throw new Error('Укажите все три размера упаковки или оставьте их пустыми.');
  const calculationInput={country:get('country').value,mode:get('shipping-mode').value,fx:currentFx(),price:number('price'),currency:get('currency').value,weight:number('weight'),exchange:number('exchange'),extra:number('extra'),customsExchange:get('customs-exchange').value ? number('customs-exchange') : number('exchange'),taxMode:get('tax-mode').value,originShipping:number('origin-shipping'),customsFee:number('customs-fee'),clearanceFees:['clearance-onex','clearance-inex','clearance-u2g'].map(id=>get(id).value === '' ? null : number(id)),dimensions:dims.every(Boolean)?dims.map(Number):[],rates:['onex','inex','u2g'].map(id=>get(id).disabled?1:number(id))};
  const rows=calculate(calculationInput);
  currentSnapshots=rows.map(result=>snapshot(calculationInput,result,{country:countries[get('country').value].name,category:get('category').selectedOptions[0].textContent,manualPackage,rateDates:Object.fromEntries(Object.keys(currentFx()).filter(c=>dates[c]).map(c=>[c,dates[c]]))}));
  const best=Math.min(...rows.map(r=>r.shipping));
  get('result-content').innerHTML=`<p class="result-caption">${packageDescription()}<br>Цена товара: ${money(rows[0].product)} · курс: ${new Intl.NumberFormat('ru-RU',{maximumFractionDigits:6}).format(number('exchange'))} ₾/${get('currency').value}<br>${rows[0].reason}. ${rows[0].taxable ? 'НДС и заданные сборы включены.' : 'НДС не начисляется для обычной личной посылки.'}</p><p class="result-caption">${unavailableText()}</p>`+rows.map((r,index)=>`<article class="card ${r.shipping===best?'best':''}"><div class="card-head"><h3><a class="carrier-link" href="${carrierSites[r.id]}" target="_blank" rel="noopener noreferrer" aria-label="${r.name} — открыть сайт в новой вкладке">${r.name} ↗</a></h3>${r.shipping===best?'<span class="badge">Ниже базовый тариф</span>':''}</div><div class="card-main"><div class="cost"><small>Итого с НДС и сборами</small>${money(r.total)}</div><div class="subtotal">Перевозка<br><strong>≈ ${money(r.shipping)}</strong></div></div><div class="payment-split"><div><span>Сразу</span><strong>${money(r.payNow)}</strong><small>Товар + доставка до склада</small></div><div><span>Потом ≈</span><strong>${money(r.payLater)}</strong><small>Перевозка, налоги, сборы и прочие расходы</small></div></div><div class="delivery-estimate"><div><span>Примерный срок</span><strong>≈ ${r.delivery.label}</strong></div><p>${r.delivery.detail} <a href="${r.delivery.source}" target="_blank" rel="noopener noreferrer">Сроки перевозчика</a></p></div><dl class="tax-breakdown"><div><dt>Товар</dt><dd>${money(r.product)}</dd></div><div><dt>Доставка до склада</dt><dd>${money(number('origin-shipping'))}</dd></div><div><dt>НДС ${r.taxable ? '18%' : '— льгота'}</dt><dd>${money(r.vat)}</dd></div>${r.taxable ? `<div class="tax-base"><dt>База НДС: товар + доставка</dt><dd>${money(r.taxBase)}</dd></div>` : ''}<div><dt>Сбор таможни</dt><dd>${money(r.customsCharge)}</dd></div><div><dt>Оформление ${r.name}</dt><dd>${r.clearanceUnknown ? 'Не задано' : money(r.clearanceCharge)}</dd></div>${r.id === 'u2g' ? `<div><dt>Операционный сбор</dt><dd>${money(r.operationalCharge)}</dd></div>` : ''}<div><dt>Прочие расходы</dt><dd>${money(number('extra'))}</dd></div></dl><p class="card-note">${weight(r.billedWeight)} кг × ${weight(r.rate)} ${r.currency}/кг<br>${r.note} · <a href="${r.source}" target="_blank" rel="noopener noreferrer">Тарифы</a>${r.clearanceUnknown ? '<br>Итог неполный: добавьте стоимость оформления.' : ''}${r.id==='u2g'&&!dims.every(Boolean)?'<br>Размеры не указаны: сумма может вырасти.':''}</p><button type="button" class="add-comparison" data-add-comparison="${index}">Добавить в сравнение</button></article>`).join('');

 }catch(error){get('error').textContent=error.message;get('error').hidden=false;get('result-content').innerHTML='<div class="empty"><h3>Проверьте данные покупки</h3><p>Исправьте ошибку и повторите расчёт.</p></div>';}
});
form.addEventListener('input',()=>{if(get('result-content').querySelector('.card')){get('result-content').innerHTML='<div class="empty"><h3>Данные изменились</h3><p>Нажмите «Сравнить стоимость», чтобы обновить расчёт.</p></div>';}});


const fx = {GEL:1};
const dates = {};
let requestVersion = 0;
let editVersion = 0;
const ids=['onex','inex','u2g'];
const carrierSites={onex:'https://www.onex.ge/',inex:'https://inex.ge/',u2g:'https://www.usa2georgia.com/'};
function neededCurrencies() {
 return [...new Set([get('currency').value,...ids.map(id=>getRoute(get('country').value,id,get('shipping-mode').value)?.currency).filter(Boolean)])].filter(c=>c!=='GEL');
}
function currentFx() {
 const result={GEL:1,[get('currency').value]:number('exchange')};
 document.querySelectorAll('[data-fx]').forEach(input=>result[input.dataset.fx]=Number(input.value));
 return result;
}
function unavailableText() {
 return ids.filter(id=>!getRoute(get('country').value,id,get('shipping-mode').value)).map(id=>`${id==='u2g'?'USA2Georgia':id.toUpperCase()}: нет подтверждённого тарифа для расчёта.`).join(' ');
}
function invalidate() { form.dispatchEvent(new Event('input',{bubbles:true})); }
function renderFx() {
 const currency=get('currency').value;
 get('exchange').value=fx[currency] ?? '';
 get('exchange').disabled=currency==='GEL';
 document.querySelector('label[for="exchange"]').textContent=`1 ${currency} в GEL`;
 document.querySelector('label[for="customs-exchange"]').textContent=`Курс таможни, ₾ за ${currency}`;
 get('additional-rates').innerHTML=neededCurrencies().filter(c=>c!==currency).map(c=>`<label for="fx-${c}">1 ${c} в GEL · для перевозки</label><input id="fx-${c}" data-fx="${c}" type="number" min="0.000001" max="100" step="any" value="${fx[c] ?? ''}" required>`).join('');
}
function updateRoute() {
 const country=get('country').value;
 get('mode-field').hidden=country!=='CN';
 get('route-origin').innerHTML=country+' <small>'+countries[country].name+'</small>';
 document.querySelector('.pill').textContent=countries[country].name+' → Грузия';
 ids.forEach(id=>{
  const route=getRoute(country,id,get('shipping-mode').value);
  get(id).disabled=!route;get(id).value=route?.rate ?? '';
  document.querySelector(`label[for="${id}"]`).textContent=route?`${id.toUpperCase()}, ${route.currency}/кг`:`${id.toUpperCase()} — нет тарифа`;
 });
 renderFx(); invalidate(); loadExchangeRate();
}
get('country').innerHTML=Object.entries(countries).map(([code,c])=>`<option value="${code}">${c.name}</option>`).join('');
get('country').addEventListener('change',()=>{
 get('currency').value=countries[get('country').value].currency;
 get('customs-exchange').value='';
 get('shipping-mode').value='air';
 updateRoute();
});
get('shipping-mode').addEventListener('change',updateRoute);
get('currency').addEventListener('change',()=>{get('customs-exchange').value='';renderFx();invalidate();loadExchangeRate();});
form.addEventListener('input',event=>{
 if(event.target.id==='exchange' || event.target.dataset?.fx){
  const code=event.target.dataset.fx || get('currency').value;
  fx[code]=Number(event.target.value);delete dates[code];editVersion++;
  get('rate-status').textContent='Курс изменён вручную. Проверьте курсы валют в «Курс и тарифы».';
 }
});
async function loadExchangeRate() {
 const version=++requestVersion, edits=editVersion;
 const needed=neededCurrencies();
 get('refresh-rate').disabled=true;
 get('rate-status').textContent='Загружаем курсы '+needed.join(', ')+' → GEL…';
 const results=await Promise.allSettled(needed.map(async c=>({c,...await fetchRate(fetch,c)})));
 if(version!==requestVersion) return;
 get('refresh-rate').disabled=false;
 if(edits!==editVersion) return;
 const failed=[];
 results.forEach((r,i)=>{if(r.status==='fulfilled'){fx[r.value.c]=r.value.rate;dates[r.value.c]=r.value.date;}else failed.push(needed[i]);});
 renderFx();invalidate();
 const text=needed.map(c=>fx[c]>0?`1 ${c} = ${fx[c]} GEL (${dates[c] || 'вручную'})`:`${c}: укажите курс вручную`).join(' · ');
 const stale=needed.some(c=>dates[c] && Date.now()-Date.parse(dates[c])>4*86400000);
 get('rate-status').textContent=text+' · Frankfurter'+(failed.length?' · Не обновились: '+failed.join(', ')+'. Проверьте сохранённые значения или введите курс вручную.':'')+(stale?' · Есть данные старше 4 дней.':'');
}
get('refresh-rate').addEventListener('click',loadExchangeRate);
updateRoute();

get('result-content').addEventListener('click',event=>{const button=event.target.closest('[data-add-comparison]');if(!button || button.disabled) return; const item=currentSnapshots[Number(button.dataset.addComparison)];if(item){comparison.add(item);button.disabled=true;button.textContent='Добавлено в сравнение';}});
