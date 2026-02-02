console.log("BACKGROUND LOCATION JS LOADED");
import { registerPlugin } from '@capacitor/core';

export const BackgroundLocation = registerPlugin('BackgroundLocation', {
  web: () => ({
    start: async () => console.warn('BackgroundLocation not available on web'),
    stop: async () => console.warn('BackgroundLocation not available on web'),
    addListener: () => ({ remove: () => {} })
  })
});
