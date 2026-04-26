export const Config = {
    // cmd >> ipconfig >> IPv4 >> n
    // API_URL: 'http://n:3000/api',

    API_URL: 'http://192.168.1.65:3000/api',

    TOKEN_KEY: 'ba_challenge_token',
    USER_KEY: 'ba_challenge_user',
    PAGE_SIZE: 10,
    REQUEST_TIMEOUT: 10000,
} as const;