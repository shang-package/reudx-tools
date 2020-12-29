import { Errors } from '../../common/error';
import { InjectParams } from '../injects/types';

function checkService({
  serviceContent,
  injectType,
  effectPrefix,
  stateName,
  injectKey,
}: Pick<
  InjectParams,
  'serviceContent' | 'injectType' | 'effectPrefix' | 'stateName' | 'injectKey'
>): void {
  if (new RegExp(`[\\r\\n\\s]${injectKey}\\s*\\(`).test(serviceContent)) {
    throw new Errors.InjectDuplicated({
      type: 'service',
      injectType,
      injectKey,
      effectPrefix,
      stateName,
    });
  }
}

export { checkService };
