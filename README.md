# Han o Uc

A bright, mobile-first product catalogue for Vercel. Customers can browse categories, search products, view sale/preorder labels and contact you. The `/admin` page lets you add/delete categories and add/edit/delete products, pricing, images, descriptions, preorder notes and sale dates.

## Stack
- Next.js App Router
- Supabase database + admin authentication + product-image storage
- Vercel hosting
- Responsive layout for phones, tablets and desktop

## 1. Create Supabase
1. Create a free Supabase project.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. Go to **Authentication > Users** and create your admin user manually.
4. In **Authentication settings**, keep public/self sign-up disabled so random visitors cannot become admins.
5. From **Project Settings > API**, copy the Project URL and anon/public key.

## 2. Configure locally
Copy `.env.example` to `.env.local` and enter:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_STORE_CURRENCY=AUD
NEXT_PUBLIC_CONTACT_URL=https://m.me/YOUR_PAGE
```

`NEXT_PUBLIC_CONTACT_URL` can be Messenger, Facebook, Instagram, WhatsApp, a preorder form, etc.

Then:

```bash
npm install
npm run dev
```

Open:
- Shop: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

## 3. Deploy on Vercel
1. Put this project in a GitHub repository.
2. In Vercel: **Add New > Project** and import the repository.
3. Add the same environment variables from `.env.local`.
4. Deploy.
5. Add your custom domain in **Vercel > Project > Settings > Domains**.

## What the admin can manage
- Categories + category emoji
- Product name and brand
- Normal price and sale price
- Short + full description
- Product image upload
- Preorder-only switch + preorder note
- Upcoming sale start/end time
- Featured switch
- Hide/show product
- Edit and permanently delete products

## Easy future upgrades
- Shopping cart + checkout
- AUD/VND price toggle
- Vietnamese + English language switch
- Order form saved to Supabase
- Customer accounts
- Inventory/stock quantity
- Sale countdown timer
- Facebook/Instagram product links
- CSV product import
