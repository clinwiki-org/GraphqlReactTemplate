import View from './MailMerge/MailMergeView';
import MailMerge from './MailMerge/MailMerge';
import { compileFragment } from './MailMerge/MailMergeFragment'
import { registerHandlebarsHelpers } from './MailMerge/MailMergeHelpers'

registerHandlebarsHelpers();

export { MailMerge as MailMergeEditor, View as MailMergeView, compileFragment };