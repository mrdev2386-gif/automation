/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
    },
    typescript: {
        tsconfigPath: './tsconfig.json',
    },
    eslint: {
        ignoreDuringBuilds: false,
    },
};

module.exports = nextConfig;
