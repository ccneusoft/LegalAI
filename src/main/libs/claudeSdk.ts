/// <reference path="../types/claude-agent-sdk.d.ts" />
import { app } from 'electron';
import { existsSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { coworkLog } from './coworkLogger';

// `typeof import(...)` will derive its shape from the ambient module
// declarations (or lack thereof).  Unfortunately the SDK doesn't ship any
// types, and our manual declaration file isn't reliably picked up for this
// expression, so we add a small augmentation here to ensure the properties
// we access later (`query`, `createSdkMcpServer`, `tool`) are present on the
// type.  They are intentionally marked optional since they may not exist in
// future SDK versions.
export type ClaudeSdkModule = typeof import('@anthropic-ai/claude-agent-sdk') & {
  query?: any;
  createSdkMcpServer?: any;
  tool?: any;
};

let claudeSdkPromise: Promise<ClaudeSdkModule> | null = null;

const CLAUDE_SDK_PATH_PARTS = ['@anthropic-ai', 'claude-agent-sdk'];

function getClaudeSdkPath(): string {
  if (app.isPackaged) {
    return join(
      process.resourcesPath,
      'app.asar.unpacked',
      'node_modules',
      ...CLAUDE_SDK_PATH_PARTS,
      'sdk.mjs'
    );
  }

  // In development, try to find the SDK in the project root node_modules
  // app.getAppPath() might point to dist-electron or other build output directories
  // We need to look in the project root
  const appPath = app.getAppPath();
  // If appPath ends with dist-electron, go up one level
  const rootDir = appPath.endsWith('dist-electron')
    ? join(appPath, '..')
    : appPath;

  const sdkPath = join(
    rootDir,
    'node_modules',
    ...CLAUDE_SDK_PATH_PARTS,
    'sdk.mjs'
  );

  console.log('[ClaudeSDK] Resolved SDK path:', sdkPath);
  return sdkPath;
}

export function loadClaudeSdk(): Promise<ClaudeSdkModule> {
  if (!claudeSdkPromise) {
    // Use runtime dynamic import so the CJS build can load the SDK's ESM entry.
    const dynamicImport = new Function('specifier', 'return import(specifier)') as (
      specifier: string
    ) => Promise<ClaudeSdkModule>;
    const sdkPath = getClaudeSdkPath();
    const sdkUrl = pathToFileURL(sdkPath).href;
    const sdkExists = existsSync(sdkPath);

    coworkLog('INFO', 'loadClaudeSdk', 'Loading Claude SDK', {
      sdkPath,
      sdkUrl,
      sdkExists,
      isPackaged: app.isPackaged,
      resourcesPath: process.resourcesPath,
    });

    claudeSdkPromise = dynamicImport(sdkUrl).catch((error) => {
      coworkLog('ERROR', 'loadClaudeSdk', 'Failed to load Claude SDK', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        sdkPath,
        sdkExists,
      });
      claudeSdkPromise = null;
      throw error;
    });
  }

  return claudeSdkPromise;
}
