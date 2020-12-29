import { InjectParams, InjectReturn } from '../types';

export default ({
  comment,
  injectKey,
  serverName,
}: InjectParams): InjectReturn => {
  return {
    reg: /([\n\r]\s*effects\s*:\s*{)([\r\n}])/,
    replace: (_: string, $1: string, $2: string) => {
      return `
${$1}
${comment}
*${injectKey}({ payload }, { call }) {
  const res = yield call(${serverName}, payload);
  if (res.code !== "1") { message.error(res.message); return Promise.reject();}
  return res.content;
},
${$2}`;
    },
  };
};
