import { pathExists, readdir, stat } from 'fs-extra';
import { resolve } from 'path';
import { Page, HTTPRequest } from 'puppeteer-core';
import { Errors, OperationalError } from './common/error';
import generate from './generate';
import { InjectType, Platform } from './generate/injects/types';
import { launch } from './ui';

const BACKEND_HOST = '__backend__.com';

interface GenerateInput {
  projectName: string;
  modelName: string;
  serviceName: string;
  stateName: string;
  initValue: Record<string, any> | string;
  effectPrefix: string;
  comment: string;
  apiPath: string;
  injectType: InjectType;
  requestMethod: string;
  platform: Platform;
}

class Backend {
  private WORK_SPACE = 'C:/Users/ht/WORKSPACE/';

  public async changeWorkSpace({ dir }: { dir: string }) {
    if (!dir) {
      throw new Errors.ParamsRequired({ path: 'dir' });
    }

    const isExists = await pathExists(dir);

    if (!isExists) {
      throw new Errors.PathNotFound();
    }

    const stats = await stat(dir);

    if (!stats.isDirectory()) {
      throw new Errors.PathIsNotDirectory({ dir });
    }

    this.WORK_SPACE = dir;
    return this.listProject();
  }

  public async listProject() {
    const list = await readdir(this.WORK_SPACE);
    return list;
  }

  public async listProjectInfo({ projectName }: { projectName: string }) {
    const models = await readdir(
      resolve(this.WORK_SPACE, projectName, 'src/models')
    );

    const services = await readdir(
      resolve(this.WORK_SPACE, projectName, 'src/services')
    );

    return {
      models: models.map((item) => {
        return item.replace(/\.(j|t)s$/, '');
      }),
      services: services.map((item) => {
        return item.replace(/\.(j|t)s$/, '');
      }),
    };
  }

  public async generate(data: GenerateInput) {
    const { projectName, initValue } = data;

    const keys = [
      'projectName',
      'modelName',
      'serviceName',
      'stateName',
      'effectPrefix',
      'comment',
      'apiPath',
      'injectType',
      'requestMethod',
    ] as Array<keyof GenerateInput>;

    keys.forEach((key) => {
      if (!data[key]) {
        throw new Errors.ParamsRequired({ key, data });
      }

      // eslint-disable-next-line no-param-reassign
      (data[key] as any) = data[key].trim();
    });

    if (!/^\/\//.test(data.comment)) {
      // eslint-disable-next-line no-param-reassign
      data.comment = `// ${data.comment}`;
    }

    const projectDir = resolve(this.WORK_SPACE, projectName);

    let init: Record<string, unknown> | string | undefined = initValue;

    try {
      if (typeof initValue === 'string') {
        init = JSON.parse(initValue);
      }
    } catch (e) {
      init = initValue;
    }

    if (init === 'undefined' || init === '') {
      init = undefined;
    }

    return generate({
      ...data,
      projectDir,
      initValue: init,
      injectType: data.injectType as InjectType,
    });
  }
}

function parseBackend(req: HTTPRequest) {
  const url = new URL(req.url());

  if (url.host !== BACKEND_HOST) {
    return undefined;
  }

  const key = decodeURIComponent(url.pathname).replace(/^\/*/, '');
  const method = req.method();

  if (method === 'OPTIONS') {
    return {
      status: 204,
    };
  }

  const postData = req.postData();

  const result: Record<string, any> = {};
  url.searchParams.forEach((value, k) => {
    result[k] = value;
  });

  if (method === 'GET' || method === 'DELETE' || !postData) {
    return {
      key,
      body: result,
    };
  }

  try {
    return {
      key,
      postData,
      body: {
        ...result,
        ...JSON.parse(postData),
      },
    };
  } catch (e) {
    return {
      key,
      postData,
      body: result,
    };
  }
}

async function handleBackendRequest(page: Page, backend: Backend) {
  await page.setRequestInterception(true);

  page.on('request', async (req) => {
    const data = parseBackend(req);

    if (!data) {
      await req.continue();
      return;
    }

    let resBody;
    let resStatus;

    try {
      if (data.status) {
        resStatus = data.status;
        resBody = data.body;
      } else {
        resBody = await backend[data.key as keyof Backend](data.body);
        resStatus = 200;
      }
    } catch (e: any) {
      if (e instanceof OperationalError) {
        resBody = e.toJSON();
      } else {
        resBody = new Errors.Unknown({ ...data, ...e }, e.message).toJSON();
      }

      resStatus = 400;
    }

    await req.respond({
      status: resStatus,

      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(resBody),
    });
  });
}

(async () => {
  const page = await launch();
  await handleBackendRequest(page, new Backend());
  await page.goto(`file://${resolve(__dirname, '../client/index.html')}`);
})().catch(console.warn);
