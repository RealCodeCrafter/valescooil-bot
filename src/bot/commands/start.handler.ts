import { MyContext } from '../types/types';
import { mainMenuInline } from '../helpers/inline.keyboard';

export async function mainMenu(ctx: MyContext, edit = false) {
  const options = { reply_markup: mainMenuInline(ctx) };
  
  if (edit) return await ctx.editMessageText(ctx.i18n.t('menu.title'), options);
  else {
    ctx.session.is_editable_message = true;

    return (ctx.session.main_menu_message = await ctx.reply(ctx.i18n.t('menu.title'), options));
  }
}
