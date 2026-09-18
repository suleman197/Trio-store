const router = require('express').Router();
const ctrl = require('../controllers/searchController');

router.get('/suggest', ctrl.suggest);
router.post('/newsletter', ctrl.subscribeNewsletter);

module.exports = router;
