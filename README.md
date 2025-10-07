# Doypack Tepelné Svařování - Next.js App

Next.js aplikace pro správu zakázek a pokusů tepelného svařování doypack obalů.

## 🚀 Začínáme

### Požadavky

- Node.js 20+
- PostgreSQL databáze (Supabase)

### Instalace

1. Nainstalujte závislosti:
```bash
npm install
```

2. Nastavte proměnné prostředí v `.env.local`:
```
DATABASE_URL=your_postgresql_connection_string
```

3. Spusťte vývojový server:
```bash
npm run dev
```

4. Otevřete [http://localhost:3000](http://localhost:3000) ve vašem prohlížeči.

## 📋 Funkce

### Sběr dat
- ✅ Vytváření nových zakázek
- ✅ Správa parametrů materiálu (typ, pokrytí tiskem, velikost, sáčkovačka)
- ✅ Zaznamenávání pokusů svařování se všemi fázemi:
  - 🔗 Svár zip (teplota, tlak, doba)
  - ⬇️ Svár dno (teplota, tlak, doba)
  - 🔷 Příčné sváry - Věže E, D, C, B, A (každá s teplotou, tlakem, dobou)
- ✅ Rychlé kopírování parametrů z Věže E do ostatních věží
- ✅ Historie pokusů s možností mazání
- ✅ Poznámky k zakázkám i pokusům

## 🏗️ Technologie

- **Framework**: Next.js 15 s App Router
- **UI knihovna**: HeroUI (NextUI)
- **Styling**: Tailwind CSS 4
- **Databáze**: PostgreSQL (Supabase)
- **Databázový klient**: pg
- **TypeScript**: Pro type safety

## 📁 Struktura projektu

```
src/
├── app/
│   ├── api/
│   │   ├── orders/          # API endpointy pro zakázky
│   │   └── attempts/        # API endpointy pro pokusy
│   ├── orders/
│   │   └── [id]/            # Detail zakázky a pokusy
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Hlavní stránka se seznamem zakázek
├── components/
│   ├── NewOrderModal.tsx    # Formulář nové zakázky
│   └── AttemptForm.tsx      # Formulář pokusu svařování
├── lib/
│   └── db.ts                # Databázové připojení
└── types/
    └── index.ts             # TypeScript typy a konstanty
```

## 🗄️ Databázové schéma

### Tabulka `orders`
- `id` - Unikátní ID zakázky
- `order_code` - Kód zakázky (unikátní)
- `material_type` - Typ materiálu
- `print_coverage` - Pokrytí tiskem (%)
- `package_size` - Velikost doypacku (1-6)
- `sackovacka` - Použitá sáčkovačka (S1-S4)
- `note` - Poznámka k zakázce
- `created_at` - Datum vytvoření

### Tabulka `attempts`
- `id` - Unikátní ID pokusu
- `order_id` - ID zakázky (foreign key)
- `outcome` - Výsledek ('Úspěch' / 'Neúspěch')
- `zipper_temperature_c`, `zipper_pressure_bar`, `zipper_dwell_time_s` - Parametry svár zip
- `bottom_temperature_c`, `bottom_pressure_bar`, `bottom_dwell_time_s` - Parametry svár dno
- `side_e_*`, `side_d_*`, `side_c_*`, `side_b_*`, `side_a_*` - Parametry věží
- `note` - Poznámka k pokusu
- `created_at` - Datum vytvoření

## 🎨 Design

Aplikace používá moderní, čistý design s:
- Responzivním layoutem pro desktop i mobil
- Gradient pozadím
- HeroUI komponenty s jednotným stylem
- Tmavým režimem
- Intuitivním UX s vizuálními ikonami

## 🔄 Migrace ze Streamlit

Tato Next.js aplikace nahrazuje Streamlit verzi se stejnou funkcionalitou:
- ✅ Stejná databáze (sdílená s původní aplikací)
- ✅ Všechny funkce "Sběr dat" stránky
- ✅ Český jazyk
- ✅ Vylepšené UX a rychlost

## 📝 Příští kroky

- [ ] Implementace "Výpočet parametrů" stránky s ML modelem
- [ ] Implementace "Přehled dat" stránky
- [ ] Autentizace uživatelů
- [ ] Export dat do CSV
- [ ] Pokročilá analytika a grafy

## 🤝 Development

### Formátování kódu
```bash
npm run format
```

### Linting
```bash
npm run lint
```

### Build pro produkci
```bash
npm run build
npm start
```
