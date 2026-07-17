const express = require('express');
const router = express.Router();
const {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    getAllOrders
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// All order routes are protected
router.use(protect);

router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);

// Admin routes
router.put('/:id/status', authorize('admin'), updateOrderStatus);
router.get('/admin/all', authorize('admin'), getAllOrders);

module.exports = router;