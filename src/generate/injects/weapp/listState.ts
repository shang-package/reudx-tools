import { InjectReturn } from '../types';
import { getNames } from './helper';

export default ({
  stateName,
  comment,
}: {
  stateName: string;
  comment: string;
}): InjectReturn => {
  return {
    reg: /([\n\r]\s*state\s*:\s*{)([\r\n}])/,
    replace: (_: string, $1: string, $2: string) => {
      const o = getNames(stateName);

      return `${$1}
${comment}
${o.list}: [],
${o.params}: {},
${o.pagination}: {},
${o.finished}: false,
${$2}`;
    },
  };
};
