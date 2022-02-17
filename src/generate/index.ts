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

async function getPlatform(projectDir: string, stateName: string) {
  const projectConfigJsonPath = pathResolve(projectDir, 'project.config.json');

  const isExists = await pathExists(projectConfigJsonPath);

  if (!isExists) {
    return Platform.admin;
  }

  if (/List$/.test(stateName)) {
    return Platform.weappList;
  }

  return Platform.weapp;
}

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
  isOpenApi,
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
  initValue?: Record<string, unknown> | string;
  isWrite?: boolean;
  isOpenApi?: boolean;
}): Promise<InjectParams> {
  let modelFileLanguage = 'js';
  let serviceFileLanguage = 'ts';

  const modelPathList = [
    pathResolve(projectDir, 'src/models', `${modelName}.js`),
    pathResolve(projectDir, 'src/models', `${modelName}.ts`),
  ];

  const [m1, m2] = await Promise.all(
    modelPathList.map((v) => {
      return pathExists(v);
    })
  );

  let modelPath;

  if (!m1 && !m2) {
    console.warn(`未找到 Model ${modelName}`, modelPathList.join('\n'));
    throw new Errors.InjectNoModelName({ modelName, modelPath: modelPathList });
  } else {
    modelPath = m1 ? modelPathList[0] : modelPathList[1];
    modelFileLanguage = m1 ? 'js' : 'ts';
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
    parser: modelFileLanguage === 'js' ? 'babel' : 'babel-ts',
    endOfLine: 'auto',
  });
  checkModel({ modelContent, injectType, effectPrefix, stateName, injectKey });

  let servicePath = '';
  let originServiceContent = '';
  let serviceContent = '';

  if (!isOpenApi) {
    const servicePathList = [
      pathResolve(projectDir, 'src/services', `${serviceName}.js`),
      pathResolve(projectDir, 'src/services', `${serviceName}.ts`),
    ];

    const [s1, s2] = await Promise.all(
      servicePathList.map((v) => {
        return pathExists(v);
      })
    );

    if (!s1 && !s2) {
      console.warn(`未找到 Service ${modelName}`, servicePathList.join('\n'));
      throw new Errors.InjectNoServiceName({ name: modelName, serviceName });
    } else {
      servicePath = s1 ? servicePathList[0] : servicePathList[1];
      serviceFileLanguage = s1 ? 'js' : 'ts';
    }

    originServiceContent = await readFile(servicePath, {
      encoding: 'utf8',
    });
    serviceContent = prettierFormat(originServiceContent, {
      parser: modelFileLanguage === 'js' ? 'babel' : 'babel-ts',
      endOfLine: 'auto',
    });

    checkService({
      serviceContent,
      injectType,
      effectPrefix,
      stateName,
      injectKey,
    });
  }

  let serverName = camelCase(`${injectKey} server`);

  if (isOpenApi) {
    serverName = apiPath;
  }

  const effectName = camelCase(`${effectPrefix} ${stateName}`);

  return {
    modelPath,
    modelName,
    modelContent,
    modelFileLanguage,
    originModelContent,
    serverName,

    requestMethod,
    apiPath,
    servicePath,
    serviceName,
    serviceContent,
    serviceFileLanguage,
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
}: {
  projectDir: string;
  modelName: string;
  serviceName: string;
  stateName: string;
  initValue?: Record<string, unknown> | string;
  effectPrefix: string;
  comment: string;
  apiPath: string;
  injectType: InjectType;
  requestMethod: string;
  isWrite?: boolean;
}): Promise<[ModelResult, ServiceResult | null] | { message: string }> {
  const isOpenApi = !/\//.test(apiPath);

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
    isOpenApi,
  });

  const modelInjectKeys = [] as ModelInjectType;
  const serviceInjectKeys = [] as ServiceInjectType;

  const platform = await getPlatform(projectDir, stateName);

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

    isOpenApi
      ? null
      : add2Service({
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
