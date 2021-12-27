import { camelCase } from 'change-case';
import { InjectParams, InjectReturn } from '../types';

export default ({
  comment,
  stateName,
  initValue,
  effectName,
  serverName,
}: InjectParams): InjectReturn => {
  return {
    reg: /([\n\r]\s*effects\s*:\s*{)([\r\n}])/,
    replace: (_: string, $1: string, $2: string) => {
      return `${$1}
${comment}
*${effectName}({ payload }, { call, put }) {
  yield put({
    type: "${camelCase(`set ${stateName}`)}", 
    payload: ${JSON.stringify(initValue)}, 
  });

  const res = yield call(${serverName}, payload);
  if (res.code !== "1") {
    return Promise.reject(); 
  }

  yield put({
      type: "${camelCase(`set ${stateName}`)}",
      payload: res.content, 
  }); 

  return res.content;
},
${$2}`;
    },
  };
};
