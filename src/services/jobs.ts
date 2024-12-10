
const jobs: Record<string, Promise<unknown>> = {};

export const getJob = (code: string): Promise<unknown> | undefined => jobs[code];

export const shelveJob = (code: string, job: Promise<unknown>) => {
  jobs[code] = job;
  job.finally(() => delete jobs[code]);
};
