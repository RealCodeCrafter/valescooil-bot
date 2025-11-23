import bot from "../core/bot";

bot.on("callback_query:data", async (ctx) => {
    await ctx.answerCallbackQuery(); // remove loading animation
});