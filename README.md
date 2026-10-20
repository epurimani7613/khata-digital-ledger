# KhataBook PRO • Digital Ledger Web Application

A modern, mobile-first Khata (Digital Business Ledger) web application built with **React**, **Tailwind CSS**, and **Lucide React** icons. Fully deployable to **GitHub Pages** with dual-mode storage (**Supabase PostgreSQL** cloud sync with automatic seamless fallback to browser **localStorage**).

---

## ✨ Features & Visual Layout

### 1. Top Bar (Header & Real-Time Search)
- **Real-Time Member Search**: Instantly filters members by name or phone number.
- **Quick Status Filter Tabs**:
  - `All`: View all members.
  - `You'll Get (Green)`: Only members who owe you money (receivable balance).
  - `You'll Give (Red)`: Only members you owe money to (payable balance).
- **Top Summary Banner**: Displays **Total You'll Get**, **Total You'll Give**, and **Net Balance** across all members.
- **Live Sync Badge**: Real-time indicator showing whether connected to **Supabase Cloud** or **Local Storage (Offline Mode)**.

### 2. Middle Section (Member Cards Carousel)
- Horizontal swipeable carousel and responsive card layout.
- Each card highlights:
  - Member Avatar (initials with dynamic gradient), Name, and Contact Info.
  - Current net balance with color-coded status badge (`You'll Get` in emerald green vs `You'll Give` in rose red).
  - Timestamp of the last transaction (e.g. `Today, 10:45 AM` or exact date).
- **Active State Highlighting**: Tapping a card selects that member and loads their full ledger below.
- **Add New Member**: Dedicated button and card opening an intuitive modal with name, phone, and optional opening balance.

### 3. Detailed Ledger View
- Customer/Supplier header with quick **WhatsApp reminder** and **direct call** shortcuts.
- Chronological transaction history tagged down to the exact minute.
- Badges: `+ GOT (Received)` vs `- GAVE (Given)`.
- Notes / Remarks and live running balance calculation after each transaction.
- Delete entry action with quick confirmation.

### 4. Bottom Section (Custom Virtual On-Screen Keypad)
- Mobile-optimized virtual numeric keypad (`0`–`9`, `00`, `Clear`, `Backspace`).
- Display area showing large rupee typography (`₹`) and quick note entry field.
- Quick amount chips (`+₹100`, `+₹500`, `+₹1,000`, `+₹2,000`) and note tags (`Cash`, `UPI`).
- Dual primary touch buttons:
  - 🟢 **`+ GOT (Received)`**
  - 🔴 **`- GAVE (Given)`**
- Tactile Web Audio click feedback and mobile vibration haptic support.
- Automatically saves new entries tagged with exact current timestamp down to the minute.

### 5. Dual Data Persistence (Supabase + LocalStorage)
- `@supabase/supabase-js` client library for PostgreSQL data sync.
- If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not provided, the app automatically falls back to browser `localStorage` with zero setup required.
- Dynamic Supabase credentials config directly inside the in-app **Settings Modal** (no rebuild needed!).
- **One-Tap Data Export**: Export complete ledger history as JSON or CSV backup.

---

## 🚀 Getting Started

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
```

App will run at `http://localhost:5173`.

### Production Build
```bash
npm run build
```

The compiled assets will be in the `dist/` directory, ready to be hosted on any static web host or GitHub Pages.

---

## 🗄️ Supabase PostgreSQL Setup (Optional)

To enable cloud synchronization across multiple devices:

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard and run the included [`supabase_schema.sql`](file:///Users/epurimanikanta/Documents/antigravity%20ide%20/supabase_schema.sql) script:
   - Creates `members` and `transactions` tables.
   - Configures foreign keys with cascading delete.
   - Sets up indexing on `member_id` and timestamps.
   - Configures public Row Level Security (RLS) policies.
3. Configure your credentials either:
   - In `.env` file:
     ```env
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```
   - Or open the **Settings** modal in the running web app and paste your URL and Anon Key!

---

## 🌐 Deploy to GitHub Pages

The project is pre-configured with:
- Relative base paths (`base: './'`) in [`vite.config.js`](file:///Users/epurimanikanta/Documents/antigravity%20ide%20/vite.config.js).
- Automated GitHub Actions workflow in [`.github/workflows/deploy.yml`](file:///Users/epurimanikanta/Documents/antigravity%20ide%20/.github/workflows/deploy.yml).

### Deployment Steps:
1. Push this repository to GitHub.
2. In your repository settings, go to **Settings > Pages > Build and deployment**.
3. Under **Source**, select **GitHub Actions**.
4. Every push to `main` will automatically build and publish your Khata app to `https://<username>.github.io/<repo>/`!
