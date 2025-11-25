import { Code } from '../../db/entities/code.entity';
import { Winner } from '../../db/entities/winner.entity';
import { MyContext } from '../types/types';
import bot from '../core/bot';
import { User, UserRole } from '../../db/entities/user.entity';
import { contactRequestKeyboard } from '../helpers/keyboard';
import { isAdmin, FORWARD_MESSAGES_CHANNEL_ID, messageIds } from '../config';
import { CodeLog } from '../../db/entities/code-log.entity';
import { AppDataSource } from '../../db/connect.db';
import { Settings } from '../../db/entities/settings.entity';
import { BotLanguage } from '../core/middleware';
import { Gift } from '../../db/entities/gift.entity';
import { phoneCheck } from '../helpers/util';
import { IsNull, In } from 'typeorm';

type GiftTier = 'premium' | 'standard' | 'economy' | 'symbolic';

const norm = (s: string) => (s || '').trim().toUpperCase().replace(/-/g, '');
const hyphenize = (s: string) =>
  s.includes('-') ? s : s.length > 6 ? s.slice(0, 6) + '-' + s.slice(6) : s;

// ======================
// 1) ISM RO'YXATDAN O'TKAZISH
// ======================
async function registerUserName(ctx: MyContext) {
  const text = ctx.message!.text?.trim();
  if (!text) return;

  const userRepository = AppDataSource.getRepository(User);
  let user = await userRepository.findOne({ where: { tgId: ctx.from?.id } as any });

  if (user) {
    // Admin ID'ni tekshirish va role ni yangilash
    const isUserAdmin = isAdmin(ctx.from?.id);
    const updateData: any = { firstName: text };
    if (isUserAdmin && user.role !== UserRole.ADMIN) {
      updateData.role = UserRole.ADMIN;
    }
    await userRepository.update(user._id, updateData);
    ctx.session.user.db_id = user._id.toString();
  } else {
    const count = await userRepository.count();
    // Admin ID'ni tekshirish
    const isUserAdmin = isAdmin(ctx.from?.id);
    const newUser = userRepository.create({
      id: count + 1,
      tgId: ctx.from?.id,
      tgFirstName: ctx.from?.first_name || '',
      tgLastName: ctx.from?.last_name || '',
      firstName: text,
      lang: ctx.session.user.lang || 'uz',
      phoneNumber: '',
      lastUseAt: new Date(),
      role: isUserAdmin ? UserRole.ADMIN : UserRole.USER,
    });
    const saved = await userRepository.save(newUser);
    ctx.session.user.db_id = saved._id.toString();
  }

  ctx.session.user.first_name = text;
  ctx.session.user_state = 'REGISTER_PHONE_NUMBER';
  ctx.session.is_editable_message = false;
  ctx.session.is_editable_image = false;

  return ctx.reply(ctx.i18n.t('auth.requestPhoneNumber'), {
    reply_markup: contactRequestKeyboard(ctx.i18n.t('auth.sendContact')),
    parse_mode: 'HTML',
  });
}

// ======================
// 2) TELEFON RAQAM QABUL QILISH
// ======================
async function registerUserPhoneNumber(ctx: MyContext) {
  const text = ctx.message?.text?.replace(/\s+/g, '').replace('+', '');
  const contact = ctx.message?.contact;
  let phone = '';

  if (text && phoneCheck(text)) phone = text;
  else if (contact?.phone_number && phoneCheck(contact.phone_number)) phone = contact.phone_number;
  else return ctx.reply(ctx.i18n.t('validation.invalidPhoneNumber'));

  phone = phone.replace('+', '');

  const userRepository = AppDataSource.getRepository(User);
  let user = await userRepository.findOne({ where: { tgId: ctx.from?.id } as any });

  if (user) {
    // Admin ID'ni tekshirish va role ni yangilash
    const isUserAdmin = isAdmin(ctx.from?.id);
    const updateData: any = {
      phoneNumber: phone,
      firstName: ctx.session.user.first_name || user.firstName || '',
    };
    if (isUserAdmin && user.role !== UserRole.ADMIN) {
      updateData.role = UserRole.ADMIN;
    }
    await userRepository.update(user._id, updateData);
    ctx.session.user.db_id = user._id.toString();
  } else {
    const count = await userRepository.count();
    // Admin ID'ni tekshirish
    const isUserAdmin = isAdmin(ctx.from?.id);
    const newUser = userRepository.create({
      id: count + 1,
      tgId: ctx.from?.id,
      tgFirstName: ctx.from?.first_name || '',
      tgLastName: ctx.from?.last_name || '',
      firstName: ctx.session.user.first_name || '',
      lang: ctx.session.user.lang || 'uz',
      phoneNumber: phone,
      lastUseAt: new Date(),
      role: isUserAdmin ? UserRole.ADMIN : UserRole.USER,
    });
    const saved = await userRepository.save(newUser);
    ctx.session.user.db_id = saved._id.toString();
  }

  ctx.session.user_state = '';
  ctx.session.is_editable_message = false;
  ctx.session.is_editable_image = false;

  const msg = await ctx.reply('.', { reply_markup: { remove_keyboard: true } });
  await ctx.api.deleteMessage(msg.chat.id, msg.message_id).catch(() => {});

  // Telefon kiritilgandan keyin kod so'rash xabarini yuborish
  await ctx.api.forwardMessage(ctx.from.id, FORWARD_MESSAGES_CHANNEL_ID, messageIds[ctx.i18n.languageCode as BotLanguage].start);

  return;
}

// ======================
// 3) KOD TEKSHIRISH
// ======================
async function checkCode(ctx: MyContext) {
  const lang = ctx.i18n.languageCode as BotLanguage;

  const MESSAGES: Record<BotLanguage, Record<string, string>> = {
    uz: { invalidFormat: '❌ Noto\'g\'ri kod formati kiritdingiz.' },
    ru: { invalidFormat: '❌ Вы ввели неверный код.' },
  };

  if (ctx.session.is_editable_message && ctx.session.main_menu_message) {
    await ctx.api.editMessageReplyMarkup(ctx.message!.chat.id, ctx.session.main_menu_message.message_id, { reply_markup: { inline_keyboard: [] } });
    ctx.session.main_menu_message = undefined;
  }

  ctx.session.is_editable_message = false;
  ctx.session.is_editable_image = false;

  const codeRepository = AppDataSource.getRepository(Code);
  const codeLogRepository = AppDataSource.getRepository(CodeLog);
  const settingsRepository = AppDataSource.getRepository(Settings);
  const winnerRepository = AppDataSource.getRepository(Winner);
  const giftRepository = AppDataSource.getRepository(Gift);

  const usedCount = await codeRepository.count({
    where: { usedById: ctx.session.user.db_id, deletedAt: IsNull() } as any,
  });
  const settings = await settingsRepository.findOne({
    where: { deletedAt: IsNull() } as any,
  });

  if (settings?.codeLimitPerUser?.status && usedCount >= (settings.codeLimitPerUser?.value || 0)) {
    return ctx.api.forwardMessage(ctx.from.id, FORWARD_MESSAGES_CHANNEL_ID, messageIds[lang].codeUsageLimit);
  }

  let rawText = (ctx.message?.text ?? '').trim().toUpperCase();
  if (/^[A-Z]{6}\d{4}$/.test(rawText)) rawText = `${rawText.slice(0, 6)}-${rawText.slice(6)}`;

  if (!/^[A-Z]{6}-\d{4}$/.test(rawText)) {
    return ctx.reply(MESSAGES[lang]?.invalidFormat || MESSAGES.uz.invalidFormat, { parse_mode: 'HTML' });
  }

  const normalized = norm(rawText);
  const hy = hyphenize(rawText);

  // AVVAL WINNERS DAN TEKSHIRISH (g'olib kodlar muhimroq)
  let winner = await winnerRepository.findOne({
    where: [
      { value: rawText, deletedAt: IsNull() },
      { value: hy, deletedAt: IsNull() },
      { value: normalized, deletedAt: IsNull() },
      { value: rawText.replace(/-/g, ''), deletedAt: IsNull() },
    ] as any,
  });

  // Agar winners da topilmasa, codes dan tekshirish
  let code = null;
  if (!winner) {
    code = await codeRepository.findOne({
      where: [
        { value: rawText, deletedAt: IsNull() },
        { value: hy, deletedAt: IsNull() },
        { value: normalized, deletedAt: IsNull() },
        { value: rawText.replace(/-/g, ''), deletedAt: IsNull() },
      ] as any,
    });
  }

  await codeLogRepository.save({
    userId: ctx.session.user.db_id,
    value: ctx.message?.text || '',
    codeId: code?._id ?? winner?._id ?? null,
  }).catch(() => {});

  // Agar hech qayerda topilmasa
  if (!code && !winner) {
    return ctx.api.forwardMessage(ctx.from.id, FORWARD_MESSAGES_CHANNEL_ID, messageIds[lang].codeFake);
  }

  // Winner kod topilgan bo'lsa
  if (winner) {
    // BIR MARTALIK TEKSHIRISH - agar kod ishlatilgan bo'lsa, hech kim uni ishlata olmaydi
    if (winner.isUsed) {
      return ctx.api.forwardMessage(ctx.from.id, FORWARD_MESSAGES_CHANNEL_ID, messageIds[lang].codeUsed);
    }

    // Atomik operatsiya bilan kodni ishlatilgan deb belgilash (race condition oldini olish)
    const updateResult = await winnerRepository.update(
      { 
        _id: winner._id,
        isUsed: false, // Faqat ishlatilmagan kodlarni yangilash
      } as any,
      { isUsed: true, usedAt: new Date(), usedById: ctx.session.user.db_id }
    );

    // Agar updateResult.affected === 0 bo'lsa, demak kod boshqa foydalanuvchi tomonidan ishlatilgan
    if (updateResult.affected === 0) {
      // Yangi holatni tekshirish
      const updatedWinner = await winnerRepository.findOne({ where: { _id: winner._id } as any });
      if (updatedWinner?.isUsed) {
        return ctx.api.forwardMessage(ctx.from.id, FORWARD_MESSAGES_CHANNEL_ID, messageIds[lang].codeUsed);
      }
    }

    // Winner kod uchun tier aniqlash
    const tier = winner.tier as GiftTier | null;
    
    if (!tier) {
      return ctx.api.forwardMessage(ctx.from.id, FORWARD_MESSAGES_CHANNEL_ID, messageIds[lang].codeReal);
    }

    // Gift topish
    const gift = await giftRepository.findOne({
      where: { type: tier, deletedAt: IsNull() } as any,
    });
    
    if (!gift) {
      return ctx.api.forwardMessage(ctx.from.id, FORWARD_MESSAGES_CHANNEL_ID, messageIds[lang].codeReal);
    }

    // Gift topilgan bo'lsa, sovg'a xabari yuboramiz
    await giftRepository.update({ _id: gift._id } as any, { usedCount: gift.usedCount + 1 });
    return ctx.api.forwardMessage(ctx.from.id, FORWARD_MESSAGES_CHANNEL_ID, messageIds[lang].codeWithGift[tier]);
  }

  // Oddiy kod topilgan bo'lsa
  if (!code) {
    return ctx.api.forwardMessage(ctx.from.id, FORWARD_MESSAGES_CHANNEL_ID, messageIds[lang].codeFake);
  }

  // BIR MARTALIK TEKSHIRISH - agar kod ishlatilgan bo'lsa
  if (code.isUsed) {
    return ctx.api.forwardMessage(ctx.from.id, FORWARD_MESSAGES_CHANNEL_ID, messageIds[lang].codeUsed);
  }

  // Atomik operatsiya bilan kodni ishlatilgan deb belgilash
  const updateResult = await codeRepository.update(
    { 
      _id: code._id,
      isUsed: false, // Faqat ishlatilmagan kodlarni yangilash
    } as any,
    { isUsed: true, usedAt: new Date(), usedById: ctx.session.user.db_id }
  );

  // Agar updateResult.affected === 0 bo'lsa, demak kod boshqa foydalanuvchi tomonidan ishlatilgan
  if (updateResult.affected === 0) {
    const updatedCode = await codeRepository.findOne({ where: { _id: code._id } as any });
    if (updatedCode?.isUsed) {
      return ctx.api.forwardMessage(ctx.from.id, FORWARD_MESSAGES_CHANNEL_ID, messageIds[lang].codeUsed);
    }
  }

  // Oddiy kod - hech qanday sovg'a yo'q
  // Agar kod CodeModel da bo'lsa va giftId bo'lsa, gift topamiz
  if (code && code.giftId) {
    const gift = await giftRepository.findOne({
      where: { _id: code.giftId, deletedAt: IsNull() } as any,
    });
    if (gift && gift.type) {
      const tier = gift.type as GiftTier;
      await giftRepository.update({ _id: gift._id } as any, { usedCount: gift.usedCount + 1 });
      return ctx.api.forwardMessage(ctx.from.id, FORWARD_MESSAGES_CHANNEL_ID, messageIds[lang].codeWithGift[tier]);
    }
  }

  // Oddiy kod - hech qanday sovg'a yo'q
  return ctx.api.forwardMessage(ctx.from.id, FORWARD_MESSAGES_CHANNEL_ID, messageIds[lang].codeReal);
}

// ======================
// ASOSIY MESSAGE HANDLER
// =====================
const onMessageHandler = async (ctx: MyContext) => {
  // Admin document yuborsa - document handler ishlaydi, bu yerdan o'tkazmaymiz
  if (ctx.message?.document && isAdmin(ctx.from?.id)) {
    return; // document handler ishlaydi
  }

  // Faqat oddiy user Excel yuborsa to'xtatamiz
  if (ctx.message?.document && !isAdmin(ctx.from?.id)) {
    return;
  }

  // Qolgan kodlar (ism, telefon, kod tekshirish)
  switch (ctx.session.user_state) {
    case 'REGISTER_NAME':
      return registerUserName(ctx);
    case 'REGISTER_PHONE_NUMBER':
      return registerUserPhoneNumber(ctx);
    default:
      return checkCode(ctx);
  }
};
bot.on('message', onMessageHandler);
