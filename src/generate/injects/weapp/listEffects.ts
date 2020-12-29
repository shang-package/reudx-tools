import { camelCase } from 'change-case';
import { InjectParams, InjectReturn } from '../types';
import { getNames } from './helper';

export default ({
  stateName,
  comment,
  modelName,

  serverName,
  effectName,
}: InjectParams): InjectReturn => {
  return {
    reg: /([\n\r]\s*effects\s*:\s*{)([\r\n}])/,
    replace: (_: string, $1: string) => {
      const o = getNames(stateName);

      return `${$1}
${comment}
*${effectName}({ payload }, { select, call, put }) {
const params = yield select(({ ${modelName} }) => ${modelName}.${o.params});
const curIsFinished = yield select(({ ${modelName} }) => ${modelName}.${
        o.finished
      });

const isAlreadyFinished = dealPayloadParams(payload, params, curIsFinished);
if (isAlreadyFinished) {
  return;
}

const res = yield call(${serverName}, payload);
if (res.code !== "1") {
  Taro.showToast({
    title: res.message,
    duration: 1000,
    icon: 'none',
  });
  return Promise.reject(); 
}

const { list, pagination } = res.content;
let dataList = [];
if (payload.page != 1) {
  const oldList = yield select(({ ${modelName}  }) => ${modelName}.${o.list});
  dataList = [...oldList, ...list];
} else {
  dataList = [...list];
}
let isFinished = false;
if (dataList.length >= pagination.totalCount) {
  isFinished = true;
}
yield put({
  type: '${camelCase(`set ${o.list}`)}',
  payload: {
    ${o.list}: dataList,
    ${o.pagination}: { ...pagination },
    ${o.params}: { ...payload },
    ${o.finished}: isFinished,
  },
});
},
`;
    },
  };
};
