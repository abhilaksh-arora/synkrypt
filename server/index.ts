import app from './src/app';
import { seedDefaultPresets } from './src/controllers/accessPresetController';

const PORT = process.env.PORT || 4000;

// Initialize System Defaults
seedDefaultPresets().then(() => {
  console.log(' Access protocols initialized.');
}).catch(err => {
  console.error(' Failed to initialize protocols:', err);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
