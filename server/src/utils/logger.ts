import pino from 'pino';
import path from 'path';

const transport = pino.transport({
  targets: [
    {
      target: 'pino-pretty',
      level: process.env.LOG_LEVEL || 'info',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
    {
      target: 'pino-roll',
      level: process.env.LOG_LEVEL || 'info',
      options: {
        file: path.join(process.cwd(), '../logs/synkrypt.log'),
        frequency: 'daily',
        mkdir: true,
      },
    },
  ],
});

const logger = pino(transport);

export default logger;
