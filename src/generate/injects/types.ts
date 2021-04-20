export enum Platform {
  admin = 'admin',
  weapp = 'weapp',
  weappList = 'weappList',
}

export enum InjectType {
  // 完整版
  full = 'full',
  // 仅仅请求, 但不存储到redux
  request = 'request',
}

export interface InjectReturn {
  reg: RegExp;
  replace: (...args: any[]) => string;
}

export interface InjectParams {
  modelPath: string;
  modelName: string;
  modelContent: string;
  modelFileLanguage: string;
  originModelContent: string;
  serverName: string;

  requestMethod: string;
  apiPath: string;
  servicePath: string;
  serviceName: string;
  serviceContent: string;
  serviceFileLanguage: string;
  originServiceContent: string;
  comment: string;
  stateName: string;
  effectName: string;
  initValue: string | any;
  effectPrefix: string;

  injectType: InjectType;
  injectKey: string;

  prettierrc: Record<string, unknown>;

  isWrite?: boolean;
}
