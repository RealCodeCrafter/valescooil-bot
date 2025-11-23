# Test Qo'llanmasi - Muammolarni Tekshirish

## 1. Giftlar Bazada Mavjudligini Tekshirish

Agar giftlar bazada yo'q bo'lsa, bot avtomatik yaratadi. Lekin tekshirish uchun:

1. MongoDB Compass yoki boshqa tool orqali bazaga kiring
2. `gifts` collection ni oching
3. Quyidagi giftlar bo'lishi kerak:
   - `type: "premium"`
   - `type: "standard"`
   - `type: "economy"`
   - `type: "symbolic"`

Agar yo'q bo'lsa, bot avtomatik yaratadi (rasm yuklashda yoki kod yuklashda).

## 2. Winner Kodlarni Tekshirish

1. Admin bo'lib `/admin` yozing
2. "G'olib kodlarni kiritish" → "Premium" tanlang
3. Premium kodlari bilan Excel fayl yuboring
4. Bazada `winners` collection ni tekshiring:
   - `tier: "premium"` bo'lishi kerak
   - `giftId` mavjud bo'lishi kerak

## 3. Kod Tekshirishni Test Qilish

1. User bo'lib Premium kodini yuboring
2. Server loglarini ko'ring:
   - "WINNER KOD TOPILDI:" log chiqishi kerak
   - "WINNER TIER: premium" chiqishi kerak
   - "GIFT TOPILDI:" yoki "GIFT TOPILMADI" chiqishi kerak

## 4. Rasm Yuklashni Test Qilish

1. Admin bo'lib `/admin` → "Rasmlarni yuklash" → "Premium" tanlang
2. Rasm yoki sticker yuboring
3. Agar "sovg'a topilmadi" deyilsa, bot avtomatik yaratadi
4. Bazada `gifts` collection da Premium gift yaratilgan bo'lishi kerak

## Muammolar va Yechimlar

### Muammo 1: "Premium turdagi sovg'a topilmadi"
**Yechim:** Bot avtomatik yaratadi. Agar hali ham xato bo'lsa, bazada `gifts` collection ni tekshiring.

### Muammo 2: Winner kod yuborilganda oddiy xabar keladi
**Yechim:** 
- Server loglarini tekshiring
- Winner kodda `tier` null bo'lishi mumkin
- Bazada winner kodni tekshiring: `tier` field mavjud bo'lishi kerak

### Muammo 3: Gift topilmayapti
**Yechim:**
- Bazada `gifts` collection da kategoriyalar mavjudligini tekshiring
- Bot avtomatik yaratadi, lekin agar muammo bo'lsa, qo'lda yarating

## Debug Loglar

Bot quyidagi loglarni chiqaradi:
- `WINNER KOD TOPILDI:` - winner kod topilganda
- `WINNER TIER:` - tier qiymati
- `GIFT TOPILDI:` yoki `GIFT TOPILMADI` - gift holati
- `YANGI GIFT YARATILDI:` - yangi gift yaratilganda

Bu loglar server console da ko'rinadi.

