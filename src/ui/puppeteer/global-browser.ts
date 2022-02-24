import { readJSON, writeJSON } from 'fs-extra';
import { resolve } from 'path';
import puppeteer, { Browser } from 'puppeteer-core';
import { Errors } from '../../common/error';
import { findChrome } from './findChrome';

const USER_DATA_DIR = resolve(__dirname, '../../../.local-data/profile');

let globalBrowser: Promise<Browser> | undefined;
async function getBrowser(): Promise<puppeteer.Browser> {
  if (!globalBrowser) {
    const localChrome = findChrome();

    if (!localChrome) {
      throw new Errors.LocalChromeNotFound();
    }

    const args = [
      '--app=data:text/html,',
      '--window-size=1000,600',
      '--window-position=150,60',
    ];

    globalBrowser = puppeteer.launch({
      args,
      executablePath: localChrome.executablePath,
      headless: false,
      defaultViewport: null,
      pipe: true,
      userDataDir: USER_DATA_DIR,
      ignoreDefaultArgs: [
        '--enable-automation',
        '--enable-blink-features=IdleDetection',
      ],
    });
  }

  return globalBrowser;
}

async function getEndpoint(): Promise<string> {
  const browser = await getBrowser();
  return browser.wsEndpoint();
}

async function clean(): Promise<{
  len: number;
}> {
  if (!globalBrowser) {
    return { len: 0 };
  }

  const browser = await globalBrowser;
  globalBrowser = undefined;

  const pages = await browser.pages();
  await browser.close();

  return {
    len: pages.length,
  };
}

async function fixCrash(): Promise<void> {
  const p = resolve(USER_DATA_DIR, 'Default/Preferences');

  const obj = await readJSON(p);

  if (obj?.profile?.exit_type) {
    obj.profile.exit_type = 'Normal';

    await writeJSON(p, obj);
  }
}

export { getEndpoint, clean, getBrowser, USER_DATA_DIR, fixCrash };
