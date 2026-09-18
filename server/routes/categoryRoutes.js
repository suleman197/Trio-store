const router = require('express').Router();
const categoryCtrl = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { categoryRules, categoryUpdateRules } = require('../validators/productValidator');

router.get('/', categoryCtrl.getCategories);
router.get('/:id', categoryCtrl.getCategory);

router.post('/', protect, authorize('admin'), categoryRules, validate, categoryCtrl.createCategory);
router.put('/:id', protect, authorize('admin'), categoryUpdateRules, validate, categoryCtrl.updateCategory);
router.delete('/:id', protect, authorize('admin'), categoryCtrl.deleteCategory);

module.exports = router;
