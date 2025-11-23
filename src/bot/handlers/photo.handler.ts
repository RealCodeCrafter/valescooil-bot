import { MyContext } from '../types/types';
import { isAdmin, BOT_TOKEN } from '../config';
import bot from '../core/bot';
import { Gift } from '../../db/entities/gift.entity';
import { AppDataSource } from '../../db/connect.db';
import { IsNull } from 'typeorm';
import { getAdminSession } from '../actions/admin.action';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

// Rasmlar saqlanadigan papka
const IMAGES_DIR = join(process.cwd(), 'files', 'gift-images');

// Papkani yaratish
async function ensureImagesDir() {
  if (!existsSync(IMAGES_DIR)) {
    await mkdir(IMAGES_DIR, { recursive: true });
  }
}

// Rasm yuklash
async function downloadPhoto(fileId: string, fileName: string): Promise<string> {
  try {
    const file = await bot.api.getFile(fileId);
    const url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Rasm yuklanmadi");

    const buffer = Buffer.from(await res.arrayBuffer());
    const filePath = join(IMAGES_DIR, fileName);
    await writeFile(filePath, buffer);
    
    return filePath;
  } catch (error: any) {
    throw new Error(`Rasm yuklashda xato: ${error.message}`);
  }
}

// Photo handler
export const handlePhoto = async (ctx: MyContext) => {
  if (!isAdmin(ctx.from?.id)) {
    return;
  }

  const session = getAdminSession(ctx.from!.id);
  
  // Faqat rasm yuklash rejimida bo'lsa
  if (session.mode !== 'upload_images' || !session.imageType) {
    return;
  }

  const photo = ctx.message?.photo;
  const sticker = ctx.message?.sticker;

  if (!photo && !sticker) {
    return ctx.reply("❌ Rasm yoki sticker topilmadi.");
  }

  try {
    await ensureImagesDir();

    let fileId: string;
    let extension: string;

    if (photo && photo.length > 0) {
      // Eng katta rasmni olish
      const largestPhoto = photo[photo.length - 1];
      fileId = largestPhoto.file_id;
      extension = 'jpg';
    } else if (sticker) {
      fileId = sticker.file_id;
      extension = sticker.is_animated ? 'tgs' : sticker.is_video ? 'webm' : 'webp';
    } else {
      return ctx.reply("❌ Rasm yoki sticker topilmadi.");
    }

    await ctx.reply("📥 Rasm yuklanmoqda...");

    const fileName = `${session.imageType}_${Date.now()}.${extension}`;
    const filePath = await downloadPhoto(fileId, fileName);

    // Rasm URL ni saqlash (relative path)
    const imageUrl = `/files/gift-images/${fileName}`;

    // Gift modelni topish yoki yaratish
    const giftRepository = AppDataSource.getRepository(Gift);
    let gift = await giftRepository.findOne({
      where: { 
        type: session.imageType, 
        deletedAt: IsNull() 
      } as any,
    });

    if (!gift) {
      // Gift topilmasa, yangi gift yaratamiz (rasm URL bilan birga)
      const giftCount = await giftRepository.count();
      const tierNames: Record<string, string> = {
        premium: 'Premium sovg\'a',
        standard: 'Standard sovg\'a',
        economy: 'Economy sovg\'a',
        symbolic: 'Symbolic sovg\'a',
      };

      gift = giftRepository.create({
        id: giftCount + 1,
        name: tierNames[session.imageType] || `${session.imageType} sovg'a`,
        type: session.imageType as any,
        image: imageUrl,
        images: {
          uz: imageUrl,
          ru: imageUrl,
        },
        totalCount: 0,
        usedCount: 0,
        deletedAt: null,
      });
      
      gift = await giftRepository.save(gift);
    } else {
      // Gift mavjud bo'lsa, yangilaymiz
      await giftRepository.update(
        { _id: gift._id } as any,
        { 
          image: imageUrl,
          images: {
            uz: imageUrl,
            ru: imageUrl,
          }
        }
      );
    }

    const imageType = session.imageType;

    // Session state ni tozalash
    session.mode = null;
    session.imageType = null;

    await ctx.reply(
      `✅ <b>Rasm yuklandi!</b>\n\nTuri: <b>${imageType}</b>\nFayl: <b>${fileName}</b>`,
      { parse_mode: 'HTML' }
    );

  } catch (error: any) {
    await ctx.reply(`❌ Xato: ${error.message}`);
    session.mode = null;
    session.imageType = null;
  }
};

// Photo handler
bot.on('message:photo', async (ctx, next) => {
  if (isAdmin(ctx.from?.id)) {
    await handlePhoto(ctx);
    return;
  }
  return next();
});

// Sticker handler
bot.on('message:sticker', async (ctx, next) => {
  if (isAdmin(ctx.from?.id)) {
    await handlePhoto(ctx);
    return;
  }
  return next();
});

