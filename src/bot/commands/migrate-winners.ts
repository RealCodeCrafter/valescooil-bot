import bot from '../core/bot';
import { isAdmin } from '../config';
import { Winner } from '../../db/entities/winner.entity';
import { AppDataSource } from '../../db/connect.db';
import { IsNull } from 'typeorm';

// Bu komanda endi kerak emas - g'olib kodlar allaqachon bazada saqlanadi
// Agar eski kodlarni tozalash kerak bo'lsa, bu komandani ishlatish mumkin
bot.command('migrate_winners', async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    return ctx.reply('❌ Siz admin emassiz.');
  }

  try {
    const winnerRepository = AppDataSource.getRepository(Winner);
    const winnerCount = await winnerRepository.count({ where: { deletedAt: IsNull() } as any });
    
    await ctx.reply(`
ℹ️ <b>G'olib kodlar migratsiyasi</b>

Bu komanda endi kerak emas. G'olib kodlar allaqachon bazada saqlanadi.

Jami bazada: <b>${winnerCount}</b> ta g'olib kod

G'olib kodlarni yuklash uchun /admin → G'olib kodlarni kiritish
    `, { parse_mode: 'HTML' });

  } catch (error: any) {
    await ctx.reply(`❌ Xato: ${error.message}`);
  }
});

