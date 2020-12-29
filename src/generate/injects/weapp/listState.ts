import { InjectReturn } from '../types';
import { getNames } from './helper';

export default ({
  stateName,
  comment,
  initValue,
}: {
  stateName: string;
  comment: string;
  initValue: any;
}): InjectReturn => {
  return {
    reg: /([\n\r]\s*state\s*:\s*{)([\r\n}])/,
    replace: (_: string, $1: string, $2: string) => {
      const o = getNames(stateName);

      return `${$1}
${comment}
${o.list}:${JSON.stringify(initValue)},
${o.params}: {},
${o.pagination}: {},
${o.finished}: false,
${$2}`;
    },
  };
};
