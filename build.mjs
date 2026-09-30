import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','app.js','calculator.js','exchange.js','routes.js','comparison.js','categories.js']) await copyFile(file,`dist/${file}`);
await copyFile('.nojekyll','dist/.nojekyll');
