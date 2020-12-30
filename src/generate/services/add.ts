import { writeFile } from 'fs-extra';
import mapping2keys from '../../common/mapping2keys';
import adminRequest from '../injects/admin/request';
import { InjectParams } from '../injects/types';
import weappRequest from '../injects/weapp/request';

const SERVICE_INJECT_MAPPING = {
  adminRequest,
  weappRequest,
};

const { keyMapping: ServiceInjectKey, keys } = mapping2keys(
  SERVICE_INJECT_MAPPING
);

type ServiceInjectType = typeof keys;

export interface ServiceResult {
  servicePath: string;
  input: string;
  output: string;
}

async function add2Service({
  injectKeys,
  serviceContent,
  originServiceContent,
  servicePath,
  isWrite,
  ...params
}: InjectParams & { injectKeys: ServiceInjectType }): Promise<ServiceResult> {
  const output = injectKeys.reduce((result, key) => {
    // eslint-disable-next-line no-param-reassign
    result = SERVICE_INJECT_MAPPING[key]({
      input: result,
      ...params,
    });

    return result;
  }, serviceContent);

  if (isWrite) {
    await writeFile(servicePath, output);
  }

  return {
    servicePath,
    input: originServiceContent,
    output,
  };
}

export { add2Service, ServiceInjectKey, ServiceInjectType };
