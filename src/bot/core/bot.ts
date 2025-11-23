// import { Bot } from 'grammy';
// import { BOT_TOKEN } from '../config';
// import { MyContext } from '../types/types';
// import { checkUserMiddleWare, i18n, sessionMiddleware } from './middleware';

// // --- BOT INIT ---
// if (!BOT_TOKEN) {
//   throw new Error("BOT_TOKEN is missing in environment/config!");
// }

// const bot = new Bot<MyContext>(BOT_TOKEN);

// // --- TEST COMMAND ---
// bot.command('test', async (ctx) => {
//   console.log("TEST COMMAND MESSAGE:", ctx.message);
//   await ctx.reply("Test komanda ishladi ✔️");
// });

// // --- MIDDLEWARES ---
// bot.use(sessionMiddleware);   // session
// bot.use(i18n.middleware());   // localization
// bot.use(checkUserMiddleWare); // user registration flow

// // --- COMMAND LIST ---
// bot.api.setMyCommands([
//   { command: 'start', description: 'Botni ishga tushirish' },
// ]);

// // --- GLOBAL ERROR HANDLER ---
// bot.catch((err) => {
//   console.error("Bot error caught:", err.error || err);
// });

// // --- BOT START ---
// bot.start({
//   onStart: (botInfo) => {
//     console.log(`Bot ishga tushdi: @${botInfo.username}`);
//   },
// });

// export default bot;




import { Bot } from 'grammy';
import { BOT_TOKEN } from '../config';
import { MyContext } from '../types/types';
import { checkUserMiddleWare, i18n, sessionMiddleware } from './middleware';

// --- BOT INIT ---
if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is missing in environment/config!");
}

const ADMIN_IDS = [
  5661241603,
  7546792114
];

const bot = new Bot<MyContext>(BOT_TOKEN);

// --- ADMIN ONLY MIDDLEWARE ---
bot.use(async (ctx, next) => {
  if (!ctx.from || !ADMIN_IDS.includes(ctx.from.id)) {
    // Agar foydalanuvchi admin bo'lmasa, handlerlar ishlamaydi va javob yo'q
    return;
  }
  await next(); // admin bo'lsa davom etadi
});

// --- TEST COMMAND ---
bot.command('test', async (ctx) => {
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

bot.catch(() => {
  // Bot error caught, err ignored
});


// --- BOT START ---
bot.start({
  onStart: (_botInfo) => {
    // Bot started
  },
});

export default bot;
