'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, LogOut, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import type { Category, Product } from '@/lib/types';

const emptyProduct = {
  id:'', category_id:'', name:'', brand:'', short_description:'', description:'', price:'', sale_price:'', image_url:'', is_preorder:false, preorder_note:'', sale_start:'', sale_end:'', is_featured:false, is_active:true
};
type FormProduct = typeof emptyProduct;

export default function AdminPanel() {
  const supabase = createClient();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [categories,setCategories]=useState<Category[]>([]);
  const [products,setProducts]=useState<Product[]>([]);
  const [categoryName,setCategoryName]=useState('');
  const [categoryEmoji,setCategoryEmoji]=useState('🛍️');
  const [form,setForm]=useState<FormProduct>(emptyProduct);
  const [imageFile,setImageFile]=useState<File|null>(null);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [saving,setSaving]=useState(false);

  const refresh = async () => {
    if (!supabase) return;
    const [{data:cats},{data:prods}] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('*, category:categories(*)').order('created_at',{ascending:false})
    ]);
    setCategories((cats||[]) as Category[]);
    setProducts((prods||[]) as Product[]);
  };

  useEffect(()=>{
    if (!supabase) { setSessionChecked(true); return; }
    supabase.auth.getSession().then(({data})=>{ setLoggedIn(!!data.session); setSessionChecked(true); if(data.session) refresh(); });
    const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>{ setLoggedIn(!!session); if(session) refresh(); });
    return ()=>listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const login = async (e:FormEvent) => {
    e.preventDefault(); setError(''); setMessage('');
    if(!supabase) return setError('Supabase chưa được cấu hình. Hãy kiểm tra biến môi trường trên Vercel.');
    const {error:err}=await supabase.auth.signInWithPassword({email,password});
    if(err) setError('Email hoặc mật khẩu không đúng.'); else {setLoggedIn(true); setMessage('Đăng nhập thành công!'); await refresh();}
  };

  const logout = async()=>{ await supabase?.auth.signOut(); setLoggedIn(false); };
  const slugify=(s:string)=>s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  const addCategory=async(e:FormEvent)=>{
    e.preventDefault(); setError(''); setMessage('');
    if(!supabase || !categoryName.trim()) return setError('Vui lòng nhập tên danh mục.');
    const {error:err}=await supabase.from('categories').insert({name:categoryName.trim(),slug:slugify(categoryName),emoji:categoryEmoji || '🛍️',sort_order:categories.length+1});
    if(err) setError(err.message); else {setCategoryName('');setMessage('Đã thêm danh mục.'); await refresh();}
  };

  const removeCategory=async(id:string)=>{
    if(!supabase || !confirm('Xóa danh mục này? Sản phẩm vẫn được giữ lại nhưng sẽ không còn danh mục.'))return;
    const {error:err}=await supabase.from('categories').delete().eq('id',id);
    if(err)setError(err.message); else refresh();
  };

  const uploadImage=async()=>{
    if(!imageFile || !supabase) return form.image_url || null;
    const ext=imageFile.name.split('.').pop() || 'jpg';
    const path=`products/${crypto.randomUUID()}.${ext}`;
    const {error:upErr}=await supabase.storage.from('product-images').upload(path,imageFile,{upsert:false});
    if(upErr) throw upErr;
    const {data}=supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const saveProduct=async(e:FormEvent)=>{
    e.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      if(!supabase) throw new Error('Supabase chưa được cấu hình.');
      if(!form.name.trim() || !form.price) throw new Error('Vui lòng nhập tên sản phẩm và giá.');
      const imageUrl=await uploadImage();
      const payload={
        category_id:form.category_id || null,
        name:form.name.trim(),
        brand:form.brand.trim() || null,
        short_description:form.short_description.trim() || null,
        description:form.description.trim() || null,
        price:Number(form.price),
        sale_price:form.sale_price ? Number(form.sale_price) : null,
        image_url:imageUrl || null,
        is_preorder:form.is_preorder,
        preorder_note:form.preorder_note.trim() || null,
        sale_start:form.sale_start ? new Date(form.sale_start).toISOString() : null,
        sale_end:form.sale_end ? new Date(form.sale_end).toISOString() : null,
        is_featured:form.is_featured,
        is_active:form.is_active
      };
      const q=form.id ? supabase.from('products').update(payload).eq('id',form.id) : supabase.from('products').insert(payload);
      const {error:err}=await q;
      if(err) throw err;
      setMessage(form.id?'Đã cập nhật sản phẩm.':'Đã thêm sản phẩm.');
      setForm(emptyProduct); setImageFile(null); await refresh();
    } catch(err:any){ setError(err.message || 'Không thể lưu sản phẩm.'); }
    finally {setSaving(false);}
  };

  const editProduct=(p:Product)=>setForm({
    id:p.id,category_id:p.category_id||'',name:p.name,brand:p.brand||'',short_description:p.short_description||'',description:p.description||'',price:String(p.price),sale_price:p.sale_price==null?'':String(p.sale_price),image_url:p.image_url||'',is_preorder:p.is_preorder,preorder_note:p.preorder_note||'',sale_start:p.sale_start?new Date(p.sale_start).toISOString().slice(0,16):'',sale_end:p.sale_end?new Date(p.sale_end).toISOString().slice(0,16):'',is_featured:p.is_featured,is_active:p.is_active
  });

  const removeProduct=async(id:string)=>{
    if(!supabase || !confirm('Bạn có chắc muốn xóa vĩnh viễn sản phẩm này?'))return;
    const {error:err}=await supabase.from('products').delete().eq('id',id);
    if(err)setError(err.message); else refresh();
  };

  if(!sessionChecked) return <div className="loginWrap"><div className="loginCard">Đang tải…</div></div>;
  if(!supabase) return <div className="loginWrap"><div className="loginCard"><div className="logo"><span className="logoMark">H</span>Hân ở Úc</div><h1>Chưa kết nối Supabase</h1><p className="smallText">Hãy kiểm tra hai biến NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY trên Vercel.</p><a href="/" className="pillButton"><ArrowLeft size={16}/> Về cửa hàng</a></div></div>;
  if(!loggedIn) return <div className="loginWrap"><form className="loginCard" onSubmit={login}><div className="logo"><span className="logoMark">H</span>Hân ở Úc</div><h1>Đăng nhập quản trị</h1><p className="smallText">Chỉ tài khoản quản trị đã tạo trong Supabase mới đăng nhập được.</p>{error&&<div className="error">{error}</div>}<div className="form" style={{marginTop:16}}><div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div><div className="field"><label>Mật khẩu</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></div><button className="primaryButton" type="submit">Đăng nhập</button><a className="pillButton" href="/"><ArrowLeft size={16}/> Về cửa hàng</a></div></form></div>;

  return <div className="adminShell">
    <header className="header"><div className="container nav"><a className="logo" href="/"><span className="logoMark">H</span>Hân ở Úc - Quản trị</a><div className="navActions"><a href="/" className="pillButton"><ArrowLeft size={16}/> Cửa hàng</a><button className="dangerButton" onClick={logout}><LogOut size={16}/><span className="hideMobile">Đăng xuất</span></button></div></div></header>
    <div className="container adminHero"><h1>Quản lý cửa hàng ✨</h1><p className="smallText">Thêm sản phẩm, giá, danh mục, preorder và thời gian sale. Thay đổi sẽ xuất hiện trên website.</p>{message&&<div className="success">{message}</div>}{error&&<div className="error">{error}</div>}</div>
    <div className="container adminGrid">
      <aside className="panel"><h2>Danh mục</h2><form className="form" onSubmit={addCategory}><div className="row2"><div className="field"><label>Biểu tượng</label><input value={categoryEmoji} onChange={e=>setCategoryEmoji(e.target.value)} maxLength={4}/></div><div className="field"><label>Tên danh mục</label><input value={categoryName} onChange={e=>setCategoryName(e.target.value)} placeholder="Chăm sóc da"/></div></div><button className="primaryButton"><Plus size={16}/> Thêm danh mục</button></form><div className="adminItems" style={{marginTop:15}}>{categories.map(c=><div className="adminItem" key={c.id} style={{gridTemplateColumns:'44px 1fr auto'}}><div style={{fontSize:'1.5rem'}}>{c.emoji||'🛍️'}</div><strong>{c.name}</strong><button className="dangerButton" onClick={()=>removeCategory(c.id)} aria-label="Xóa danh mục"><Trash2 size={16}/></button></div>)}</div></aside>
      <div style={{display:'grid',gap:18}}>
        <section className="panel"><h2>{form.id?'Sửa sản phẩm':'Thêm sản phẩm'}</h2><form className="form" onSubmit={saveProduct}>
          <div className="field"><label>Tên sản phẩm *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Blackmores Vitamin C" required/></div>
          <div className="row2"><div className="field"><label>Thương hiệu</label><input value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} placeholder="Blackmores"/></div><div className="field"><label>Danh mục</label><select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Không có danh mục</option>{categories.map(c=><option value={c.id} key={c.id}>{c.emoji} {c.name}</option>)}</select></div></div>
          <div className="row2"><div className="field"><label>Giá thường (AUD) *</label><input type="number" step="0.01" min="0" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></div><div className="field"><label>Giá sale</label><input type="number" step="0.01" min="0" value={form.sale_price} onChange={e=>setForm({...form,sale_price:e.target.value})}/></div></div>
          <div className="field"><label>Mô tả ngắn</label><input value={form.short_description} onChange={e=>setForm({...form,short_description:e.target.value})} placeholder="Một dòng ngắn hiển thị trên thẻ sản phẩm"/></div>
          <div className="field"><label>Mô tả chi tiết</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Dung tích, hương vị, số lượng, thông tin sản phẩm..."/></div>
          <div className="field"><label>Ảnh sản phẩm</label><input type="file" accept="image/*" onChange={e=>setImageFile(e.target.files?.[0]||null)}/>{form.image_url&&<span className="smallText">Ảnh hiện tại sẽ được giữ nếu bạn không tải ảnh mới.</span>}</div>
          <div className="checkRow"><label className="checkPill"><input type="checkbox" checked={form.is_preorder} onChange={e=>setForm({...form,is_preorder:e.target.checked})}/> Chỉ preorder</label><label className="checkPill"><input type="checkbox" checked={form.is_featured} onChange={e=>setForm({...form,is_featured:e.target.checked})}/> Nổi bật</label><label className="checkPill"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/> Hiển thị</label></div>
          {form.is_preorder&&<div className="field"><label>Ghi chú preorder</label><input value={form.preorder_note} onChange={e=>setForm({...form,preorder_note:e.target.value})} placeholder="Chốt preorder Chủ Nhật 8 giờ tối"/></div>}
          <div className="row2"><div className="field"><label>Bắt đầu sale</label><input type="datetime-local" value={form.sale_start} onChange={e=>setForm({...form,sale_start:e.target.value})}/></div><div className="field"><label>Kết thúc sale</label><input type="datetime-local" value={form.sale_end} onChange={e=>setForm({...form,sale_end:e.target.value})}/></div></div>
          <div className="checkRow"><button className="primaryButton" disabled={saving}>{saving?<><Upload size={16}/> Đang lưu…</>:<><Plus size={16}/> {form.id?'Lưu thay đổi':'Thêm sản phẩm'}</>}</button>{form.id&&<button type="button" className="pillButton" onClick={()=>{setForm(emptyProduct);setImageFile(null)}}>Hủy sửa</button>}</div>
        </form></section>
        <section className="panel"><h2>Sản phẩm ({products.length})</h2><div className="adminItems">{products.length===0&&<div className="smallText">Chưa có sản phẩm. Hãy thêm sản phẩm đầu tiên ở trên.</div>}{products.map(p=><div className="adminItem" key={p.id}>{p.image_url?<img src={p.image_url} className="thumb" alt=""/>:<div className="thumb" style={{display:'grid',placeItems:'center',fontSize:'1.5rem'}}>🛍️</div>}<div><strong>{p.name}</strong><small>{p.category?.name||'Chưa phân loại'} • ${Number(p.price).toFixed(2)}{p.is_preorder?' • Preorder':''}{!p.is_active?' • Đang ẩn':''}</small></div><div className="actionRow"><button className="pillButton" onClick={()=>{editProduct(p);window.scrollTo({top:0,behavior:'smooth'})}}><Pencil size={15}/> Sửa</button><button className="dangerButton" onClick={()=>removeProduct(p.id)}><Trash2 size={15}/> Xóa</button></div></div>)}</div></section>
      </div>
    </div>
  </div>;
}
