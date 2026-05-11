export const importerLogger = {
  info: (message: string, meta?: any) => {
    console.log(`[IMPORTER][INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[IMPORTER][WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[IMPORTER][ERROR] ${message}`, error);
  },
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[IMPORTER][DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  }
};
