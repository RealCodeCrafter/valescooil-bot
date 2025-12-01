import { Bot } from 'grammy';
import { BOT_TOKEN } from '../config';
import { MyContext } from '../types/types';
import { checkUserMiddleWare, i18n, sessionMiddleware } from './middleware';

// --- BOT INIT ---
if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is missing in environment/config!");
}

const bot = new Bot<MyContext>(BOT_TOKEN);

// --- TEST COMMAND ---
bot.command('test', async (ctx) => {
  console.log("TEST COMMAND MESSAGE:", ctx.message);
  await ctx.reply("Test komanda ishladi ✔️");
});

// --- MIDDLEWARES ---
bot.use(sessionMiddleware);   // session
bot.use(i18n.middleware());   // localization
bot.use(checkUserMiddleWare); // user registration flow

// --- COMMAND LIST ---
bot.api.setMyCommands([
  { command: 'start', description: 'Botni ishga tushirish' },
]);

// --- GLOBAL ERROR HANDLER ---
bot.catch((err) => {
  console.error("Bot error caught:", err.error || err);
});

// --- BOT START ---
bot.start({
  onStart: (botInfo) => {
    console.log(`Bot ishga tushdi: @${botInfo.username}`);
  },
});

export default bot;

