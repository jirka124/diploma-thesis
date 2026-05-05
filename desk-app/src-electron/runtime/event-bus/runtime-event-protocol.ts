export type RuntimeEventMap = {
  'exercise:breakEveryMinChanged': {
    previous: number;
    current: number;
  };
  'exercise:exercisesPerBreakChanged': {
    previous: number;
    current: number;
  };
  'break-timer:break-due': {
    dueAtIso: string;
  };
};
