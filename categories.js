// Planning estimates for one packaged item, not manufacturer specifications.
const item=(id,name,weight,length,width,height)=>({id,name,package:[weight,length,width,height]});
export const categoryGroups=[
 {id:'sport',name:'Спорт',items:[
  item('sneakers','Кроссовки',1.2,35,25,15),item('sport-shirt','Спортивная футболка',.3,30,25,3),
  item('shorts','Шорты / легинсы',.4,30,25,5),item('tracksuit','Спортивный костюм',1.2,35,30,10),
  item('ball','Мяч без воздуха',.6,25,20,10),item('racket','Теннисная ракетка',.7,75,32,8),
  item('gloves','Боксёрские перчатки',1.3,40,25,18),item('fitness-bands','Фитнес-резинки, набор',.5,25,20,8)]},
 {id:'outdoor',name:'Аутдор',items:[
  item('hiking-boots','Треккинговые ботинки',1.8,38,28,16),item('backpack','Рюкзак 20–35 л',1.2,50,35,15),
  item('tent','Палатка двухместная',3,55,20,20),item('sleeping-bag','Спальный мешок',1.6,40,25,25),
  item('sleeping-pad','Надувной коврик',.8,30,15,15),item('poles','Складные треккинговые палки',.8,65,15,10),
  item('shell','Мембранная куртка',.7,35,30,8),item('thermos','Термос 0,75–1 л',.7,32,12,12)]},
 {id:'tech',name:'Техника',items:[
  item('phone','Смартфон',.5,20,12,8),item('headphones','Полноразмерные наушники',.6,25,20,12),
  item('earbuds','Беспроводные наушники-вкладыши',.2,12,10,6),item('laptop','Ноутбук 13–15″',3,45,35,12),
  item('tablet','Планшет',1,30,23,8),item('watch','Смарт-часы',.3,20,12,8),
  item('keyboard','Клавиатура',1.2,48,20,8),item('mouse','Мышь',.3,18,12,8),item('camera','Фотоаппарат с объективом',1.5,30,25,20)]},
 {id:'clothes',name:'Одежда',items:[item('tshirt','Футболка',.3,30,25,3),item('hoodie','Худи / свитшот',.8,35,30,8),item('jeans','Джинсы',.9,35,30,5),item('jacket','Куртка',1.3,40,35,15)]},
 {id:'other',name:'Другое',items:[item('book','Книга',.7,25,18,5)]},
];
export function subcategories(groupId){
 const group=categoryGroups.find(g=>g.id===groupId);
 if(!group) throw new Error('Неизвестная категория');
 return [...group.items,{id:'custom',name:'Другое — свои параметры',package:null}];
}
export function packagePreset(groupId,itemId){
 const item=subcategories(groupId).find(i=>i.id===itemId);
 if(!item) throw new Error('Неизвестная подкатегория');
 return item.package ? [...item.package] : null;
}
