// ============================================
// FILE: /krayvo-website/js/firebase.js
// Firebase Firestore Configuration
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyD-PLACEHOLDER-KEY-REPLACE-WITH-YOURS",
    authDomain: "krayvo-app.firebaseapp.com",
    projectId: "krayvo-app",
    storageBucket: "krayvo-app.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:xxxxxxxxxxxxxxxxxxxx"
};

let db = null;
let firebaseAvailable = false;

try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    firebaseAvailable = true;
    console.log('Firebase initialized successfully');
} catch (error) {
    console.warn('Firebase initialization failed, using demo data:', error.message);
    firebaseAvailable = false;
}

// Demo product data (fallback when Firestore unavailable)
const DEMO_PRODUCTS = [
    { id: 'p1', brand: 'Samsung', title: 'Galaxy S25 Ultra 5G (256GB, Titanium Black)', price: 124999, originalPrice: 149999, discount: 17, platform: 'amazon', category: 'mobile', image: 'https://picsum.photos/seed/samsung25/400/400', rating: 4.7 },
    { id: 'p2', brand: 'Apple', title: 'iPhone 16 Pro Max (256GB, Natural Titanium)', price: 144900, originalPrice: 159900, discount: 9, platform: 'flipkart', category: 'mobile', image: 'https://picsum.photos/seed/iphone16/400/400', rating: 4.8 },
    { id: 'p3', brand: 'Nike', title: 'Air Max 270 React Premium Running Shoes', price: 8995, originalPrice: 14995, discount: 40, platform: 'myntra', category: 'fashion', image: 'https://picsum.photos/seed/nike270/400/400', rating: 4.5 },
    { id: 'p4', brand: 'MAC', title: 'Studio Fix Fluid Foundation SPF 15 (NC30)', price: 3200, originalPrice: 4200, discount: 24, platform: 'ajio', category: 'beauty', image: 'https://picsum.photos/seed/macstudio/400/400', rating: 4.6 },
    { id: 'p5', brand: 'Sony', title: 'WH-1000XM6 Wireless Noise Cancelling Headphones', price: 24990, originalPrice: 34990, discount: 29, platform: 'amazon', category: 'electronics', image: 'https://picsum.photos/seed/sonyxm6/400/400', rating: 4.9 },
    { id: 'p6', brand: 'Prestige', title: 'Induction Cooktop with Auto Shut-off (2000W)', price: 1899, originalPrice: 3299, discount: 42, platform: 'meesho', category: 'home', image: 'https://picsum.photos/seed/prestige/400/400', rating: 4.3 },
    { id: 'p7', brand: 'Titan', title: 'Analog Blue Dial Stainless Steel Watch', price: 5495, originalPrice: 7995, discount: 31, platform: 'savana', category: 'accessories', image: 'https://picsum.photos/seed/titanwatch/400/400', rating: 4.4 },
    { id: 'p8', brand: 'Atomic Habits', title: 'James Clear — The Life-Changing Million Copy Bestseller', price: 349, originalPrice: 799, discount: 56, platform: 'flipkart', category: 'books', image: 'https://picsum.photos/seed/atomichabits/400/400', rating: 4.8 },
    { id: 'p9', brand: 'OnePlus', title: 'OnePlus 13R 5G (128GB, Astral Trail)', price: 39999, originalPrice: 45999, discount: 13, platform: 'amazon', category: 'mobile', image: 'https://picsum.photos/seed/oneplus13/400/400', rating: 4.6 },
    { id: 'p10', brand: 'Levi\'s', title: '511 Slim Fit Stretch Jeans (Dark Blue)', price: 2499, originalPrice: 3999, discount: 38, platform: 'myntra', category: 'fashion', image: 'https://picsum.photos/seed/levis511/400/400', rating: 4.3 },
    { id: 'p11', brand: 'Dyson', title: 'V15 Detect Absolute Cordless Vacuum Cleaner', price: 54900, originalPrice: 62900, discount: 13, platform: 'flipkart', category: 'home', image: 'https://picsum.photos/seed/dysonv15/400/400', rating: 4.9 },
    { id: 'p12', brand: 'JBL', title: 'Charge 6 Portable Bluetooth Speaker (Blue)', price: 12999, originalPrice: 16999, discount: 24, platform: 'ajio', category: 'electronics', image: 'https://picsum.photos/seed/jblcharge/400/400', rating: 4.5 },
];

// Fetch products from Firestore or use demo data
async function fetchProducts(options = {}) {
    const { category = 'all', platform = 'all', searchQuery = '', limit = 20 } = options;
    let products = [];

    if (firebaseAvailable && db) {
        try {
            let query = db.collection('products').limit(limit);
            if (category !== 'all') {
                query = query.where('category', '==', category);
            }
            if (platform !== 'all') {
                query = query.where('platform', '==', platform);
            }
            const snapshot = await query.get();
            products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (products.length === 0) products = [...DEMO_PRODUCTS];
        } catch (error) {
            console.warn('Firestore fetch failed, using demo data:', error);
            products = [...DEMO_PRODUCTS];
        }
    } else {
        products = [...DEMO_PRODUCTS];
        // Simulate network delay
        await new Promise(r => setTimeout(r, 300));
    }

    // Client-side filtering
    if (category !== 'all') {
        products = products.filter(p => p.category === category);
    }
    if (platform !== 'all') {
        products = products.filter(p => p.platform === platform);
    }
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        products = products.filter(p =>
            p.title.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        );
    }

    return products;
}
