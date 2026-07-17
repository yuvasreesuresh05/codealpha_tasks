// ============================================
// API CONFIGURATION
// ============================================

// Detect environment
const isLocalFile = window.location.protocol === 'file:';
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';

// Set API URL based on environment
let API_URL = 'http://localhost:5000/api';

// If running from file:// protocol, use localhost
if (isLocalFile) {
    API_URL = 'http://localhost:5000/api';
    console.log('⚠️  Running from file:// protocol. Using localhost for API.');
}

console.log('🌐 API URL:', API_URL);
console.log('📁 Protocol:', window.location.protocol);
console.log('🖥️  Hostname:', window.location.hostname);

// ============================================
// AUTHENTICATION STATE
// ============================================

let authToken = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user')) || null;

// ============================================
// API HELPER FUNCTIONS
// ============================================

// Main API call function with better error handling
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };
    
    // Add authorization token if available
    if (authToken) {
        options.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    // Add body for non-GET requests
    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }
    
    try {
        const url = `${API_URL}${endpoint}`;
        console.log(`📡 ${method} ${url}`);
        
        const response = await fetch(url, options);
        
        // Check if response is ok
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ API Response:', result);
        return result;
        
    } catch (error) {
        console.error('❌ API Error:', error);
        
        // Handle specific error types
        if (error.message.includes('Failed to fetch')) {
            return {
                success: false,
                message: 'Cannot connect to server. Please make sure the backend is running on http://localhost:5000'
            };
        }
        
        if (error.message.includes('NetworkError')) {
            return {
                success: false,
                message: 'Network error. Please check your internet connection.'
            };
        }
        
        return {
            success: false,
            message: error.message || 'An error occurred while making the request'
        };
    }
}

// ============================================
// CART BADGE FUNCTIONS
// ============================================

// Update cart badge in header
function updateCartBadge() {
    const cartBadge = document.getElementById('cart-badge');
    if (!cartBadge) return;
    
    try {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        if (totalItems > 0) {
            cartBadge.textContent = totalItems;
            cartBadge.style.display = 'inline-block';
        } else {
            cartBadge.style.display = 'none';
        }
    } catch (error) {
        console.error('Error updating cart badge:', error);
    }
}

// ============================================
// NAVIGATION FUNCTIONS
// ============================================

// Update navigation based on login status
function updateNavigation() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    // Find if we're on orders page
    const isOrdersPage = window.location.pathname.includes('orders.html');
    const isCheckoutPage = window.location.pathname.includes('checkout.html');

    if (authToken && currentUser) {
        // User is logged in
        let navHTML = `
            <a href="index.html">Home</a>
            <a href="products.html">Products</a>
            <a href="cart.html">Cart <span id="cart-badge" style="background: #ff9800; color: white; border-radius: 50%; padding: 2px 8px; font-size: 12px; margin-left: 5px; display: none;">0</span></a>
            <a href="orders.html">Orders</a>
            <a href="#" onclick="logoutUser(event)">Logout (${currentUser.name})</a>
        `;
        
        nav.innerHTML = navHTML;
    } else {
        // User is logged out
        let navHTML = `
            <a href="index.html">Home</a>
            <a href="products.html">Products</a>
            <a href="cart.html">Cart <span id="cart-badge" style="background: #ff9800; color: white; border-radius: 50%; padding: 2px 8px; font-size: 12px; margin-left: 5px; display: none;">0</span></a>
            <a href="login.html">Login</a>
            <a href="register.html">Register</a>
        `;
        
        nav.innerHTML = navHTML;
    }
    
    // Update cart badge after navigation update
    setTimeout(updateCartBadge, 100);
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

// Register user
async function registerUser(event) {
    event.preventDefault();
    
    const form = document.getElementById('register-form');
    const name = form.querySelector('input[placeholder="Full Name"]').value;
    const email = form.querySelector('input[placeholder="Email Address"]').value;
    const password = form.querySelector('input[placeholder="Password"]').value;
    const confirmPassword = form.querySelector('input[placeholder="Confirm Password"]').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        alert('❌ Passwords do not match!');
        return;
    }
    
    // Validate password length
    if (password.length < 6) {
        alert('❌ Password must be at least 6 characters long!');
        return;
    }
    
    try {
        const result = await apiCall('/auth/register', 'POST', {
            name,
            email,
            password
        });
        
        if (result.success) {
            alert('✅ Registration successful! Please login.');
            window.location.href = 'login.html';
        } else {
            alert('❌ ' + (result.message || 'Registration failed. Please try again.'));
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('❌ An error occurred during registration. Please try again.');
    }
}

// Login user
async function loginUser(event) {
    event.preventDefault();
    
    const form = document.getElementById('login-form');
    const email = form.querySelector('input[placeholder="Email Address"]').value;
    const password = form.querySelector('input[placeholder="Password"]').value;
    
    if (!email || !password) {
        alert('❌ Please enter both email and password');
        return;
    }
    
    try {
        const result = await apiCall('/auth/login', 'POST', {
            email,
            password
        });
        
        if (result.success) {
            authToken = result.token;
            currentUser = result.user;
            
            localStorage.setItem('token', authToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            alert(`✅ Welcome back, ${currentUser.name}!`);
            window.location.href = 'index.html';
        } else {
            alert('❌ ' + (result.message || 'Login failed. Please check your credentials.'));
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('❌ An error occurred during login. Please try again.');
    }
}

// Logout user
function logoutUser(event) {
    if (event) event.preventDefault();
    
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        authToken = null;
        currentUser = null;
        window.location.href = 'index.html';
    }
}

// ============================================
// CART FUNCTIONS
// ============================================

// Add to cart using backend
async function addToCart(productId, name, price) {
    if (!authToken) {
        // Fallback to local storage if not logged in
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            cart.push({
                id: productId,
                name: name,
                price: price,
                quantity: 1,
                image: ''
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartBadge();
        alert(`${name} added to cart! (Local)`);
        return;
    }
    
    try {
        const result = await apiCall('/cart/add', 'POST', {
            productId: productId,
            quantity: 1
        });
        
        if (result.success) {
            // Update local cart
            let localCart = JSON.parse(localStorage.getItem('cart')) || [];
            const existingItem = localCart.find(item => item.id === productId);
            
            if (existingItem) {
                existingItem.quantity = (existingItem.quantity || 1) + 1;
            } else {
                localCart.push({
                    id: productId,
                    name: name,
                    price: price,
                    quantity: 1,
                    image: ''
                });
            }
            
            localStorage.setItem('cart', JSON.stringify(localCart));
            updateCartBadge();
            alert(`✅ ${name} added to cart!`);
        } else {
            alert('❌ ' + (result.message || 'Failed to add item to cart'));
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        alert('❌ Failed to add item to cart. Please try again.');
    }
}

// Get cart from backend
async function getCart() {
    if (!authToken) {
        // Return local cart
        const localCart = JSON.parse(localStorage.getItem('cart')) || [];
        return {
            success: true,
            cart: {
                items: localCart.map(item => ({
                    product: { _id: item.id },
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity || 1,
                    image: item.image || ''
                })),
                totalPrice: localCart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)
            }
        };
    }
    
    try {
        const result = await apiCall('/cart', 'GET');
        if (result.success) {
            // Update local cart
            const localCart = result.cart.items.map(item => ({
                id: item.product._id || item.product,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image || ''
            }));
            localStorage.setItem('cart', JSON.stringify(localCart));
            return result;
        }
        return { success: false, cart: { items: [], totalPrice: 0 } };
    } catch (error) {
        console.error('Get cart error:', error);
        return { success: false, cart: { items: [], totalPrice: 0 } };
    }
}

// Update cart item quantity
async function updateCartItem(productId, quantity) {
    if (quantity < 0) {
        removeFromCart(productId);
        return;
    }
    
    if (quantity === 0) {
        removeFromCart(productId);
        return;
    }
    
    if (!authToken) {
        // Update local storage
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity = quantity;
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartBadge();
            displayCart();
        }
        return;
    }
    
    try {
        const result = await apiCall(`/cart/update/${productId}`, 'PUT', { quantity });
        if (result.success) {
            // Update local storage
            let localCart = JSON.parse(localStorage.getItem('cart')) || [];
            const item = localCart.find(item => item.id === productId);
            if (item) {
                item.quantity = quantity;
                localStorage.setItem('cart', JSON.stringify(localCart));
            }
            updateCartBadge();
            displayCart();
        } else {
            alert('❌ ' + (result.message || 'Failed to update cart'));
        }
    } catch (error) {
        console.error('Update cart error:', error);
        alert('❌ Failed to update cart. Please try again.');
    }
}

// Remove item from cart
async function removeFromCart(productId) {
    if (!confirm('Remove this item from cart?')) return;
    
    if (!authToken) {
        // Remove from local storage
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart = cart.filter(item => item.id !== productId);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartBadge();
        displayCart();
        return;
    }
    
    try {
        const result = await apiCall(`/cart/remove/${productId}`, 'DELETE');
        if (result.success) {
            // Update local storage
            let localCart = JSON.parse(localStorage.getItem('cart')) || [];
            localCart = localCart.filter(item => item.id !== productId);
            localStorage.setItem('cart', JSON.stringify(localCart));
            updateCartBadge();
            displayCart();
        } else {
            alert('❌ ' + (result.message || 'Failed to remove item'));
        }
    } catch (error) {
        console.error('Remove from cart error:', error);
        alert('❌ Failed to remove item. Please try again.');
    }
}

// Clear entire cart
async function clearCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert('Your cart is already empty!');
        return;
    }
    
    if (!confirm('Are you sure you want to clear your entire cart?')) return;
    
    if (!authToken) {
        localStorage.setItem('cart', JSON.stringify([]));
        updateCartBadge();
        displayCart();
        alert('Cart cleared successfully!');
        return;
    }
    
    try {
        const result = await apiCall('/cart/clear', 'DELETE');
        if (result.success) {
            localStorage.setItem('cart', JSON.stringify([]));
            updateCartBadge();
            displayCart();
            alert('✅ Cart cleared successfully!');
        } else {
            alert('❌ ' + (result.message || 'Failed to clear cart'));
        }
    } catch (error) {
        console.error('Clear cart error:', error);
        alert('❌ Failed to clear cart. Please try again.');
    }
}

// Display cart items
async function displayCart() {
    const cartContainer = document.getElementById('cart-items');
    const totalElement = document.getElementById('total');
    const subtotalElement = document.getElementById('subtotal');
    const shippingElement = document.getElementById('shipping');
    
    if (!cartContainer) return;
    
    // Get cart
    const result = await getCart();
    const cart = result.success ? result.cart : { items: [], totalPrice: 0 };
    
    // Check if cart is empty
    if (!cart.items || cart.items.length === 0) {
        cartContainer.innerHTML = `
            <div style="padding: 60px 20px; text-align: center; background: white; border-radius: 10px; max-width: 500px; margin: 0 auto;">
                <div style="font-size: 64px; margin-bottom: 20px;">🛒</div>
                <h3 style="color: #666; margin-bottom: 10px;">Your cart is empty</h3>
                <p style="margin: 20px 0; color: #888;">Looks like you haven't added any items yet.</p>
                <a href="products.html">
                    <button style="background: #2196f3; padding: 12px 30px; border: none; color: white; border-radius: 5px; cursor: pointer; font-size: 16px;">
                        Start Shopping
                    </button>
                </a>
            </div>
        `;
        
        if (totalElement) totalElement.innerHTML = 'Total: ₹0';
        if (subtotalElement) subtotalElement.textContent = '₹0';
        if (shippingElement) shippingElement.textContent = '₹0';
        updateCartBadge();
        return;
    }
    
    // Display cart items
    cartContainer.innerHTML = '';
    let subtotal = 0;
    
    cart.items.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        const productId = item.product._id || item.product;
        
        cartContainer.innerHTML += `
            <div class="card" style="display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 600px; margin: 10px auto; padding: 15px 20px; text-align: left;">
                <div style="display: flex; align-items: center; gap: 15px; flex: 1;">
                    <img src="${item.image || 'https://via.placeholder.com/60'}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" onerror="this.src='https://via.placeholder.com/60'">
                    <div style="flex: 1;">
                        <h3 style="margin: 0; font-size: 16px;">${item.name}</h3>
                        <p style="margin: 5px 0; color: #666; font-size: 14px;">₹${item.price} × ${item.quantity}</p>
                        <p style="margin: 0; color: green; font-weight: bold; font-size: 16px;">₹${itemTotal}</p>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button onclick="updateCartItem('${productId}', ${item.quantity + 1})" style="padding: 6px 12px; background: #2196f3; border: none; color: white; border-radius: 4px; cursor: pointer; font-size: 14px;">+</button>
                    <button onclick="updateCartItem('${productId}', ${item.quantity - 1})" style="padding: 6px 12px; background: #ff9800; border: none; color: white; border-radius: 4px; cursor: pointer; font-size: 14px;">-</button>
                    <button onclick="removeFromCart('${productId}')" style="padding: 6px 12px; background: #f44336; border: none; color: white; border-radius: 4px; cursor: pointer; font-size: 14px;">×</button>
                </div>
            </div>
        `;
    });
    
    // Calculate shipping (free above ₹500)
    const shippingCost = subtotal > 500 ? 0 : 50;
    const total = subtotal + shippingCost;
    
    // Update summary
    if (totalElement) totalElement.innerHTML = `Total: ₹${total}`;
    if (subtotalElement) subtotalElement.textContent = `₹${subtotal}`;
    if (shippingElement) shippingElement.textContent = shippingCost === 0 ? 'FREE' : `₹${shippingCost}`;
    
    // Update cart badge
    updateCartBadge();
}

// ============================================
// PRODUCT FUNCTIONS
// ============================================

// Load products from backend
async function loadProducts() {
    const productContainer = document.querySelector('.products');
    if (!productContainer) return;
    
    try {
        const result = await apiCall('/products', 'GET');
        
        if (result.success && result.products && result.products.length > 0) {
            productContainer.innerHTML = '';
            result.products.forEach(product => {
                productContainer.innerHTML += `
                    <div class="card">
                        <img src="${product.image || 'https://via.placeholder.com/260x200'}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/260x200'">
                        <h3>${product.name}</h3>
                        <p>₹${product.price}</p>
                        <div class="btn-group" style="display: flex; gap: 5px; flex-wrap: wrap;">
                            <a href="product.html?id=${product._id}" style="flex: 1;">
                                <button style="width: 100%; padding: 8px;">View Details</button>
                            </a>
                            <button onclick="addToCart('${product._id}', '${product.name}', ${product.price})" style="flex: 1; padding: 8px;">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                `;
            });
        } else {
            productContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; width: 100%;">
                    <p>No products found. Please check back later.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Load products error:', error);
        productContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; width: 100%;">
                <p style="color: red;">Error loading products. Please try again.</p>
                <button onclick="loadProducts()" style="margin-top: 10px; padding: 10px 20px; background: #2196f3; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    }
}

// Load product details
async function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const container = document.getElementById('product-detail');
    
    if (!container || !productId) return;
    
    try {
        const result = await apiCall(`/products/${productId}`, 'GET');
        
        if (result.success) {
            const product = result.product;
            container.innerHTML = `
                <img src="${product.image || 'https://via.placeholder.com/260x200'}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/260x200'" style="width:100%; border-radius:10px;">
                <h2>${product.name}</h2>
                <p><strong>Price:</strong> ₹${product.price}</p>
                <p><strong>Category:</strong> ${product.category}</p>
                <p><strong>Stock:</strong> ${product.stock} items</p>
                <p><strong>Rating:</strong> ⭐ ${product.rating || 0} (${product.numReviews || 0} reviews)</p>
                <p style="text-align:left; margin: 20px 0;">${product.description}</p>
                ${product.stock > 0 ? `
                    <button onclick="addToCart('${product._id}', '${product.name}', ${product.price})" style="width:100%; padding:12px; background:#2196f3; color:white; border:none; border-radius:5px; cursor:pointer;">
                        Add to Cart
                    </button>
                ` : `
                    <p style="color:red;"><strong>Out of Stock</strong></p>
                `}
                <br><br>
                <a href="products.html"><button style="width:100%; padding:12px; background:#666; color:white; border:none; border-radius:5px; cursor:pointer;">
                    Back to Products
                </button></a>
            `;
        } else {
            container.innerHTML = `
                <h2>Product Not Found</h2>
                <p>Sorry, the product you're looking for doesn't exist.</p>
                <a href="products.html"><button>Back to Products</button></a>
            `;
        }
    } catch (error) {
        console.error('Load product detail error:', error);
        container.innerHTML = `
            <h2>Error Loading Product</h2>
            <p>There was an error loading the product details.</p>
            <a href="products.html"><button>Back to Products</button></a>
        `;
    }
}

// ============================================
// ORDER FUNCTIONS
// ============================================

// Place order
async function placeOrder(event) {
    event.preventDefault();
    
    if (!authToken) {
        alert('❌ Please login first to place an order!');
        window.location.href = 'login.html';
        return;
    }
    
    const form = document.getElementById('checkout-form');
    const name = form.querySelector('input[placeholder="Full Name"]').value;
    const street = form.querySelector('input[placeholder="Delivery Address"]').value;
    const city = form.querySelector('input[placeholder="City"]').value;
    const pincode = form.querySelector('input[placeholder="Pincode"]').value;
    const phone = form.querySelector('input[placeholder="Mobile Number"]').value;
    const paymentMethod = form.querySelector('select').value;
    
    // Validate all fields
    if (!name || !street || !city || !pincode || !phone || !paymentMethod) {
        alert('❌ Please fill in all fields!');
        return;
    }
    
    try {
        const orderData = {
            shippingAddress: {
                street,
                city,
                state: 'State',
                pincode,
                country: 'India'
            },
            paymentMethod
        };
        
        const result = await apiCall('/orders', 'POST', orderData);
        
        if (result.success) {
            alert(`✅ Order Placed Successfully!\n\nOrder ID: ${result.order._id}\nTotal: ₹${result.order.total}\n\nThank you for shopping with ShopEasy!`);
            
            // Clear local cart
            localStorage.setItem('cart', JSON.stringify([]));
            window.location.href = 'orders.html';
        } else {
            alert('❌ ' + (result.message || 'Failed to place order. Please try again.'));
        }
    } catch (error) {
        console.error('Place order error:', error);
        alert('❌ Failed to place order. Please try again.');
    }
}

// Load orders
async function loadOrders() {
    const ordersContainer = document.getElementById('orders-container');
    if (!ordersContainer) return;
    
    if (!authToken) {
        ordersContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p>Please login to view your orders</p>
                <a href="login.html"><button style="margin-top:20px; padding: 10px 30px; background: #2196f3; color: white; border: none; border-radius: 5px; cursor: pointer;">Login</button></a>
            </div>
        `;
        return;
    }
    
    try {
        const result = await apiCall('/orders', 'GET');
        
        if (result.success && result.orders && result.orders.length > 0) {
            ordersContainer.innerHTML = '<h2 style="margin-bottom: 30px;">My Orders</h2>';
            result.orders.forEach(order => {
                const date = new Date(order.createdAt).toLocaleDateString('en-IN');
                const items = order.items.map(item => `${item.name} × ${item.quantity}`).join(', ');
                
                ordersContainer.innerHTML += `
                    <div class="card" style="width: 100%; max-width: 600px; margin: 10px auto; text-align: left; padding: 20px;">
                        <p><strong>Order #:</strong> ${order._id.substring(0, 8)}</p>
                        <p><strong>Date:</strong> ${date}</p>
                        <p><strong>Items:</strong> ${items}</p>
                        <p><strong>Total:</strong> ₹${order.total}</p>
                        <p><strong>Status:</strong> 
                            <span style="color: ${order.orderStatus === 'delivered' ? 'green' : order.orderStatus === 'cancelled' ? 'red' : '#ff9800'};">
                                ${order.orderStatus.toUpperCase()}
                            </span>
                        </p>
                        <p><strong>Payment:</strong> ${order.paymentMethod.toUpperCase()}</p>
                    </div>
                `;
            });
        } else {
            ordersContainer.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h2>No Orders Yet</h2>
                    <p>Start shopping to place your first order!</p>
                    <a href="products.html"><button style="margin-top:20px; padding: 10px 30px; background: #2196f3; color: white; border: none; border-radius: 5px; cursor: pointer;">Browse Products</button></a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Load orders error:', error);
        ordersContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p>Error loading orders. Please try again later.</p>
            </div>
        `;
    }
}

// ============================================
// FORM SETUP
// ============================================

function setupForms() {
    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', registerUser);
    }
    
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', loginUser);
    }
    
    // Checkout form
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', placeOrder);
    }
}

// ============================================
// PAGE INITIALIZATION
// ============================================

// Initialize page
async function initializePage() {
    // Update navigation
    updateNavigation();
    
    // Update cart badge
    updateCartBadge();
    
    // Setup forms
    setupForms();
    
    // Get current page
    const page = window.location.pathname.split('/').pop() || 'index.html';
    
    // Load page-specific content
    switch(page) {
        case 'index.html':
        case '':
            await loadProducts();
            break;
        case 'products.html':
            await loadProducts();
            break;
        case 'product.html':
            await loadProductDetail();
            break;
        case 'cart.html':
            await displayCart();
            break;
        case 'orders.html':
            await loadOrders();
            break;
        case 'checkout.html':
            // Check if cart is empty
            const cartResult = await getCart();
            if (cartResult.success && (!cartResult.cart.items || cartResult.cart.items.length === 0)) {
                const checkoutForm = document.getElementById('checkout-form');
                if (checkoutForm) {
                    checkoutForm.innerHTML = `
                        <h2>Cart is Empty</h2>
                        <p style="text-align:center; margin:20px 0;">Please add items to your cart before checking out.</p>
                        <a href="products.html"><button style="width:100%; padding:12px; background:#2196f3; color:white; border:none; border-radius:5px; cursor:pointer;">Browse Products</button></a>
                    `;
                }
            }
            break;
        case 'login.html':
            // Redirect if already logged in
            if (authToken) {
                window.location.href = 'index.html';
            }
            break;
        case 'register.html':
            // Redirect if already logged in
            if (authToken) {
                window.location.href = 'index.html';
            }
            break;
    }
}

// ============================================
// START APPLICATION
// ============================================

// Make functions globally accessible
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.updateCartItem = updateCartItem;
window.logoutUser = logoutUser;
window.displayCart = displayCart;
window.loadProducts = loadProducts;
window.updateCartBadge = updateCartBadge;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 ShopEasy Application Initializing...');
    initializePage();
});

console.log('✅ ShopEasy JavaScript loaded successfully!');
console.log('🔑 Auth Token:', authToken ? 'Present' : 'Not present');
console.log('👤 Current User:', currentUser ? currentUser.name : 'Not logged in');