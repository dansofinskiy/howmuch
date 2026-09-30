import {getRoute, routeWeight, currencyCodes} from './routes.js';
export const carriers = [
  { id: 'onex', name: 'ONEX', rate: 27, currency: 'GEL', source: 'https://www.onex.ge/', note: 'Фактический вес · стандартные посылки' },
  { id: 'inex', name: 'Inex', rate: 9.7, currency: 'USD', source: 'https://old.legacy.inex.ge/en/prices', note: 'Фактический вес' },
  { id: 'u2g', name: 'USA2Georgia', rate: 9.95, currency: 'USD', source: 'https://www.usa2georgia.com/packages', note: 'Больший из фактического и объёмного веса' },
];
// USA2Georgia agreement §2¹.4. At shared boundaries use the next bracket.
export function operationalFee(value) {
  if (!Number.isFinite(value) || value < 0) throw new Error('Некорректная стоимость посылки.');
  const fee = value < 100 ? 1 : value < 200 ? 2 : value < 300 ? 3
    : value < 3000 ? value * 0.02 : value < 10000 ? value * 0.04
    : value < 20000 ? value * 0.08 : value * 0.12;
  return Math.round((fee + Number.EPSILON) * 100) / 100;
}
export function calculate({price, currency, weight, exchange, dimensions = [], country = 'US', mode = 'air', fx = {USD:exchange,GEL:1}, rates = carriers.map(c => getRoute(country,c.id,mode)?.rate ?? 1), extra = 0, customsExchange = exchange, taxMode = 'auto', originShipping = 0, customsFee = 20, clearanceFees = [15, 10, 16]}) {
  if (![price,weight,exchange,customsExchange,originShipping,extra,customsFee,...clearanceFees.filter(f=>f!==null),...rates,...dimensions].every(Number.isFinite) || customsFee < 0 || clearanceFees.length !== 3 || clearanceFees.some(f=>f!==null && f<0) || price < 0 || weight <= 0 || exchange <= 0 || customsExchange <= 0 || originShipping < 0 || extra < 0 || rates.some(r=>r<=0) || dimensions.some(d=>d<=0) || ![0,3].includes(dimensions.length) || rates.length !== 3 || !['auto','taxable'].includes(taxMode) || !currencyCodes.includes(currency)) throw new Error('Проверьте цену, вес, курс и размеры.');
  const convert = code => { const value = code === 'GEL' ? 1 : fx[code]; if(!Number.isFinite(value) || value<=0) throw new Error('Укажите курс ' + code + ' → GEL в разделе «Курс и тарифы».'); return value; };
  const product = price * convert(currency);
  const customsProduct = price * (currency === 'GEL' ? 1 : customsExchange);
  const taxable = taxMode === 'taxable' || customsProduct > 300 || weight > 30;
  const reason = taxMode === 'taxable' ? 'НДС включён вручную' : customsProduct > 300 ? 'Стоимость товара выше 300 ₾' : weight > 30 ? 'Фактический вес выше 30 кг' : 'Товар до 300 ₾ включительно и вес до 30 кг';
  return carriers.flatMap((base,i) => {
    const route = getRoute(country,base.id,mode);
    if(!route) return [];
    const carrier = {...base,...route, note: route.mode + ' · ' + (route.rule==='actual'?'Фактический вес':'Объёмный вес по условиям направления') + (route.min ? ' · минимум '+route.min+' кг' : '') + (route.note?' · '+route.note:'')};
    const billedWeight = routeWeight(route,weight,dimensions);
    const shipping = billedWeight * rates[i] * convert(carrier.currency);
    const customsShipping = billedWeight * rates[i] * (carrier.currency === currency && currency !== 'GEL' ? customsExchange : convert(carrier.currency));
    const taxBase = customsProduct + customsShipping + originShipping;
    const vat = taxable ? Math.round((taxBase * 0.18 + Number.EPSILON) * 100) / 100 : 0;
    const customsCharge = taxable ? customsFee : 0;
    const clearanceCharge = taxable ? (clearanceFees[i] ?? 0) : 0;
    const operationalCharge = carrier.id === 'u2g' ? operationalFee(product) : 0;
    const clearanceUnknown = taxable && clearanceFees[i] === null;
    const payNow = product + originShipping;
    const payLater = shipping + extra + vat + customsCharge + clearanceCharge + operationalCharge;
    return {...carrier, rate:rates[i], billedWeight, shipping, product, taxable, reason, taxBase, vat, customsCharge, clearanceCharge, clearanceUnknown, operationalCharge, payNow, payLater, total:payNow+payLater};
  });
}
