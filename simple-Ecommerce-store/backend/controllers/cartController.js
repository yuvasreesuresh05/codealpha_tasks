const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart) {
            cart = await Cart.create({
                user: req.user.id,
                items: [],
                totalPrice: 0
            });
        }

        res.status(200).json({
            success: true,
            cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check stock
        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} items in stock`
            });
        }

        let cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            cart = await Cart.create({
                user: req.user.id,
                items: []
            });
        }

        // Check if product already in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
            // Update quantity
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;
            if (newQuantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot add more than ${product.stock} items`
                });
            }
            cart.items[existingItemIndex].quantity = newQuantity;
        } else {
            // Add new item
            cart.items.push({
                product: productId,
                name: product.name,
                price: product.price,
                quantity: quantity || 1,
                image: product.image
            });
        }

        // Calculate total
        cart.totalPrice = cart.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Item added to cart successfully',
            cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update/:productId
// @access  Private
const updateCartItem = async (req, res) => {
    try {
        const { quantity } = req.body;
        const { productId } = req.params;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1'
            });
        }

        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        // Check stock
        const product = await Product.findById(productId);
        if (product && quantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} items in stock`
            });
        }

        cart.items[itemIndex].quantity = quantity;
        
        // Calculate total
        cart.totalPrice = cart.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Cart updated successfully',
            cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:productId
// @access  Private
const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.items = cart.items.filter(
            item => item.product.toString() !== productId
        );

        // Calculate total
        cart.totalPrice = cart.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Item removed from cart',
            cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.items = [];
        cart.totalPrice = 0;
        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully',
            cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
};    