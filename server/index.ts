import app from './src/app';
import { seedDefaultPresets } from './src/controllers/accessPresetController';
import logger from './src/utils/logger';

const PORT = process.env.PORT || 4000;

// Initialize System Defaults
seedDefaultPresets().then(() => {
  logger.info('Access protocols initialized');
}).catch(err => {
  logger.error({ err: err.message }, 'Failed to initialize protocols');
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Synkrypt Server started');
});
