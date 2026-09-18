const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/authController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { registerRules, loginRules, forgotRules, resetRules } = require('../validators/authValidator');

// Throttle brute-force attempts on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many attempts — please try again later' },
});

router.post('/register', authLimiter, registerRules, validate, ctrl.register);
router.post('/login', authLimiter, loginRules, validate, ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/me', protect, ctrl.getMe);
router.put('/me', protect, ctrl.updateMe);
router.post('/forgot-password', authLimiter, forgotRules, validate, ctrl.forgotPassword);
router.post('/reset-password', authLimiter, resetRules, validate, ctrl.resetPassword);

module.exports = router;
