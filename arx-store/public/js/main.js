const products = [
    { id: 1, name: "Premium Oyun Hesabi", desc: "Yuksek seviye oyun hesabi", price: "299 TL", oldPrice: "499 TL", icon: "fas fa-gamepad", badge: "sale", category: "sale" },
    { id: 2, name: "Ozel Yazilim Paketi", desc: "Gelistirme araclari ve lisanslar", price: "149 TL", oldPrice: "", icon: "fas fa-code", badge: "", category: "new" },
    { id: 3, name: "Tasarim Hizmeti", desc: "Logo ve grafik tasarim", price: "199 TL", oldPrice: "", icon: "fas fa-palette", badge: "new", category: "new" },
    { id: 4, name: "VPN Premium", desc: "Sinirsiz VPN erisimi", price: "79 TL", oldPrice: "129 TL", badge: "sale", icon: "fas fa-shield-halved", category: "sale" },
    { id: 5, name: "Dijital Pazarlama", desc: "Sosyal medya yonetimi", price: "399 TL", oldPrice: "", icon: "fas fa-bullhorn", badge: "popular", category: "popular" },
    { id: 6, name: "Oyun Ekipmani", desc: "Profesyonel oyun donanimi", price: "599 TL", oldPrice: "799 TL", icon: "fas fa-headphones", badge: "sale", category: "sale" },
    { id: 7, name: "Web Sitesi Paketi", desc: "Kurumsal web sitesi", price: "499 TL", oldPrice: "", icon: "fas fa-globe", badge: "new", category: "new" },
    { id: 8, name: "Egitim Paketi", desc: "Online kurs ve kaynaklar", price: "199 TL", oldPrice: "299 TL", icon: "fas fa-graduation-cap", badge: "popular", category: "popular" }
];

let cart = [];

const productsGrid = document.getElementById('productsGrid');
const cartBtn = document.getElementById('cartBtn');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartClose = document.getElementById('cartClose');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileNav = document.getElementById('mobileNav');
const backToTop = document.getElementById('backToTop');

function renderProducts(filter = 'all') {
    const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);
    productsGrid.innerHTML = filtered.map(p => `
        <div class="product-card" data-id="${p.id}">
            <div class="product-image">
                <i class="${p.icon}"></i>
                ${p.badge ? `<span class="product-badge ${p.badge}">${p.badge === 'new' ? 'YENI' : p.badge === 'sale' ? 'INDIRIM' : 'POPULER'}</span>` : ''}
            </div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <p>${p.desc}</p>
                <div class="product-bottom">
                    <div class="product-price">${p.price}${p.oldPrice ? `<span class="old-price">${p.oldPrice}</span>` : ''}</div>
                    <button class="add-cart-btn" onclick="addToCart(${p.id})"><i class="fas fa-plus"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    const existing = cart.find(c => c.id === id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    updateCart();
    showToast(`${product.name} sepete eklendi!`);
}

function removeFromCart(id) {
    cart = cart.filter(c => c.id !== id);
    updateCart();
}

function updateCart() {
    const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);
    const totalPrice = cart.reduce((sum, c) => sum + parseInt(c.price) * c.qty, 0);
    cartCount.textContent = totalItems;
    cartTotal.textContent = totalPrice + ' TL';

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="cart-empty">Sepetiniz bos</p>';
    } else {
        cartItems.innerHTML = cart.map(c => `
            <div class="cart-item">
                <div class="cart-item-img"><i class="${c.icon}"></i></div>
                <div class="cart-item-info">
                    <h4>${c.name} x${c.qty}</h4>
                    <span class="cart-item-price">${parseInt(c.price) * c.qty} TL</span>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${c.id})"><i class="fas fa-trash"></i></button>
            </div>
        `).join('');
    }
}

function showToast(msg) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

cartBtn.addEventListener('click', () => {
    cartSidebar.classList.add('active');
    cartOverlay.classList.add('active');
});

cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

function closeCart() {
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
}

mobileMenuBtn.addEventListener('click', () => {
    mobileNav.classList.toggle('active');
    const icon = mobileMenuBtn.querySelector('i');
    icon.className = mobileNav.classList.contains('active') ? 'fas fa-xmark' : 'fas fa-bars';
});

document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
        mobileNav.classList.remove('active');
        mobileMenuBtn.querySelector('i').className = 'fas fa-bars';
    });
});

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderProducts(btn.dataset.filter);
    });
});

window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }
});

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

document.getElementById('contactForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Mesajiniz gonderildi!');
    e.target.reset();
});

document.getElementById('newsletterForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Basariyla abone oldunuz!');
    e.target.reset();
});

renderProducts();
