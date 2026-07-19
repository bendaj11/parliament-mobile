import { ReactNode } from 'react';
import type { ModalOptions as AngularModalOptions } from '@ionic/angular/common';

type ShowToastOptions = {
  title?: string;
  dismissable?: boolean;
  level?: 'info' | 'success' | 'warning' | 'error';
};

export interface ParliamentAngularHostSdk {
  showToast: (message: string, options?: ShowToastOptions) => void;
  openModal: (options: AngularModalOptions) => Promise<HTMLIonModalElement>;
}

export interface ParliamentReactHostSdk {
  showToast: (message: string, options?: ShowToastOptions) => void;
  openModal: <T>(component: ReactNode) => { close: (data: T) => void };
}
