import { Errors } from '../../common/error';
import { InjectParams } from '../injects/types';

function checkModel({
  modelContent,
  injectType,
  effectPrefix,
  stateName,
  injectKey,
}: Pick<
  InjectParams,
  'modelContent' | 'injectType' | 'effectPrefix' | 'stateName' | 'injectKey'
>): void {
  if (new RegExp(`[\\r\\n\\s]${injectKey}:`).test(modelContent)) {
    throw new Errors.InjectDuplicated({
      type: 'model',
      injectType,
      injectKey,
      effectPrefix,
      stateName,
    });
  }

  if (new RegExp(`\\*${injectKey}\\(`).test(modelContent)) {
    throw new Errors.InjectDuplicated({
      type: 'model',
      injectType,
      injectKey,
      effectPrefix,
      stateName,
    });
  }
}

export { checkModel };
