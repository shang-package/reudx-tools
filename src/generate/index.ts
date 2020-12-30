/* eslint-disable import/no-dynamic-require, global-require */

import { camelCase } from 'change-case';
import { pathExists, readFile } from 'fs-extra';
import { resolve as pathResolve } from 'path';
import { format as prettierFormat } from 'prettier';
import { Errors } from '../common/error';
import { InjectParams, InjectType, Platform } from './injects/types';
import {
  add2Model,
  ModelInjectKey,
  ModelInjectType,
  ModelResult,
} from './models/add';
import { checkModel } from './models/check';
import {
  add2Service,
  ServiceInjectKey,
  ServiceInjectType,
  ServiceResult,
} from './services/add';
import { checkService } from './services/check';

export async function getPrettierConfig(
  projectDir: string
): Promise<Record<string, unknown>> {
  const prettierrcPath = pathResolve(projectDir, '.prettierrc.js');
  const isPrettierrcExists = await pathExists(prettierrcPath);

  let temp = {};
  if (isPrettierrcExists) {
    temp = require(prettierrcPath);
  }

  return { parser: 'babel', endOfLine: 'auto', ...temp };
}

export async function check({
  projectDir,
  modelName,
  serviceName,
  injectType,
  effectPrefix,
  stateName,
  requestMethod,
  apiPath,
  comment,
  initValue,
  isWrite,
  platform,
}: {
  projectDir: string;
  modelName: string;
  serviceName: string;
  injectType: InjectType;
  effectPrefix: string;
  stateName: string;

  requestMethod: string;
  apiPath: string;
  comment: string;
  initValue: Record<string, unknown> | string;
  isWrite?: boolean;
  platform: Platform;
}): Promise<InjectParams> {
  const modelPath = pathResolve(projectDir, 'src/models', `${modelName}.js`);
  const isModelExists = await pathExists(modelPath);

  // TODO: 通过 project.config.json 和 stateName 自动处理
  if (!platform) {
    console.warn(`未找到使用平台 ${platform}`);
    throw new Errors.InjectNoPlatform({ platform });
  }

  if (!isModelExists) {
    console.warn(`未找到 Model ${modelName}`, modelPath);
    throw new Errors.InjectNoModelName({ modelName, modelPath });
  }

  const servicePath = pathResolve(
    projectDir,
    'src/services',
    `${serviceName}.js`
  );
  const isServiceExists = await pathExists(modelPath);

  if (!isServiceExists) {
    throw new Errors.InjectNoServiceName({ servicePath, serviceName });
  }

  let injectKey: string;
  if (injectType === InjectType.request) {
    injectKey = camelCase(`${effectPrefix} ${stateName}`);
  } else {
    injectKey = camelCase(`${stateName}`);
  }

  const prettierrc = await getPrettierConfig(projectDir);
  const originModelContent = await readFile(modelPath, { encoding: 'utf8' });
  const modelContent = prettierFormat(originModelContent, {
    parser: 'babel',
    endOfLine: 'auto',
  });
  checkModel({ modelContent, injectType, effectPrefix, stateName, injectKey });

  const originServiceContent = await readFile(servicePath, {
    encoding: 'utf8',
  });
  const serviceContent = prettierFormat(originServiceContent, {
    parser: 'babel',
    endOfLine: 'auto',
  });
  checkService({
    serviceContent,
    injectType,
    effectPrefix,
    stateName,
    injectKey,
  });

  const serverName = camelCase(`${injectKey} server`);
  const effectName = camelCase(`${effectPrefix} ${stateName}`);

  return {
    modelPath,
    modelName,
    modelContent,
    originModelContent,
    serverName,

    requestMethod,
    apiPath,
    servicePath,
    serviceName,
    serviceContent,
    originServiceContent,
    comment,
    stateName,
    effectName,
    initValue,
    effectPrefix,

    injectType,
    injectKey,

    prettierrc,

    isWrite,
  };
}

async function generate({
  projectDir,
  modelName,
  serviceName,
  stateName,
  initValue,
  effectPrefix,
  comment,
  apiPath,
  injectType,
  requestMethod,
  isWrite,
  platform,
}: {
  projectDir: string;
  modelName: string;
  serviceName: string;
  stateName: string;
  initValue: Record<string, unknown> | string;
  effectPrefix: string;
  comment: string;
  apiPath: string;
  injectType: InjectType;
  requestMethod: string;
  platform: Platform;
  isWrite?: boolean;
}): Promise<[ModelResult, ServiceResult] | { message: string }> {
  const params = await check({
    projectDir,
    modelName,
    serviceName,
    injectType,
    effectPrefix,
    stateName,

    requestMethod,
    apiPath,
    comment,
    initValue,
    isWrite,

    platform,
  });

  const modelInjectKeys = [] as ModelInjectType;
  const serviceInjectKeys = [] as ServiceInjectType;

  if (platform === Platform.admin) {
    serviceInjectKeys.push(ServiceInjectKey.adminRequest);

    if (injectType === InjectType.request) {
      modelInjectKeys.push(
        ModelInjectKey.importService,
        ModelInjectKey.adminEffectsWithNoReducers
      );
    } else {
      modelInjectKeys.push(
        ModelInjectKey.importService,
        ModelInjectKey.state,
        ModelInjectKey.adminEffects,
        ModelInjectKey.reducers
      );
    }
  } else if (platform === Platform.weappList) {
    serviceInjectKeys.push(ServiceInjectKey.weappRequest);

    modelInjectKeys.push(
      ModelInjectKey.importService,
      ModelInjectKey.weappImportCommonFunc,
      ModelInjectKey.weappListState,
      ModelInjectKey.weappListEffects,
      ModelInjectKey.weappReducers
    );
  } else if (platform === Platform.weapp) {
    serviceInjectKeys.push(ServiceInjectKey.weappRequest);
    modelInjectKeys.push(ModelInjectKey.importService);

    if (injectType === InjectType.request) {
      modelInjectKeys.push(ModelInjectKey.weappEffectsWithNoReducers);
    } else {
      modelInjectKeys.push(
        ModelInjectKey.state,
        ModelInjectKey.weappEffects,
        ModelInjectKey.reducers
      );
    }
  }

  const result = await Promise.all([
    add2Model({
      ...params,
      injectKeys: modelInjectKeys,
    }),

    add2Service({
      ...params,
      injectKeys: serviceInjectKeys,
    }),
  ]);

  if (isWrite) {
    return { message: 'success' };
  }

  return result;
}

export default generate;
