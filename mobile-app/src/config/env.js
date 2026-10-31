import { Platform } from 'react-native';

// In Web browser mode, relative URL '/api/v1' is proxied by Metro to http://localhost:8088
// In Android emulator, 10.0.2.2 points to host machine localhost.
// In iOS simulator, localhost points to host machine localhost.
// For physical devices, set this to your local machine LAN IP, e.g., 'http://192.168.1.100:8088/api/v1'
const getDevApiUrl = () => {
  if (Platform.OS === 'web') {
    return '/api/v1';
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8088/api/v1';
  }
  return 'http://localhost:8088/api/v1';
};

export const Config = {
  API_BASE_URL: getDevApiUrl(),
  APP_NAME: 'SurakshaNet',
  APP_SUBTITLE: 'Police Investigation GIS',
  VERSION: '2.4.0',
};

export const ENV = Config;
