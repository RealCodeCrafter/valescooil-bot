import 'dotenv/config';
import { GiftType } from '../../db/entities/gift.entity';

interface MessageI {
  start: number;
  codeFake: number;
  codeUsed: number;
  codeReal: number;
  codeWithGift: Record<GiftType, number>;
  codeUsageLimit: number;
  auth: { requestName: number };
}

export const BOT_TOKEN = process.env.BOT_TOKEN as string;
export const FORWARD_MESSAGES_CHANNEL_ID = -1001886860465;

// Admin ID lar ro'yxati
const ADMIN_IDS = [
  5661241603,  // Asosiy admin
  7546792114,  // Ikkinchi admin
];

// Admin ID ni tekshirish funksiyasi
export const isAdmin = (userId: number | undefined): boolean => {
  if (!userId) return false;
  return ADMIN_IDS.includes(Number(userId));
};

// Eski kodlar bilan moslik uchun (birinchi admin ID)
export const ADMIN_TG_ID = ADMIN_IDS[0];

export const messageIds: Record<'uz' | 'ru', MessageI> = {
  uz: {
    start: 3,
    codeWithGift: {
      premium: 32,
      standard: 34,
      economy: 36,
      symbolic: 38,
    },
    codeReal: 12, // 12 code real
    codeFake: 13, // 13 code fake
    codeUsed: 19,
    codeUsageLimit: 40,
    auth: { requestName: 3 },
  },
  ru: {
    start: 14,
    codeWithGift: {
      premium: 33,
      standard: 35,
      economy: 37,
      symbolic: 39,
    },
    auth: { requestName: 14 },
    codeReal: 16,
    codeFake: 17,
    codeUsed: 20,
    codeUsageLimit: 41
  },
};
