# G'olib Kodlarni Excel faylga kiritish misoli

## Excel fayl formatlari

Bot quyidagi formatlarni qo'llab-quvvatlaydi:
- `.xlsx` (Excel 2007+)
- `.xls` (Eski Excel format)
- `.csv` (Comma Separated Values)
- `.txt` (Oddiy matn fayl)

## Kodlar formatlari

Kodlar quyidagi formatlarda bo'lishi mumkin:

### 1. Format: `VSTRXJ-9921` (6 harf + tire + 4 raqam)
```
VSTRXJ-9921
VSKZXY-4531
VSMELW-5145
```

### 2. Format: `VSTRXJ9921` (6 harf + 4 raqam, tire yo'q)
```
VSTRXJ9921
VSKZXY4531
VSMELW5145
```

Bot avtomatik ravishda tire qo'shadi yoki olib tashlaydi.

## Excel fayl misollari

### Variant 1: Bir ustunda kodlar
```
| A          |
|------------|
| VSTRXJ-9921 |
| VSKZXY-4531 |
| VSMELW-5145 |
| VSEJAK-2542 |
| VSYJME-3129 |
```

### Variant 2: Bir qatorda bir nechta kodlar
```
| A          | B          | C          |
|------------|------------|------------|
| VSTRXJ-9921 | VSKZXY-4531 | VSMELW-5145 |
| VSEJAK-2542 | VSYJME-3129 | VSEZDE-3040 |
```

### Variant 3: Sarlavha bilan (sarlavha e'tiborsiz qoldiriladi)
```
| Kodlar     |
|------------|
| VSTRXJ-9921 |
| VSKZXY-4531 |
| VSMELW-5145 |
```

### Variant 4: Boshqa ustunlar bilan (faqat kodlar olinadi)
```
| ID | Kodlar     | Foydalanuvchi |
|----|------------|---------------|
| 1  | VSTRXJ-9921 | User1         |
| 2  | VSKZXY-4531 | User2         |
| 3  | VSMELW-5145 | User3         |
```

## Qanday yuborish

1. `/admin` buyrug'ini yozing
2. "🎁 G'olib kodlarni kiritish" buttonini bosing
3. Excel faylni yuboring
4. Bot avtomatik ravishda kodlarni o'qiydi va bazaga saqlaydi

## Eslatmalar

- Kodlar kamida 8 ta belgidan iborat bo'lishi kerak
- "kod", "code", "id", "№", "raqam", "#" so'zlari e'tiborsiz qoldiriladi
- Duplikat kodlar avtomatik ravishda o'tkazib yuboriladi
- Bot har bir katakchani tekshiradi va kodlarni topadi

