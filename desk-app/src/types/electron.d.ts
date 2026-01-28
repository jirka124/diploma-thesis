export {};

declare global {
  interface Window {
    electronDeskVitalsAPI?: {
      minimize: () => void;
      close: () => void;
      toggleMaximize: () => Promise<boolean>;
      isMaximized: () => Promise<boolean>;
    };
  }
}
