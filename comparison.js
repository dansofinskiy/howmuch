const KEY='howmuch.comparison.v1';
export function snapshot(input,result,context) {
 return JSON.parse(JSON.stringify({id:crypto.randomUUID(),savedAt:new Date().toISOString(),input,result,context}));
}
export function readComparisons(storage) {
 const data=JSON.parse(storage.getItem(KEY)||'[]');
 if(!Array.isArray(data) || !data.every(x=>x && typeof x.id==='string' && x.input && x.context && x.result && Number.isFinite(x.result.total))) throw new Error('Некорректные сохранённые данные');
 return data;
}
export function saveComparisons(storage,items) { storage.setItem(KEY,JSON.stringify(items)); }
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function setupComparison(money) {
 const dialog=document.getElementById('comparison-dialog');
 const open=document.getElementById('open-comparison');
 const status=document.getElementById('comparison-status');
 let items=[];
 try {items=readComparisons(sessionStorage);} catch {status.textContent='Не удалось восстановить сравнение. Новые варианты доступны до закрытия страницы.';}
 function persist(){try{saveComparisons(sessionStorage,items);}catch{status.textContent='Хранилище сессии недоступно. Варианты сохранятся только до обновления страницы.';}}
 const fields=[
  ['Сразу: товар + до склада',x=>money(x.result.payNow ?? (x.result.product+x.input.originShipping))],
  ['Потом ≈',x=>money(x.result.payLater ?? (x.result.total-x.result.product-x.input.originShipping))],
  ['Страна',x=>x.context.country],['Категория',x=>x.context.category],['Способ',x=>x.result.mode],
  ['Цена в магазине',x=>`${x.input.price} ${x.input.currency}`],['Товар, GEL',x=>money(x.result.product)],
  ['Вес с упаковкой',x=>`${x.input.weight} кг`],['Размеры',x=>x.input.dimensions.length?x.input.dimensions.join(' × ')+' см':'Не указаны'],
  ['Параметры',x=>x.context.manualPackage?'Уточнены вручную':'Оценка категории'],['Оплачиваемый вес',x=>`${Number(x.result.billedWeight.toFixed(3))} кг`],
  ['Тариф',x=>`${x.result.rate} ${x.result.currency}/кг`],['Перевозка ≈',x=>money(x.result.shipping)],
  ['До склада',x=>money(x.input.originShipping)],['База НДС',x=>money(x.result.taxBase)],['НДС',x=>money(x.result.vat)],
  ['Сбор таможни',x=>money(x.result.customsCharge)],['Оформление',x=>x.result.clearanceUnknown?'Не задано':money(x.result.clearanceCharge)],
  ['Операционный сбор',x=>money(x.result.operationalCharge)],['Прочие расходы',x=>money(x.input.extra)],
  ['Срок ≈',x=>x.result.delivery.label],['Отсчёт срока',x=>x.result.delivery.detail],
  ['Курсы в GEL',x=>Object.entries(x.input.fx).map(([c,v])=>`${c}: ${v}`).join('; ')],
  ['Курс таможни',x=>`${x.input.customsExchange} GEL/${x.input.currency}`],
  ['Даты курсов',x=>Object.entries(x.context.rateDates).map(([c,d])=>`${c}: ${d}`).join('; ')||'Введены вручную'],
  ['Режим НДС',x=>x.input.taxMode==='auto'?'Автоматически':'Начислить всегда'],
  ['Сохранено',x=>new Date(x.savedAt).toLocaleString('ru-RU')],
 ];
 function render(){
  open.textContent=`Сравнение (${items.length})`;
  const target=document.getElementById('comparison-content');
  if(!items.length){target.innerHTML='<div class="empty"><h3>Пока нет вариантов</h3><p>Рассчитайте доставку и нажмите «Добавить в сравнение» у нужного перевозчика.</p></div>';return;}
  const sorted=[...items].sort((a,b)=>a.result.total-b.result.total);
  target.innerHTML='<div class="comparison-scroll" tabindex="0" aria-label="Таблица сравнения, прокрутка по горизонтали"><table><caption>Варианты по возрастанию итоговой суммы. Незаданные сборы не включены.</caption><thead><tr><th scope="col">Параметр</th>'+sorted.map(x=>`<th scope="col">${escape(x.result.name)}<br><small>${escape(x.context.country)} · ${escape(x.context.category)}</small><button type="button" class="remove-comparison" data-remove="${escape(x.id)}" aria-label="Удалить ${escape(x.result.name)} из ${escape(x.context.country)}">Удалить</button></th>`).join('')+'</tr></thead><tbody><tr class="comparison-total"><th scope="row">Итого ≈</th>'+sorted.map(x=>`<td>${money(x.result.total)}${x.result.clearanceUnknown?'<small>Без стоимости оформления</small>':''}<small>+ ${money(x.result.total-sorted[0].result.total)} к наименьшей сумме</small></td>`).join('')+'</tr>'+fields.map(([label,value])=>`<tr><th scope="row">${escape(label)}</th>${sorted.map(x=>`<td>${escape(value(x))}</td>`).join('')}</tr>`).join('')+'</tbody></table></div>';
 }
 open.addEventListener('click',()=>{render();dialog.showModal();});
 document.getElementById('close-comparison').addEventListener('click',()=>dialog.close());
 document.getElementById('clear-comparison').addEventListener('click',()=>{items=[];persist();render();});
 dialog.addEventListener('click',event=>{const button=event.target.closest('[data-remove]');if(button){items=items.filter(x=>x.id!==button.dataset.remove);persist();render();}});
 render();
 return {add(item){items.push(item);status.textContent='Вариант добавлен в сравнение.';persist();render();}};
}
