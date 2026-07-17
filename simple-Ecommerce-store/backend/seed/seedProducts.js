const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');

dotenv.config();

const products = [
    {
        name: 'Wireless Headphones',
        description: 'Experience premium sound quality with Bluetooth connectivity, 40-hour battery life, fast charging, noise isolation, and a comfortable over-ear design for music, gaming, and work.',
        price: 1999,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        stock: 50,
        rating: 4.5,
        numReviews: 12
    },
    {
        name: 'Smart Watch',
        description: 'Stay connected with this feature-packed smartwatch. Includes heart rate monitor, GPS, sleep tracking, and 7-day battery life. Water-resistant design perfect for fitness enthusiasts.',
        price: 2499,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        stock: 30,
        rating: 4.3,
        numReviews: 8
    },
    {
        name: 'Running Shoes',
        description: 'Lightweight and comfortable running shoes with cushioned soles for maximum comfort. Breathable material keeps your feet cool during long runs.',
        price: 3299,
        category: 'Footwear',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        stock: 25,
        rating: 4.7,
        numReviews: 15
    },
    {
        name: 'Travel Backpack',
        description: 'Durable and spacious travel backpack with multiple compartments. Water-resistant material with padded straps for comfortable carrying.',
        price: 1499,
        category: 'Accessories',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
        stock: 40,
        rating: 4.1,
        numReviews: 7
    },
    {
        name: 'Polarized Sunglasses',
        description: 'Premium polarized sunglasses with UV protection. Lightweight frame design with scratch-resistant lenses for clear vision.',
        price: 899,
        category: 'Accessories',
        image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500',
        stock: 60,
        rating: 4.2,
        numReviews: 9
    },
    {
        name: 'Classic Watch',
        description: 'Elegant classic watch with leather strap. Swiss movement mechanism with water resistance and scratch-proof glass.',
        price: 4999,
        category: 'Fashion',
        image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500',
        stock: 15,
        rating: 4.8,
        numReviews: 20
    }
];

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing products
        await Product.deleteMany();
        console.log('Cleared existing products');

        // Insert new products
        await Product.insertMany(products);
        console.log('✅ Products seeded successfully');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding products:', error);
        process.exit(1);
    }
};

seedProducts();