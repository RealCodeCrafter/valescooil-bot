import { createWriteStream } from 'fs';
import archiver from 'archiver';
import cron from 'node-cron';
import { CronExpression } from './cron-expression.enum';
import { ENV } from '../config/config';
import bot from '../../bot/core/bot';
import { InputFile } from 'grammy';
import { join } from 'path';

async function zip(backupFileName: string) {
  const output = createWriteStream(join(process.cwd(), backupFileName));
  const archive = archiver('zip', { zlib: { chunkSize: 100 * 1024, level: 2 } });

  return new Promise<void>(async (resolve, reject) => {
    output.on('close', function () {
      resolve();
    });

    archive.on('error', function (err) {
      reject(err);
    });

    archive.pipe(output);

    // append files from a sub-directory, putting its contents at the root of archive
    archive.directory(process.cwd(), '');

    await archive.finalize();
  });
}

async function backupMethod() {
  const fileName = 'postgres_backup.zip';

  await zip(fileName);

  await bot.api
    .sendDocument(ENV.BOT.BACKUP_CHANNEL_ID, new InputFile(join(process.cwd(), fileName)), {
      message_thread_id: 12,
      caption: `#valesco #valescoCheck #dump`,
      parse_mode: 'HTML',
    })
    .catch(() => {
      // Backup error
    });
}

export function runCronJobs() {
  cron.schedule(CronExpression.EVERY_DAY_AT_MIDNIGHT, backupMethod, {
    timezone: 'Asia/Tashkent',
  });
}
