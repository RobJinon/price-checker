import { ConfigContext, ExpoConfig } from 'expo/config';

const APP_VARIANT = process.env.APP_VARIANT;
const IS_DEV = APP_VARIANT === 'development';
const IS_ALPHA = APP_VARIANT === 'alpha';

const BASE_PACKAGE = 'com.robjinon.pricechecker';

const getAppName = (defaultName?: string) => {
  if (IS_DEV) return 'Price Checker (Dev)';
  if (IS_ALPHA) return 'Price Checker (Alpha)';
  return defaultName ?? 'Price Checker';
};

const getAndroidPackage = () => {
  if (IS_DEV) return `${BASE_PACKAGE}.dev`;
  if (IS_ALPHA) return `${BASE_PACKAGE}.alpha`;
  return BASE_PACKAGE;
};

const getScheme = () => {
  if (IS_DEV) return 'price-checker-dev';
  if (IS_ALPHA) return 'price-checker-alpha';
  return 'price-checker';
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(config.name),
  slug: config.slug ?? 'price-checker',
  scheme: getScheme(),
  android: {
    ...config.android,
    package: getAndroidPackage(),
  },
});