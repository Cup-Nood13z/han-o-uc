'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Sparkles, ShoppingBag, ShieldCheck, Tag, X } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import type { Category, Product } from '@/lib/types';

const fallbackCategories: Category[] = [
  { id: 'c1', name: 'Vitamins', slug: 'vitamins', emoji: '🍊', sort_order: 1 },
  { id: 'c2', name: 'Beauty', slug: 'beauty', emoji: '🧴', sort_order: 2 },
  { id: 'c3', name: 'Hair Care', slug: 'hair-care', emoji: '🫧', sort_order: 3 },
  { id: 'c4', name: 'Body Care', slug: 'body-care', emoji: '🌸', sort_order: 4 },
];

const fallbackProducts: Product[] = [
  { id:'p1', category_id:'c1', name:'Australian Vitamin Gummies', brand:'Demo product', short_description:'A bright example product card for your future catalogue.', description:'Replace this demo item from the admin page after you connect Supabase.', price:29.95, sale_price:24.95, image_url:null, is_preorder:false, preorder_note:null, sale_start:null, sale_end:null, is_featured:true, is_active:true, category:fallbackCategories[0] },
  { id:'p2', category_id:'c2', name:'Glow Skin Care Set', brand:'Demo product', short_description:'Preorder example with a clear customer-friendly label.', description:'Customers can see that this item is preorder only before contacting you.', price:48, sale_price:null, image_url:null, is_preorder:true, preorder_note:'Preorder closes Sunday', sale_start:null, sale_end:null, is_featured:true, is_active:true, category:fallbackCategories[1] },
  { id:'p3', category_id:'c3', name:'Repair Hair Mask', brand:'Demo product', short_description:'Use this layout for hair care, body care, supplements and more.', description:'Add photos, full descriptions, pricing and sale dates from your admin page.', price:22.5, sale_price:null, image_url:null, is_preorder:false, preorder_note:null, sale_start:null, sale_end:null, is_featured:false, is_active:true, category:fallbackCategories[2] },
  { id:'p4', category_id:'c4', name:'Summer Body Lotion', brand:'Demo product', short_description:'An upcoming-sale product so customers know to come back.', description:'Upcoming sale dates are shown clearly without making the page feel complicated.', price:19.95, sale_price:14.95, image_url:null, is_preorder:false, preorder_note:null, sale_start:'2026-11-01T00:00:00+10:30', sale_end:'2026-11-09T23:59:00+10:30', is_featured:true, is_active:true, category:fallbackCategories[3] }
];

const fmt = (price: number) => new Intl.NumberFormat('en-AU', { style:'currency', currency: process.env.NEXT_PUBLIC_STORE_CURRENCY || 'AUD' }).format(price);

function saleStatus(product: Product) {
  if (!product.sale_start || !product.sale_price) return null;
  const now = new Date();
  const start = new Date(product.sale_start);
  const end = product.sale_end ? new Date(product.sale_end) : null;
  if (now < start) return 'upcoming';
  if (!end || now <= end) return 'live';
  return 'ended';
}

export default function Storefront() {
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<Product | null>(null);
  const [usingDemo, setUsingDemo] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    (async () => {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('products').select('*, category:categories(*)').eq('is_active', true).order('created_at', { ascending:false })
      ]);
      if (cats && prods) {
        setCategories(cats as Category[]);
        setProducts(prods as Product[]);
        setUsingDemo(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => products.filter((p) => {
    const q = query.toLowerCase().trim();
    const matchesSearch = !q || [p.name,p.brand,p.short_description,p.description].filter(Boolean).some(x => String(x).toLowerCase().includes(q));
    const matchesCat = category === 'all' || p.category_id === category;
    return matchesSearch && matchesCat;
  }), [products, query, category]);

  const upcoming = products.filter(p => saleStatus(p) === 'upcoming').length;
  const preorder = products.filter(p => p.is_preorder).length;
  const contact = process.env.NEXT_PUBLIC_CONTACT_URL || '#';

  return <>
    <header className="header">
      <div className="container nav">
        <a className="logo" href="#top"><span className="logoMark">H</span><span>Han o Uc</span></a>
        <div className="navActions">
          <a className="pillButton hideMobile" href="#products"><ShoppingBag size={17}/> Shop</a>
          <a className="primaryButton" href={contact} target={contact === '#' ? undefined : '_blank'} rel="noreferrer">Contact</a>
        </div>
      </div>
    </header>

    <main id="top">
      <section className="hero">
        <div className="container heroGrid">
          <div className="heroMain">
            <span className="kicker"><Sparkles size={16}/> Little finds from Australia 🇦🇺</span>
            <h1>Cute finds.<br/><span>Good prices.</span><br/>Easy ordering.</h1>
            <p>Browse products, check upcoming sales and see which items are preorder only. Designed to be simple enough for Mum, quick enough for TikTok, and pretty on every phone.</p>
            <div className="heroButtons">
              <a href="#products" className="primaryButton"><ShoppingBag size={17}/> Browse products</a>
              <button className="pillButton" onClick={() => { setQuery(''); setCategory('all'); document.getElementById('products')?.scrollIntoView(); }}>See everything</button>
            </div>
          </div>
          <div className="heroSide">
            <div className="miniCard sale"><div className="miniIcon">🏷️</div><div><strong>{upcoming || 'New'} upcoming sales</strong><p>Customers can see sale dates before they start.</p></div></div>
            <div className="miniCard preorder"><div className="miniIcon">📦</div><div><strong>{preorder || 'Easy'} preorder items</strong><p>Preorder-only products are clearly marked.</p></div></div>
          </div>
        </div>
      </section>

      <section className="container toolbar" id="products">
        <div className="searchBox"><Search className="searchIcon" size={22}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search vitamins, skincare, hair care..." aria-label="Search products"/></div>
        <div className="chips">
          <button className={`chip ${category === 'all' ? 'active':''}`} onClick={()=>setCategory('all')}>✨ All</button>
          {categories.map(c => <button key={c.id} className={`chip ${category === c.id ? 'active':''}`} onClick={()=>setCategory(c.id)}>{c.emoji || '🛍️'} {c.name}</button>)}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="sectionHead"><div><h2>Find your favourites 💕</h2><p>{filtered.length} item{filtered.length === 1 ? '' : 's'} showing</p></div><Tag size={27}/></div>
          <div className="products">
            {filtered.length === 0 && <div className="empty">No products match that search yet. Try another word or category.</div>}
            {filtered.map(p => {
              const status = saleStatus(p);
              const liveSale = status === 'live';
              const displayPrice = liveSale && p.sale_price ? p.sale_price : p.price;
              return <article className="productCard" key={p.id}>
                <div className="productImageWrap">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="productImage"/> : <div className="imagePlaceholder">🛍️</div>}
                  <div className="badges">
                    {p.is_preorder && <span className="badge pre">PREORDER</span>}
                    {status === 'upcoming' && <span className="badge sale">SALE SOON</span>}
                    {liveSale && <span className="badge sale">ON SALE</span>}
                  </div>
                </div>
                <div className="productBody">
                  <div className="brand">{p.brand || p.category?.name || 'Han o Uc'}</div>
                  <div className="productName">{p.name}</div>
                  <p className="productDesc">{p.short_description || p.description || 'Tap for product details.'}</p>
                  <div className="priceRow"><span className="price">{fmt(displayPrice)}</span>{liveSale && p.sale_price && <span className="oldPrice">{fmt(p.price)}</span>}</div>
                  <div className="cardFooter"><button className="pillButton" onClick={()=>setSelected(p)}>Details</button><a className="primaryButton" href={contact} target={contact === '#' ? undefined : '_blank'} rel="noreferrer">Ask</a></div>
                </div>
              </article>
            })}
          </div>
          {usingDemo && <div className="setupBox"><strong>Preview mode:</strong> These are demo products. Once Supabase is connected, your real categories and products will automatically replace them.</div>}
        </div>
      </section>
    </main>

    <footer className="footer"><div className="container footerInner"><div><strong>Han o Uc</strong><br/>Australian finds, made easy.</div><div><ShieldCheck size={17} style={{verticalAlign:'middle'}}/> Clear pricing • Mobile friendly • Simple ordering</div></div></footer>

    {selected && <div className="modalBackdrop" onMouseDown={(e)=>{ if(e.currentTarget === e.target) setSelected(null); }}>
      <div className="modal">
        <div className="modalTop"><div><div className="brand">{selected.brand || selected.category?.name || 'Han o Uc'}</div><h2 style={{margin:'4px 0 0',fontSize:'1.75rem',letterSpacing:'-.04em'}}>{selected.name}</h2></div><button className="closeBtn" onClick={()=>setSelected(null)} aria-label="Close"><X size={20}/></button></div>
        {selected.image_url && <img className="detailsImage" src={selected.image_url} alt={selected.name}/>} 
        <div className="priceRow" style={{marginTop:'14px'}}><span className="price">{fmt(saleStatus(selected)==='live' && selected.sale_price ? selected.sale_price : selected.price)}</span>{saleStatus(selected)==='live' && selected.sale_price && <span className="oldPrice">{fmt(selected.price)}</span>}</div>
        {selected.is_preorder && <div className="notice"><strong>📦 Preorder only.</strong> {selected.preorder_note || 'Contact Han o Uc to confirm the next preorder batch.'}</div>}
        {saleStatus(selected)==='upcoming' && selected.sale_start && <div className="notice"><strong>🏷️ Upcoming sale.</strong> Starts {new Date(selected.sale_start).toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'})}{selected.sale_price ? ` — sale price ${fmt(selected.sale_price)}.`:''}</div>}
        <p style={{lineHeight:1.7,color:'var(--muted)'}}>{selected.description || selected.short_description || 'Contact Han o Uc for more details.'}</p>
        <a className="primaryButton" style={{width:'100%',marginTop:'8px'}} href={contact} target={contact === '#' ? undefined : '_blank'} rel="noreferrer">Ask about this product</a>
      </div>
    </div>}
  </>;
}
