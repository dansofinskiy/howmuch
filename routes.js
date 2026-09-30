export const countries = {
 US:{name:'США',currency:'USD'}, GB:{name:'Великобритания',currency:'GBP'},
 DE:{name:'Германия',currency:'EUR'}, CN:{name:'Китай',currency:'CNY'},
 TR:{name:'Турция',currency:'TRY'}, GR:{name:'Греция',currency:'EUR'},
};
export const currencyCodes=['USD','EUR','GBP','CNY','TRY','GEL'];
const onex='https://www.onex.ge/ru';
const inex='https://old.legacy.inex.ge/en/prices';
const u2g='https://www.usa2georgia.com/packages';
const route=(rate,currency,mode,rule,source,min=0,note='')=>({rate,currency,mode,rule,source,min,note});
export const routes={
 US:{onex:route(27,'GEL','Авиа','actual',onex),inex:route(9.7,'USD','Авиа','actual',inex,.1,'Таблица тарифов: $9,70; новость 2025 года: $8,50. Уточните перед покупкой.'),u2g:route(9.95,'USD','Авиа','volume',u2g)},
 GB:{onex:route(27,'GEL','Авиа','actual',onex),inex:route(7.5,'GBP','Авиа','actual',inex,.2)},
 DE:{onex:route(29,'GEL','Авиа','actual',onex,0,'Для стандартных посылок; негабарит уточняйте у Onex.'),inex:route(8,'EUR','Наземная','actual',inex,.2)},
 CN:{onex:route(35,'GEL','Авиа','actual',onex,0,'Для стандартных посылок; негабарит уточняйте у Onex.'),u2g:route(12,'USD','Авиа','volume',u2g)},
 TR:{inex:route(4,'USD','Наземная','actual',inex,.1),u2g:route(4,'USD','Наземная','turkey',u2g)},
 GR:{inex:route(3.5,'EUR','Наземная','actual',inex,.2),u2g:route(3.5,'EUR','Наземная','greece',u2g)},
};
const deliverySources = {
 onex:'https://blog.onex.ge/welcome-to-onex-rus',
 inex:'https://inex.ge/ka/shipment-information?lang=eng',
 u2g:'https://www.usa2georgia.com/packages',
};
export function deliveryEstimate(country,id,mode='air') {
 if(id==='onex') return {label: ['US','GB'].includes(country)?'4–8 рабочих дней':'5–10 рабочих дней', detail:'С момента поступления на зарубежный склад Onex.', source:deliverySources.onex};
 if(id==='inex') return {label:['TR','GR'].includes(country)?'5–7 дней':'5–10 дней', detail:'В пути после отправки. Ожидание рейса и таможня — дополнительно; затем сортировка 0–2 дня и доставка в филиал 0–3 дня.', source:deliverySources.inex};
 const label=country==='CN'?(mode==='road'?'30–45 рабочих дней':'5–8 рабочих дней'):country==='GR'?'7–14 рабочих дней':'7–10 рабочих дней';
 return {label,detail:'Ориентир международной перевозки из карточки тарифа. Доставка магазина, ожидание отправки и таможня могут увеличить срок.',source:deliverySources.u2g};
}
export function getRoute(country,id,mode='air') {
 if(!countries[country]) throw new Error('Неизвестная страна');
 const selected=country==='CN' && mode==='road'
   ? (id==='u2g' ? route(5.5,'USD','Наземная','china-road',u2g) : null)
   : routes[country][id];
 return selected ? {...selected,delivery:deliveryEstimate(country,id,mode)} : null;
}
export function routeWeight(route,weight,dimensions) {
 const volume=dimensions.length ? dimensions.reduce((a,b)=>a*b,1)/6000 : 0;
 const useVolume=route.rule==='volume' || route.rule==='china-road' && Math.max(weight,volume)>=30 || route.rule==='turkey' && volume>50 || route.rule==='greece' && Math.max(weight,volume)>50;
 return Math.max(route.min,weight,useVolume?volume:0);
}
