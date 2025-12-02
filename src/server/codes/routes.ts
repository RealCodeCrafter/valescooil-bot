import { Router } from 'express';
import { runAsyncWrapper } from '../../common/utility/run-async-wrapper';
import { codesController } from './controller';

const codesRouter = Router()
  // Barcha kodlar
  .get('/', runAsyncWrapper(codesController.getAll))
  .get('/usedByUser/:usedById', runAsyncWrapper(codesController.getUsedBy))
  .patch('/gift-give/:_id', runAsyncWrapper(codesController.codeGiftGive))
  .patch('/reset-usage/:_id', runAsyncWrapper(codesController.resetCodeUsage))
  .patch('/reset-usage-by-value', runAsyncWrapper(codesController.resetCodeUsageByValue))
  .patch('/winners/reset-usage/:_id', runAsyncWrapper(codesController.resetWinnerCodeUsage))
  .patch('/winners/reset-usage-by-value', runAsyncWrapper(codesController.resetWinnerCodeUsageByValue))
  // G'oliblar (winners.json dagi kodlar bilan ishlatilgan)
  .get('/winners/all', runAsyncWrapper(codesController.getWinners))
  .get('/winners/:id', runAsyncWrapper(codesController.getWinnerById))
  // Mag'lublar (winners.json da yo'q, lekin ishlatilgan)
  .get('/losers/all', runAsyncWrapper(codesController.getLosers))
  .get('/losers/:id', runAsyncWrapper(codesController.getLoserById))
  // Winner kodlar (winners.json dagi kodlar)
  .get('/winner-codes/all', runAsyncWrapper(codesController.getWinnerCodes))
  .get('/winner-codes/:id', runAsyncWrapper(codesController.getWinnerCodeById))
  // Yutuqsiz kodlar (bazada bor, lekin winners.json da yo'q)
  .get('/non-winner-codes/all', runAsyncWrapper(codesController.getNonWinnerCodes))
  .get('/non-winner-codes/:id', runAsyncWrapper(codesController.getNonWinnerCodeById))
  // Yangi API: Kod kiritib GET qilganda qaysi oyga tegishli ekanligini qaytaradi
  .get('/code-month', runAsyncWrapper(codesController.getCodeMonth))
  // Yangi API: Oy tanlansa shu oyga tegishli kodlar chiqadi
  .get('/by-month/:month', runAsyncWrapper(codesController.getCodesByMonth))
  // Oxirgi route - barcha boshqa routelardan keyin
  .get('/:id', runAsyncWrapper(codesController.getById));

export { codesRouter };
