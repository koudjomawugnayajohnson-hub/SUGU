-- 1. CRÉATION DES TYPES (ENUMS) POUR NORMALISER LES DONNÉES
CREATE TYPE tenant_status AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED');
CREATE TYPE business_type AS ENUM ('RESTAURANT', 'RETAIL');
CREATE TYPE user_role AS ENUM ('OWNER', 'MANAGER', 'CASHIER');
CREATE TYPE auth_type AS ENUM ('GOOGLE', 'EMAIL', 'PIN');

-- 2. TABLE DES ENTREPRISES (TENANTS)
-- C'est le sommet de la pyramide. Tout part d'ici.
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    business_type business_type NOT NULL,
    status tenant_status DEFAULT 'TRIAL',
    trial_ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLE DES ÉTABLISSEMENTS (LOCATIONS)
-- Pour gérer les commerçants qui ont plusieurs boutiques.
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLE DES UTILISATEURS (USERS)
-- Intègre notre nouvelle logique d'authentification hybride (Google vs PIN)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL, -- Null = accès à toutes les boutiques
    role user_role NOT NULL,
    email VARCHAR(255) UNIQUE, -- Uniquement pour le OWNER (Google Auth)
    auth_provider auth_type NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    pin_code_hash VARCHAR(255), -- Haché, jamais en clair ! Pour les CASHIER
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 🔒 ACTIVATION DU ROW LEVEL SECURITY (RLS)
-- Le mur d'étanchéité de ton SaaS
-- ==========================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Les politiques RLS : Un utilisateur ne peut voir/modifier que les données où le tenant_id correspond à son propre tenant_id contenu dans son token de session (JWT).

-- RLS pour Locations
CREATE POLICY "Isolation totale des Boutiques" ON locations
    FOR ALL
    USING (tenant_id = (auth.jwt()->>'tenant_id')::UUID);

-- RLS pour Users
CREATE POLICY "Isolation totale des Utilisateurs" ON users
    FOR ALL
    USING (tenant_id = (auth.jwt()->>'tenant_id')::UUID);

-- ==========================================
-- 🛒 SYSTÈME DE CAISSE (PRODUITS & VENTES)
-- ==========================================

-- 5. TABLE DES CATÉGORIES
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(50), -- Code couleur pour la grille de la caisse (ex: '#EF4444')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLE DES PRODUITS
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    barcode VARCHAR(255),
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLE DES COMMANDES (TICKETS DE CAISSE)
CREATE TYPE order_status AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');
CREATE TYPE payment_method AS ENUM ('CASH', 'CARD', 'MOBILE_MONEY');

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Le caissier ayant fait la vente
    total_amount DECIMAL(10, 2) NOT NULL,
    status order_status DEFAULT 'COMPLETED',
    payment_method payment_method NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABLE DES LIGNES DE COMMANDE (ORDER ITEMS)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🔒 RLS POUR LE SYSTÈME DE CAISSE
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Isolation des Catégories" ON categories FOR ALL USING (tenant_id = (auth.jwt()->>'tenant_id')::UUID);
CREATE POLICY "Isolation des Produits" ON products FOR ALL USING (tenant_id = (auth.jwt()->>'tenant_id')::UUID);
CREATE POLICY "Isolation des Commandes" ON orders FOR ALL USING (tenant_id = (auth.jwt()->>'tenant_id')::UUID);
CREATE POLICY "Isolation des Lignes de Commande" ON order_items FOR ALL USING (tenant_id = (auth.jwt()->>'tenant_id')::UUID);
