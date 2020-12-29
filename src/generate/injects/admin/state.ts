import { InjectParams, InjectReturn } from '../types';

export default ({
  comment,
  stateName,
  initValue,
}: InjectParams): InjectReturn => {
  return {
    reg: /([\n\r]\s*state\s*:\s*{)([\r\n}])/,
    replace: (_: string, $1: string, $2: string) => {
      return `${$1}
${comment}
${stateName}:${JSON.stringify(initValue)},
${$2}`;
    },
  };
};
