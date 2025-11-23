import bot from '../core/bot';
import { isAdmin } from '../config';
import { CallbackActions } from '../types/enum';
import { InlineKeyboard } from 'grammy';
import { getAdminSession } from '../actions/admin.action';
import './migrate-winners';

bot.command('admin', async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    return ctx.reply('❌ Siz admin emassiz.');
  }

  const keyboard = new InlineKeyboard()
    .text('📥 Kodlar kiritish', CallbackActions.ADMIN_UPLOAD_CODES)
    .row()
    .text('🎁 G\'olib kodlarni kiritish', CallbackActions.ADMIN_UPLOAD_WINNERS)
    .row()
    .text('🗑️ Kodlarni tozalash', CallbackActions.ADMIN_CLEAR_CODES)
    .row()
    .text('🗑️ G\'olib kodlarni tozalash', CallbackActions.ADMIN_CLEAR_WINNERS)
    .row()
    .text('🖼️ Rasmlarni yuklash', CallbackActions.ADMIN_UPLOAD_IMAGES);

  return ctx.reply(
    '🛡 <b>Salom, admin!</b>\n\nQuyidagi amallardan birini tanlang:',
    { 
      parse_mode: 'HTML',
      reply_markup: keyboard,
    },
  );
});

bot.command('winner', async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    return ctx.reply('❌ Siz admin emassiz.');
  }

  const session = getAdminSession(ctx.from.id);
  session.mode = 'upload_winners';

  const tierKeyboard = new InlineKeyboard()
    .text('💎 Premium', `${CallbackActions.ADMIN_UPLOAD_WINNERS}_premium`)
    .row()
    .text('⭐ Standard', `${CallbackActions.ADMIN_UPLOAD_WINNERS}_standard`)
    .row()
    .text('💰 Economy', `${CallbackActions.ADMIN_UPLOAD_WINNERS}_economy`)
    .row()
    .text('🎁 Symbolic', `${CallbackActions.ADMIN_UPLOAD_WINNERS}_symbolic`);

  return ctx.reply(
    '🎁 <b>Salom, admin!</b>\n\nQaysi kategoriyaga tegishli kodlarni yuklamoqchisiz?',
    { 
      parse_mode: 'HTML',
      reply_markup: tierKeyboard,
    },
  );
});
