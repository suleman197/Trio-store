const router = require('express').Router();
const settingsCtrl = require('../controllers/siteSettingsController');
const { protect, authorize } = require('../middleware/auth');

// GET /api/settings — public
router.get('/', settingsCtrl.getSettings);

// PUT /api/settings — admin only
router.put('/', protect, authorize('admin'), settingsCtrl.updateSettings);

module.exports = router;
