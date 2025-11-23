import * as path from 'path';
import { I18n } from '@grammyjs/i18n';
import { NextFunction, session } from 'grammy';
import { SessionData } from '../types/session';
import { MyContext } from '../types/types';
import { User } from '../../db/entities/user.entity';
import { AppDataSource } from '../../db/connect.db';
import { chooseLang } from '../helpers/inline.keyboard';
import { contactRequestKeyboard } from '../helpers/keyboard';
import { FORWARD_MESSAGES_CHANNEL_ID, messageIds, ADMIN_TG_ID } from '../config';

export type BotLanguage = 'uz' | 'ru';

function initial(): SessionData {
  return {
    step: '',
    user_state: '',
    is_editable_message: false,
    is_editable_image: false,
    main_menu_message: undefined,
    user: {
      id: 1,
      first_name: '',
      is_bot: false,
      db_id: '',
      lang: 'uz',
    },
  };
}

export const sessionMiddleware = session({ initial });

export const i18n = new I18n({
  defaultLanguageOnMissing: true,
  directory: path.resolve(__dirname, '../locales'),
  defaultLanguage: 'uz' as BotLanguage,
  sessionName: 'i18n_session',
  useSession: true,
});

// Til so‘rash
async function registerUserLang(ctx: MyContext) {
  ctx.session.user_state = 'REGISTER_LANG';
  return await ctx.reply(ctx.i18n.t('auth.requestChooseLang'), {
    reply_markup: chooseLang,
    parse_mode: 'HTML',
  });
}

// Ism so‘rash
export async function registerUserFirstName(ctx: MyContext) {
  ctx.session.user_state = 'REGISTER_NAME';
  ctx.session.is_editable_message = false;
  ctx.session.is_editable_image = false;
  
  // Ism so'rash xabarini yuborish (agar forwardMessage ishlamasa, oddiy reply)
  try {
    const nameMessageId = messageIds[ctx.i18n.languageCode as BotLanguage].auth.requestName;
    // Agar nameMessageId va start bir xil bo'lsa, oddiy reply yuboramiz
    if (nameMessageId === messageIds[ctx.i18n.languageCode as BotLanguage].start) {
      return await ctx.reply(ctx.i18n.t('auth.requestName'), { parse_mode: 'HTML' });
    }
    return await ctx.api.forwardMessage(
      ctx.from.id,
      FORWARD_MESSAGES_CHANNEL_ID,
      nameMessageId
    );
  } catch {
    return await ctx.reply(ctx.i18n.t('auth.requestName'), { parse_mode: 'HTML' });
  }
}

export const checkUserMiddleWare = async (ctx: MyContext, next: NextFunction) => {
  if (ctx.chat?.type !== 'private') return;

  // /admin buyrug'ini o'tkazib yuborish
  if (ctx.message?.text?.startsWith('/admin')) {
    return next();
  }

  // // Admin document yuborayotganda o'tkazib yuborish
  // if (ctx.message?.document && ctx.from?.id === ADMIN_TG_ID) {
  //   return next();
  // }

  ctx.session.user_state = ctx.session.user_state || '';
  ctx.session.user.id = ctx.from?.id as number;
  ctx.session.user.first_name = ctx.from?.first_name || '';
  ctx.session.user.is_bot = ctx.from?.is_bot || false;

  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { tgId: ctx.from?.id } as any });

  // /start bosilganda
  if (ctx.message?.text?.startsWith('/start')) {
    if (!user) {
      // Yangi foydalanuvchi - bazaga yozmaslik, faqat session sozlash
      ctx.session.user.db_id = '';
      ctx.session.user.first_name = ctx.from?.first_name || '';
      ctx.session.user.lang = 'uz';
    } else {
      // Mavjud foydalanuvchi
      ctx.session.user.db_id = user._id.toString();
      ctx.session.user.first_name = user.firstName || '';
      ctx.session.user.lang = user.lang || 'uz';
      ctx.i18n.locale(user.lang || 'uz');
    }
    ctx.session.user_state = 'REGISTER_LANG';
    return registerUserLang(ctx);
  }

  // Yangi foydalanuvchi (bazada yo'q)
  if (!user) {
    ctx.session.user.db_id = ctx.session.user.db_id || '';

    // Til tanlash jarayonida bo'lsa, callbackQuery ni next() ga o'tkazish (settings.action.ts da boshqariladi)
    if (ctx.session.user_state === 'REGISTER_LANG' && ctx.callbackQuery) {
      return next();
    }

    // Ism kiritish jarayonida bo'lsa, next() ga o'tkazish
    if (ctx.session.user_state === 'REGISTER_NAME' && ctx.message?.text && !ctx.message.text.includes('/')) {
      return next();
    }

    // Telefon kiritish jarayonida bo'lsa, next() ga o'tkazish
    if (ctx.session.user_state === 'REGISTER_PHONE_NUMBER' && (ctx.message?.contact || (ctx.message?.text && !ctx.message.text.includes('/')))) {
      return next();
    }

    // Agar yangi foydalanuvchi va hech nima qilmagan bo'lsa → til so'rash
    return registerUserLang(ctx);
  }

  // Foydalanuvchi bazada mavjud
  ctx.session.user.db_id = user._id;
  ctx.session.user.first_name = user.firstName || '';
  ctx.session.user.id = user.id;
  ctx.session.user.lang = user.lang || 'uz';
  ctx.i18n.locale(user.lang || 'uz');

  // 1️⃣ Til yo'q
  if (!user.lang) {
    if (ctx.session.user_state === 'REGISTER_LANG' && ctx.callbackQuery) return next();
    return registerUserLang(ctx);
  }

  // 2️⃣ Ism yo'q
  if (!user.firstName) {
    if (ctx.session.user_state === 'REGISTER_NAME' && ctx.message?.text && !ctx.message.text.includes('/')) return next();
    return registerUserFirstName(ctx);
  }

  // 3️⃣ Telefon yo'q
  if (!user.phoneNumber) {
    if (ctx.session.user_state === 'REGISTER_PHONE_NUMBER' && (ctx.message?.contact || (ctx.message?.text && !ctx.message.text.includes('/')))) return next();
    ctx.session.user_state = 'REGISTER_PHONE_NUMBER';
    return await ctx.reply(ctx.i18n.t('auth.requestPhoneNumber'), {
      reply_markup: contactRequestKeyboard(ctx.i18n.t('auth.requestPhoneNumber')),
      parse_mode: 'HTML',
    });
  }

  // Foydalanuvchi to'liq ro'yxatdan o'tgan - hammasi bor, davom etish
  return next();
};
