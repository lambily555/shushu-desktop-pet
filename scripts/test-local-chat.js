const assert = require('node:assert/strict');
const fs = require('fs');
const vm = require('vm');
const source = fs.readFileSync(require('path').join(__dirname, '..', 'src', 'main.js'), 'utf8').replace(/\r\n/g, '\n');
const body = source.match(/function localHamsterReply\(message\)\{[\s\S]*?\n\}\nfunction chatCompletionUrl/)?.[0]
  .replace(/\nfunction chatCompletionUrl[\s\S]*/, '');
if (!body) throw new Error('localHamsterReply not found');
const context = { identity:require('../src/pet-identity'), settings: { interfaceLanguage: 'zh', hunger: 80, mood: 90, chatHistory: [] }, console };
vm.createContext(context);
vm.runInContext(`${body};this.reply=localHamsterReply`, context);
const cases = [
  ['hi', /Good|Still/],
  ['when is your birthday?', /June 9, 2024/],
  ['I had a really hard day at work', /stay beside me|small step/],
  ['what snack do you like best?', /Leafy greens/],
  ['hola', /Buenos|Buenas|Sigues/],
  ['¿cuándo es tu cumpleaños?', /9 de junio de 2024/],
  ['hoy fue un día muy difícil y estoy cansada', /Quédate conmigo/],
  ['¿qué comida te gusta más?', /hojas verdes/],
  ['我今天上班好累，能安慰我吗', /慢慢呼吸/],
  ['你平时最爱吃啥呀', /菜叶/]
];
for (const [message, expected] of cases) {
  const reply = context.reply(message);
  if (!expected.test(reply)) throw new Error(`${message} -> ${reply}`);
  if (!/[\u3400-\u9fff]/.test(message) && /[\u3400-\u9fff]/.test(reply)) throw new Error(`${message} -> ${reply}`);
  console.log(`PASS ${message} -> ${reply}`);
}

context.settings.townMainProfile={id:'new-main',name:'糯糯',birthDate:'2026-01-03',sex:'female',weight:'28克'};context.settings.syncTownProfile=true;assert.match(context.reply('你叫什么'),/糯糯/);assert.match(context.reply('你的生日'),/2026-01-03/);context.settings.syncTownProfile=false;assert.match(context.reply('你叫什么'),/鼠鼠/);assert.match(context.reply('你的生日'),/2024/);console.log('Home chat identity follows profile preference');
