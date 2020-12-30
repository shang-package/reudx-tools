import { writeFile } from 'fs-extra';
import { format as prettierFormat } from 'prettier';
import mapping2keys from '../../common/mapping2keys';
import adminEffects from '../injects/admin/effects';
import adminEffectsWithNoReducers from '../injects/admin/effectsWithNoReducers';
import importService from '../injects/common/importService';
import reducers from '../injects/common/reducers';
import state from '../injects/common/state';
import { InjectParams } from '../injects/types';
import weappEffects from '../injects/weapp/effects';
import weappEffectsWithNoReducers from '../injects/weapp/effectsWithNoReducers';
import importCommonFunc from '../injects/weapp/importCommonFunc';
import listEffects from '../injects/weapp/listEffects';
import listState from '../injects/weapp/listState';
import weappReducers from '../injects/weapp/listReducers';

const INJECT_MAPPING = {
  importService,
  reducers,
  adminEffects,
  adminEffectsWithNoReducers,
  state,

  weappImportCommonFunc: importCommonFunc,
  weappEffects,
  weappEffectsWithNoReducers,
  weappListEffects: listEffects,
  weappListState: listState,
  weappReducers,
};

const { keyMapping: ModelInjectKey, keys } = mapping2keys(INJECT_MAPPING);

type ModelInjectType = typeof keys;

export interface ModelResult {
  modelPath: string;
  input: string;
  output: string;
}

async function add2Model({
  injectKeys,
  ...params
}: InjectParams & { injectKeys: ModelInjectType }): Promise<ModelResult> {
  const {
    modelContent,
    prettierrc,
    isWrite,
    modelPath,
    originModelContent,
  } = params;

  const result = injectKeys.reduce((r, key) => {
    const item = INJECT_MAPPING[key](params);
    return r.replace(item.reg, item.replace);
  }, modelContent);

  const output = prettierFormat(result, prettierrc);

  if (isWrite) {
    await writeFile(modelPath, output);
  }

  return {
    modelPath,
    input: originModelContent,
    output,
  };
}

export { add2Model, ModelInjectKey, ModelInjectType };
