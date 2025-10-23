import Toast from 'react-native-toast-message';
import { Config } from '@/constants/Config';

/**
 * Toast notification helper functions
 */

export function showError(message: string): void {
  Toast.show({
    type: 'error',
    text1: message,
    position: 'top',
    visibilityTime: Config.TOAST_DURATION,
    autoHide: true,
    topOffset: 50,
  });
}

export function showWarning(message: string): void {
  Toast.show({
    type: 'info',
    text1: message,
    position: 'top',
    visibilityTime: Config.TOAST_DURATION,
    autoHide: true,
    topOffset: 50,
  });
}

export function showSuccess(message: string): void {
  Toast.show({
    type: 'success',
    text1: message,
    position: 'top',
    visibilityTime: Config.TOAST_DURATION,
    autoHide: true,
    topOffset: 50,
  });
}
