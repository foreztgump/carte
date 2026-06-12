const PLUGIN_ID = "carte-reservations";
const PLUGIN_VERSION = "0.1.0";
const TEST_SITE_URL = "https://example.com";

export function pluginContextFields<TStorage extends object>(storageConfig: TStorage) {
  return {
    plugin: { id: PLUGIN_ID, version: PLUGIN_VERSION },
    log: {
      debug: () => undefined,
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    },
    site: { name: "Carte Test", url: TEST_SITE_URL, locale: "en" },
    url: (path: string) => new URL(path, TEST_SITE_URL).toString(),
    ["storage"]: storageConfig,
  };
}
