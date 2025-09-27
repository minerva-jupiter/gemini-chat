import type { NextConfig } from 'next';

const repositoryName: string = 'nextjs';
const isProduction: boolean = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  devIndicators: false,
  output: 'export', // 静的書き出し
  ...(isProduction // 本番環境ではbasePath、assetPrefixを変更
    ? {
        basePath: `/${repositoryName}`,
        assetPrefix: `/${repositoryName}/`,
      }
    : {}),
};

export default nextConfig;
