const fs = require('fs');
const vm = require('vm');
const source = fs.readFileSync(require('path').join(__dirname, '..', 'src', 'main.js'), 'utf8');
const body = source.match(/function localHamsterReply\(message\)\{[\s\S]*?\n\}\nipcMain\.handle\('ai-chat'/)?.[0]
  .replace(/\nipcMain\.handle\('ai-chat'[\s\S]*/, '');
if (!body) throw new Error('localHamsterReply not found');
const context = { settings: { interfaceLanguage: 'zh', hunger: 80, mood: 90, chatHistory: [] }, console };
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
