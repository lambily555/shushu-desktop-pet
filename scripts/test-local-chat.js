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
  ['hola', /Buenos|Buenas|Sigues/],
  ['¿cuándo es tu cumpleaños?', /9 de junio de 2024/]
];
for (const [message, expected] of cases) {
  const reply = context.reply(message);
  if (!expected.test(reply) || /[\u4e00-\u9fff]/.test(reply)) throw new Error(`${message} -> ${reply}`);
  console.log(`PASS ${message} -> ${reply}`);
}
