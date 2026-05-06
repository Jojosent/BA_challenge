import { Config } from '@constants/config';

const getAvatarUrl = (url?: string) => {
  if (!url) return null;
  const baseUrl = Config.API_URL.split('/api')[0]; 
  return `${baseUrl}${url}`;
};
