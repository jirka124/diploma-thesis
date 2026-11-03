export type RuntimeEventMap = {
  'exercise:breakEveryMinChanged': {
    previous: number;
    current: number;
  };
  'exercise:exercisesPerBreakChanged': {
    previous: number;
    current: number;
  };
  'break:due': {
    dueAtIso: string;
  };
  'break-session:started': {
    startedAtIso: string;
  };
  'break-session:canceled': {
    canceledAtIso: string;
  };
  'break-session:finished': {
    finishedAtIso: string;
  };
};
