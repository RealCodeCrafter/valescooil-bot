import { CallbackActions, Languages } from "../types/enum";
import { MyContext } from "../types/types";
import bot from "../core/bot";
import {
  languagesListInline,
  settingsInline,
} from "../helpers/inline.keyboard";
import { User } from "../../db/entities/user.entity";
import { AppDataSource } from "../../db/connect.db";
import { registerUserFirstName } from "../core/middleware";

async function setLang(ctx: MyContext, lang: string) {
  // Foydalanuvchi mavjudligini tekshirish
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { tgId: ctx.from?.id } as any });
  
  if (user) {
    // Agar foydalanuvchi bazada bo'lsa, yangilash (faqat til)
    await userRepository.update(user._id, { lang: lang });
  }
  // Agar foydalanuvchi bazada yo'q bo'lsa, bazaga yozmaslik
  // Faqat session da saqlash
  // Bazaga yozish faqat ism va telefon kiritilgandan keyin bo'ladi
  
  // Session da saqlash
  ctx.session.user.lang = lang;
  ctx.i18n.locale(lang);
}

bot.callbackQuery(CallbackActions.SETTINGS, async (ctx) => {
  await ctx.answerCallbackQuery();

  if (ctx.session.is_editable_message == true) {
    return await ctx.editMessageText(ctx.i18n.t("menu.settingsContent"), {
      reply_markup: settingsInline(ctx),
    });
  } else {
    ctx.session.is_editable_message = true;
    return await ctx.reply(ctx.i18n.t("menu.settingsContent"), {
      reply_markup: settingsInline(ctx),
    });
  }
});

bot.callbackQuery(CallbackActions.LANG_LIST, async (ctx) => {
  await ctx.answerCallbackQuery();

  if (ctx.session.is_editable_message == true) {
    return await ctx.editMessageText(ctx.i18n.t("menu.langListContent"), {
      reply_markup: languagesListInline(ctx),
    });
  } else {
    ctx.session.is_editable_message = true;
    return await ctx.reply(ctx.i18n.t("menu.langListContent"), {
      reply_markup: languagesListInline(ctx),
    });
  }
});

bot.callbackQuery(
  new RegExp(`^${CallbackActions.CHANGE_LANG}.`),
  async (ctx) => {
    await ctx.answerCallbackQuery();

    const [, lang] = ctx.callbackQuery.data.split(".");

    if (ctx.session.user.lang == lang && ctx.session.user_state !== "REGISTER_LANG") return;

    await setLang(ctx, lang as string);

    if (ctx.session.user_state === "REGISTER_LANG") {
      await ctx.deleteMessage();
      
      // Foydalanuvchi mavjudligini tekshirish
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { tgId: ctx.from?.id } as any });
      
      // Agar foydalanuvchi to'liq ro'yxatdan o'tgan bo'lsa (ism va telefon bor), kod so'rash yuborish
      if (user && user.firstName && user.phoneNumber) {
        const { FORWARD_MESSAGES_CHANNEL_ID, messageIds } = await import('../config');
        await ctx.api.forwardMessage(
          ctx.from.id, 
          FORWARD_MESSAGES_CHANNEL_ID, 
          messageIds[ctx.i18n.languageCode as 'uz' | 'ru'].start
        );
        ctx.session.user_state = '';
        return;
      }
      
      // Agar foydalanuvchi to'liq ro'yxatdan o'tmagan bo'lsa (ism yoki telefon yo'q), ism so'rash
      // REGISTER_NAME holatini o'rnatish va ism so'rash xabarini yuborish
      ctx.session.user_state = 'REGISTER_NAME';
      return await registerUserFirstName(ctx);
    }

    if (ctx.session.is_editable_message == true) {
      return await ctx.editMessageText(ctx.i18n.t("menu.langListContent"), {
        reply_markup: languagesListInline(ctx),
      });
    } else {
      ctx.session.is_editable_message = true;
      return await ctx.reply(ctx.i18n.t("menu.langListContent"), {
        reply_markup: languagesListInline(ctx),
      });
    }
  },
);
