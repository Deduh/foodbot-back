import { Context } from 'telegraf'
import { Update } from 'telegraf/typings/core/types/typegram'

export type CallbackQueryContext = Context<Update.CallbackQueryUpdate>
