export {};

declare global {
  interface Window {
    electronDeskVitalsAPI?: {
      minimize: () => void;
      minimizeFor: (seconds: number) => Promise<boolean>;
      close: () => void;
      toggleMaximize: () => Promise<boolean>;
      isMaximized: () => Promise<boolean>;
      openExerciseWindow: (payload?: { route?: string; focus?: boolean }) => Promise<boolean>;
    };
  }
}
