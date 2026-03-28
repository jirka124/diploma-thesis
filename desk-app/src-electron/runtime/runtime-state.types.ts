export type RuntimeStateSmokeTestResult = {
  dbPath: string;
  selectOneValue: number;
  testRowExists: boolean;
  updatedAtIso: string;
  rowCount: number;
};
