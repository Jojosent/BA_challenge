module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            [
                'module-resolver',
                {
                    root: ['./'],
                    alias: {
                        '@': './src',
                        '@components': './src/components',
                        '@screens': './src/screens',
                        '@store': './src/store',
                        '@services': './src/services',
                        '@hooks': './src/hooks',
                        '@types': './src/types',
                        '@constants': './src/constants',
                        '@utils': './src/utils',
                    },
                },
            ],
        ],
    };
};