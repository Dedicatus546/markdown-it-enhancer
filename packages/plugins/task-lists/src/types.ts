export interface TaskListsOptions {
  enabled?: boolean;
  label?: boolean;
  labelAfter?: boolean;
}

export type TaskListsNormalizedOptions = Required<TaskListsOptions>;
