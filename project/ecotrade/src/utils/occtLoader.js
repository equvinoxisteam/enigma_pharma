const base = import.meta.env.BASE_URL || '/';
const OCCT_BASE = `${base.endsWith('/') ? base : `${base}/`}occt`;
const OCCT_JS_URL = `${OCCT_BASE}/occt-import-js.js`;
const OCCT_WASM_URL = `${OCCT_BASE}/occt-import-js.wasm`;

let occtPromise = null;

export const getOcctWasmUrl = () => OCCT_WASM_URL;

const probeOcctAssets = async () => {
  try {
    const res = await fetch(OCCT_JS_URL, { method: 'HEAD', cache: 'no-store' });
    const contentType = res.headers.get('content-type') || '';
    return res.ok && !contentType.includes('text/html');
  } catch {
    return false;
  }
};

export const loadOcct = async () => {
  if (occtPromise) return occtPromise;

  occtPromise = (async () => {
    const assetsReady = await probeOcctAssets();
    if (!assetsReady) {
      throw new Error('VIEWER_ASSETS_UNAVAILABLE');
    }

    const module = await import(/* @vite-ignore */ OCCT_JS_URL);
    const occtimportjs = module.default || module;
    return occtimportjs({
      locateFile: (path) => {
        if (path.endsWith('.wasm')) {
          return OCCT_WASM_URL;
        }
        return path;
      }
    });
  })().catch((err) => {
    occtPromise = null;
    throw err;
  });

  return occtPromise;
};
