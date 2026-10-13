'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Facebook,
  Menu,
  Minus,
  Phone,
  Plus,
  Search,
  ShoppingCart,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import type { Brand, Category, Product, Promotion } from '@/lib/types';


const fallbackCategories: Category[] = [
  { id: 'c1', name: 'Thực phẩm chức năng', slug: 'vitamins', emoji: '🍊', sort_order: 1 },
  { id: 'c2', name: 'Chăm sóc da', slug: 'beauty', emoji: '🧴', sort_order: 2 },
  { id: 'c3', name: 'Chăm sóc tóc', slug: 'hair-care', emoji: '🫧', sort_order: 3 },
  { id: 'c4', name: 'Chăm sóc cơ thể', slug: 'body-care', emoji: '🌸', sort_order: 4 },
];

const fallbackProducts: Product[] = [
  { id:'p1', category_id:'c1', name:'Kẹo Vitamin Úc', brand:"Nature's Way", short_description:'Sản phẩm mẫu để bạn xem giao diện cửa hàng.', description:'Sau khi kết nối Supabase, hãy thay sản phẩm mẫu bằng sản phẩm thật trong trang quản trị.', price:29.95, sale_price:24.95, image_url:null, is_preorder:false, preorder_note:null, sale_start:null, sale_end:null, is_featured:true, is_active:true, category:fallbackCategories[0] },
  { id:'p2', category_id:'c2', name:'Bộ dưỡng da Glow', brand:'Sukin', short_description:'Sản phẩm mẫu có nhãn đặt trước rõ ràng.', description:'Khách sẽ biết ngay sản phẩm này chỉ nhận đặt trước.', price:48, sale_price:null, image_url:null, is_preorder:true, preorder_note:'Chốt đơn Chủ Nhật', sale_start:null, sale_end:null, is_featured:true, is_active:true, category:fallbackCategories[1] },
  { id:'p3', category_id:'c3', name:'Mặt nạ phục hồi tóc', brand:'Garnier', short_description:'Giao diện phù hợp cho mỹ phẩm, tóc, sữa và TPCN.', description:'Bạn có thể thêm ảnh, mô tả, giá và ngày sale từ trang quản trị.', price:22.5, sale_price:null, image_url:null, is_preorder:false, preorder_note:null, sale_start:null, sale_end:null, is_featured:false, is_active:true, category:fallbackCategories[2] },
  { id:'p4', category_id:'c4', name:'Sữa dưỡng thể mùa hè', brand:'QV', short_description:'Sản phẩm mẫu có chương trình sale sắp tới.', description:'Ngày sale được hiển thị rõ ràng để khách dễ theo dõi.', price:19.95, sale_price:14.95, image_url:null, is_preorder:false, preorder_note:null, sale_start:'2026-11-01T00:00:00+10:30', sale_end:'2026-11-09T23:59:00+10:30', is_featured:true, is_active:true, category:fallbackCategories[3] }
];

type CartItem = { product: Product; quantity: number };

const fmt = (price: number) => new Intl.NumberFormat('vi-VN', {
  style:'currency',
  currency: process.env.NEXT_PUBLIC_STORE_CURRENCY || 'AUD',
  minimumFractionDigits: 2,
}).format(price);

function saleStatus(product: Product) {
  if (!product.sale_start || !product.sale_price) return null;
  const now = new Date();
  const start = new Date(product.sale_start);
  const end = product.sale_end ? new Date(product.sale_end) : null;
  if (now < start) return 'upcoming';
  if (!end || now <= end) return 'live';
  return 'ended';
}

function productPrice(product: Product) {
  return saleStatus(product) === 'live' && product.sale_price ? Number(product.sale_price) : Number(product.price);
}

export default function Storefront() {
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  
  const [brands, setBrands] = useState<Brand[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [usingDemo, setUsingDemo] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem('han-o-uc-cart') || '[]');
      if (Array.isArray(savedCart)) setCart(savedCart);
    } catch {}

    const supabase = createClient();
    if (!supabase) return;
    (async () => {
      const [
        { data: cats },
        { data: prods },
        { data: brandData },
        { data: promoData }
      ] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .order('sort_order'),

        supabase
          .from('products')
          .select('*, category:categories(*)')
          .eq('is_active', true)
          .order('created_at', { ascending:false }),

        supabase
          .from('brands')
          .select('*')
          .eq('is_active', true)
          .order('sort_order'),

        supabase
          .from('promotions')
          .select('*')
          .eq('is_active', true)
          .order('sort_order')
      ]);
      if (cats && prods) {
        setCategories(cats as Category[]);
        setProducts(prods as Product[]);
        setBrands((brandData || []) as Brand[]);
        setPromotions((promoData || []) as Promotion[]);
        setUsingDemo(false);
      }
    })();
  }, []);

  useEffect(() => {
    const count = promotions.length || 1;

    if (count <= 1) {
      setSlide(0);
      return;
    }

    const timer = window.setInterval(() => {
      setSlide(v => (v + 1) % count);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [promotions.length]);

  const filtered = useMemo(() => products.filter((p) => {
    const q = query.toLowerCase().trim();
    const matchesSearch = !q || [p.name,p.brand,p.short_description,p.description].filter(Boolean).some(x => String(x).toLowerCase().includes(q));
    const matchesCat = category === 'all' || p.category_id === category;
    const matchesBrand = brand === 'all' || p.brand === brand;
   
    return matchesSearch && matchesCat && matchesBrand;
  }), [products, query, category, brand]);

  const upcoming = products.filter(p => saleStatus(p) === 'upcoming').length;
  const preorder = products.filter(p => p.is_preorder).length;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + productPrice(item.product) * item.quantity, 0);
  const contactUrl = process.env.NEXT_PUBLIC_CONTACT_URL || process.env.NEXT_PUBLIC_FACEBOOK_URL || '#';
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL || contactUrl;
  const contactPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE || 'Đang cập nhật';

  const promoSlides =
    promotions.length > 0
      ? promotions
      : [
          {
            id: 'default-1',
            title: 'Săn sale Úc, mua dễ hơn mỗi ngày',
            subtitle:
              'Thực phẩm chức năng • Sữa • Skincare • Beauty',
            button_text: 'XEM SẢN PHẨM',
            image_url: '/han-o-uc-logo.png',
            link_url: '#products'
          }
        ];

  const addToCart = (product: Product) => {
    setCart(items => {
      const existing = items.find(i => i.product.id === product.id);
      if (existing) return items.map(i => i.product.id === product.id ? {...i, quantity:i.quantity + 1} : i);
      return [...items, {product, quantity:1}];
    });
    setCartOpen(true);
  };

  const changeQty = (id: string, delta: number) => setCart(items => items
    .map(i => i.product.id === id ? {...i, quantity:i.quantity + delta} : i)
    .filter(i => i.quantity > 0));

  const scrollProducts = () => document.getElementById('products')?.scrollIntoView({behavior:'smooth', block:'start'});

  return <>
    <header className="siteHeader">
      <div className="topSlogan">Hàng Úc chính hãng • Săn sale mỗi ngày • Gửi về Việt Nam 🇦🇺 → 🇻🇳</div>
      <div className="container mainNav">
        <a className="brandLogo" href="#top" aria-label="Hân ở Úc - Trang chủ">
          <img src="/han-o-uc-logo.png" alt="Logo Hân ở Úc"/>
          <span><strong>Hân ở Úc</strong><small>Hàng Úc xinh - giá dễ thương</small></span>
        </a>
        <div className="navSearch">
          <Search size={21}/>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm vitamin, skincare, sữa, nước hoa..." aria-label="Tìm sản phẩm"/>
          {query && <button onClick={()=>setQuery('')} aria-label="Xóa tìm kiếm"><X size={18}/></button>}
        </div>
        <div className="navButtons">
          <button className="navIconButton" onClick={()=>setCartOpen(true)} aria-label="Giỏ hàng">
            <ShoppingCart size={23}/><span>Giỏ hàng</span>{cartCount>0&&<b>{cartCount}</b>}
          </button>
          <button className="mobileMenuButton" onClick={()=>setMobileMenuOpen(v=>!v)} aria-label="Mở menu"><Menu size={25}/></button>
        </div>
      </div>
      <nav className={`categoryNav ${mobileMenuOpen?'open':''}`}>
        <div className="container categoryNavInner">
          <button className={category==='all'?'active':''} onClick={()=>{setCategory('all');setMobileMenuOpen(false);scrollProducts();}}>Tất cả sản phẩm</button>
          {categories.map(c=><button key={c.id} className={category===c.id?'active':''} onClick={()=>{setCategory(c.id);setMobileMenuOpen(false);scrollProducts();}}>{c.emoji||'🛍️'} {c.name}</button>)}
        </div>
      </nav>
    </header>

    <main id="top">
      <section className="promoWrap container" aria-label="Khuyến mãi nổi bật">
        <div className="promoCarousel">
          <button className="carouselArrow left" onClick={()=>setSlide(v=>(v+2)%3)} aria-label="Khuyến mãi trước"><ChevronLeft/></button>
          <div className="promoCopy">
            <h1>{promoSlides[slide].title}</h1>

            {promoSlides[slide].subtitle && (
              <p>{promoSlides[slide].subtitle}</p>
            )}
          <button
            onClick={() => {
              const url = promoSlides[slide].link_url;

              if (!url || url === '#products') {
                scrollProducts();
              } else {
                window.location.href = url;
              }
            }}
          >
            {promoSlides[slide].button_text || 'XEM NGAY'}
            <ChevronRight size={18}/>
          </button>

          </div>
          <div className="promoVisual"><img src="/han-o-uc-logo.png" alt="Hân ở Úc"/></div>
          <button className="carouselArrow right" onClick={()=>setSlide(v=>(v+1)%3)} aria-label="Khuyến mãi tiếp theo"><ChevronRight/></button>
          <div className="carouselDots">{promoSlides.map((_,i)=><button key={i} className={i===slide?'active':''} onClick={()=>setSlide(i)} aria-label={`Khuyến mãi ${i+1}`}/>)}</div>
        </div>
      </section>

      {brands.length > 0 && (
        <section className="container brandsSection">
          <div className="brandPanel">
            <div className="compactHeading">
              <div>
                <span>THƯƠNG HIỆU</span>
                <h2>Chọn theo thương hiệu</h2>
              </div>

              <button
                onClick={() => {
                  setBrand('all');
                  scrollProducts();
                }}
              >
                Xem tất cả
              </button>
            </div>

            <div className="brandLogoScroller">
              {brands.map(b => (
                <button
                  key={b.id}
                  className={`brandLogoButton ${
                    brand === b.name ? 'active' : ''
                  }`}
                  onClick={() => {
                    setBrand(b.name);
                    scrollProducts();
                  }}
                >
                  {b.logo_url ? (
                    <img src={b.logo_url} alt={b.name}/>
                  ) : (
                    <span>{b.name}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container productsSection" id="products">
        <div className="productsHeading">
          <div>
            <span className="eyebrow">MUA SẮM DỄ DÀNG</span>
            <h2>Sản phẩm nổi bật</h2>
            <p>{filtered.length} sản phẩm</p>
          </div>
        </div>

        <div className="mobileSearch">
          <Search size={20}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm sản phẩm..."/>
        </div>

        <div
          key={`${category}-${brand}`}
          className="productsGrid productsSlide"
        >
          {filtered.length===0 && <div className="emptyState"><Heart size={34}/><h3>Chưa có sản phẩm phù hợp</h3><p>Thử từ khóa khác hoặc chọn “Tất cả sản phẩm”.</p></div>}
          {filtered.map(p=>{
            const status=saleStatus(p);
            const liveSale=status==='live';
            const displayPrice=productPrice(p);
            return <article className="shopProductCard" key={p.id}>
              <div className="shopImage">
                {p.image_url ? <img src={p.image_url} alt={p.name}/> : <div className="shopPlaceholder">🛍️</div>}
                <div className="productBadges">
                  {p.is_preorder&&<span className="badge preorderBadge">PREORDER</span>}
                  {status==='upcoming'&&<span className="badge soonBadge">SALE SẮP TỚI</span>}
                  {liveSale&&<span className="badge liveBadge">ĐANG SALE</span>}
                </div>
              </div>
              <div className="shopProductBody">
                <div className="productBrand">{p.brand||p.category?.name||'Hân ở Úc'}</div>
                <h3 title={p.name}>{p.name}</h3>
                <div className="shopPriceLine"><strong>{fmt(displayPrice)}</strong>{liveSale&&p.sale_price&&<del>{fmt(Number(p.price))}</del>}</div>
                {liveSale&&p.sale_price&&<div className="savingText">Tiết kiệm {fmt(Number(p.price)-Number(p.sale_price))}</div>}
                {p.is_preorder&&p.preorder_note&&<div className="preorderNote">📦 {p.preorder_note}</div>}
                <div className="productActions">
                  <button className="viewButton" onClick={()=>setSelected(p)}>XEM</button>
                  <button className="cartButton" onClick={()=>addToCart(p)} aria-label="Thêm vào giỏ"><ShoppingCart size={20}/></button>
                </div>
              </div>
            </article>
          })}
        </div>

        {usingDemo&&<div className="demoNotice"><strong>Chế độ xem thử:</strong> Đây là sản phẩm mẫu. Khi Supabase đã kết nối đúng, sản phẩm thật của bạn sẽ tự động hiển thị.</div>}
      </section>
    </main>

    <footer className="siteFooter">
      <div className="container footerGrid">
        <div className="footerBrand"><img src="/han-o-uc-logo.png" alt="Hân ở Úc"/><div><strong>Hân ở Úc</strong><p>Hàng Úc chính hãng • Săn sale • Gửi về Việt Nam</p></div></div>
        <div>
          <h3>Liên hệ</h3>

          <p>
            <Phone size={16} /> {contactPhone}
          </p>

          <a
            href="https://www.facebook.com/profile.php?id=61595110472982"
            target="_blank"
            rel="noreferrer"
          >
            <Facebook size={17} />
            Facebook Hân ở Úc
          </a>
        </div>

      </div>
      <div className="footerBottom">© {new Date().getFullYear()} Website thuộc quyền sở hữu của Hân ở Úc.</div>
    </footer>

    {selected&&<div className="modalBackdrop" onMouseDown={e=>{if(e.currentTarget===e.target)setSelected(null)}}>
      <div className="productModal">
        <button className="modalClose" onClick={()=>setSelected(null)} aria-label="Đóng"><X/></button>
        <div className="modalProductImage">{selected.image_url?<img src={selected.image_url} alt={selected.name}/>:<div>🛍️</div>}</div>
        <div className="modalProductInfo">
          <span className="productBrand">{selected.brand||selected.category?.name||'Hân ở Úc'}</span>
          <h2>{selected.name}</h2>
          <div className="modalPrice">{fmt(productPrice(selected))}{saleStatus(selected)==='live'&&selected.sale_price&&<del>{fmt(Number(selected.price))}</del>}</div>
          {selected.is_preorder&&<div className="modalNotice">📦 <strong>Chỉ nhận đặt trước.</strong> {selected.preorder_note||'Vui lòng liên hệ để biết thời gian chốt đơn.'}</div>}
          {saleStatus(selected)==='upcoming'&&<div className="modalNotice">🏷️ <strong>Sale sắp tới.</strong> Giá sale dự kiến {fmt(Number(selected.sale_price))}.</div>}
          <h3>Thông tin sản phẩm</h3>

            <div className="productDescription">
              {selected.description ||
                selected.short_description ||
                'Thông tin chi tiết đang được cập nhật.'}
            </div>
          <div className="modalActions">
            <button className="primaryAction" onClick={()=>addToCart(selected)}>
              <ShoppingCart size={20}/>
              THÊM VÀO GIỎ
            </button>
          </div>
        </div>
      </div>
    </div>}

    {cartOpen&&<div className="drawerBackdrop" onMouseDown={e=>{if(e.currentTarget===e.target)setCartOpen(false)}}>
      <aside className="cartDrawer">
        <div className="drawerHeader"><div><span>GIỎ HÀNG</span><h2>{cartCount} sản phẩm</h2></div><button onClick={()=>setCartOpen(false)}><X/></button></div>
        <div className="cartItems">
          {cart.length===0&&<div className="emptyCart">🛒<h3>Giỏ hàng đang trống</h3><p>Thêm sản phẩm bạn thích để xem lại tại đây.</p><button onClick={()=>{setCartOpen(false);scrollProducts()}}>Xem sản phẩm</button></div>}
          {cart.map(item=><div className="cartItem" key={item.product.id}>
            <div className="cartThumb">{item.product.image_url?<img src={item.product.image_url} alt=""/>:'🛍️'}</div>
            <div className="cartItemInfo"><strong>{item.product.name}</strong><span>{fmt(productPrice(item.product))}</span><div className="qty"><button onClick={()=>changeQty(item.product.id,-1)}><Minus size={15}/></button><b>{item.quantity}</b><button onClick={()=>changeQty(item.product.id,1)}><Plus size={15}/></button></div></div>
            <button className="removeCart" onClick={()=>setCart(items=>items.filter(i=>i.product.id!==item.product.id))}><X size={17}/></button>
          </div>)}
        </div>
        {cart.length>0&&<div className="cartFooter"><div className="cartTotal"><span>Tạm tính</span><strong>{fmt(cartTotal)}</strong></div><p>Giỏ hàng dùng để lưu sản phẩm. Hân sẽ xác nhận giá, phí vận chuyển và đơn hàng khi bạn liên hệ.</p><a className="checkoutContact" href={contactUrl} target={contactUrl==='#'?undefined:'_blank'} rel="noreferrer">LIÊN HỆ ĐẶT HÀNG <ChevronRight size={19}/></a><button className="clearCart" onClick={()=>setCart([])}>Xóa giỏ hàng</button></div>}
      </aside>
    </div>}
  </>;
}
