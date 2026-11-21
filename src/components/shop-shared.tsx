import { Link, useLocation } from "@tanstack/react-router";
import {
  Home,
  Grid2X2,
  ShoppingBag,
  UserRound,
  MapPin,
  ChevronDown,
  ArrowLeft,
  Plus,
  Minus,
  Truck,
  ShieldCheck,
  Leaf,
  ShoppingCart,
  Bell,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { money, photos, type Product, type Line } from "@/lib/commerce";
import logo from "@/assets/brothers-kart-logo.asset.json";
export function Brand({ small = false }: { small?: boolean }) {
  return (
    <Link to="/" className={`brand ${small ? "brand-small" : ""}`}>
      <img className="brand-mark" src={logo.url} alt="Brothers Kart" />

    </Link>
  );
}
export function ShopShell({ children, title }: { children: ReactNode; title?: string }) {
  const path = useLocation().pathname;
  const items = useCart((s) => s.items);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    void useCart.persist.rehydrate();
    setMounted(true);
  }, []);
  const count = mounted ? items.reduce((n, i) => n + i.quantity, 0) : 0;
  return (
    <div className="shop-app">
      <header className="shop-header">
        {title ? (
          <div className="page-title">
            <Button asChild variant="ghost" size="icon">
              <Link to="/">
                <ArrowLeft />
              </Link>
            </Button>
            <h1>{title}</h1>
            <ShoppingBag className="text-primary" />
          </div>
        ) : (
          <>
            <div className="header-brand">
              <Brand />
              <Button asChild variant="ghost" size="icon" aria-label="Order updates">
                <Link to="/account">
                  <Bell />
                </Link>
              </Button>
            </div>
            <Link to="/account" className="location">
              <MapPin />
              <span>
                <strong>
                  Hata, Kushinagar <ChevronDown />
                </strong>
              </span>
            </Link>
          </>
        )}
      </header>
      <main className="shop-main">{children}</main>
      {count > 0 && path !== "/cart" && path !== "/checkout" && (
        <Link to="/cart" className="floating-cart">
          <span className="cart-count">{count}</span>
          <span>
            <strong>
              {count} {count === 1 ? "item" : "items"} in your cart
            </strong>
            <small>{money(items.reduce((n, i) => n + i.quantity * i.price, 0))}</small>
          </span>
          <span>View cart →</span>
        </Link>
      )}
      <nav className="bottom-nav">
        {[
          { to: "/" as const, label: "Home", icon: Home },
          { to: "/categories" as const, label: "Categories", icon: Grid2X2 },
          { to: "/cart" as const, label: "Cart", icon: ShoppingBag },
          { to: "/account" as const, label: "Account", icon: UserRound },
        ].map((n) => (
          <Link key={n.to} to={n.to} className={path === n.to ? "active" : ""}>
            <span>
              <n.icon />
              {n.to === "/cart" && count > 0 && <b>{count}</b>}
            </span>
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
export function Stepper({ product }: { product: Product | Line }) {
  const quantity = useCart((s) => s.items.find((i) => i.id === product.id)?.quantity ?? 0);
  const change = useCart((s) => s.change);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready || !quantity)
    return (
      <Button
        variant="outline"
        className="add-button"
        onClick={() => change(product, 1)}
        disabled={"in_stock" in product && !product.in_stock}
      >
        ADD <Plus />
      </Button>
    );
  return (
    <div className="stepper">
      <Button
        aria-label={`Remove one ${product.name}`}
        variant="ghost"
        size="icon"
        onClick={() => change(product, -1)}
      >
        <Minus />
      </Button>
      <b>{quantity}</b>
      <Button
        aria-label={`Add one ${product.name}`}
        variant="ghost"
        size="icon"
        onClick={() => change(product, 1)}
      >
        <Plus />
      </Button>
    </div>
  );
}
export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Link to="/product/$id" params={{ id: product.id }} className="product-image">
        <span className="discount-tag">
          {Math.round((1 - product.price / product.mrp) * 100)}% OFF
        </span>
        <img src={photos[product.image_index]} alt={product.name} />
      </Link>
      <div className="product-info">
        <span className="fresh-label">
          <Leaf /> FARM FRESH
        </span>
        <Link to="/product/$id" params={{ id: product.id }}>
          <h3>{product.name}</h3>
        </Link>
        <p>{product.unit}</p>
        <div className="product-price">
          <div>
            <strong>{money(product.price)}</strong>
            <del>{money(product.mrp)}</del>
          </div>
          <Stepper product={product} />
        </div>
      </div>
    </article>
  );
}
export function TrustStrip() {
  return (
    <div className="trust-strip">
      <span>
        <Leaf />
        Fresh & local
      </span>
      <span>
        <Truck />
        Quick delivery
      </span>
      <span>
        <ShieldCheck />
        Quality assured
      </span>
    </div>
  );
}
export function Empty({
  icon: Icon = ShoppingBag,
  title,
  children,
}: {
  icon?: typeof ShoppingBag;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Icon />
      <h2>{title}</h2>
      {children}
    </div>
  );
}
