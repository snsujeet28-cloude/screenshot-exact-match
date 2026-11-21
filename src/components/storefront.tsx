import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search, ArrowRight, SlidersHorizontal, Leaf, Clock, MapPin } from "lucide-react";
import { useState } from "react";
import { ShopShell, ProductCard, TrustStrip, Empty, Stepper } from "./shop-shared";
import { Button } from "@/components/ui/button";
import { catalogOptions } from "@/lib/catalog.functions";
import { categories, photos, money } from "@/lib/commerce";
import basket from "@/assets/grocery-basket.asset.json";
import promo from "@/assets/grocery-promo.asset.json";
export function Storefront() {
  const { data } = useSuspenseQuery(catalogOptions);
  const [search, setSearch] = useState("");
  return (
    <ShopShell>
      <div className="store-content">
        <div className="search-field">
          <Search />
          <input
            placeholder="Search for products…"
            aria-label="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {!search && (
          <>
            <div className="promo-banner">
              <img src={promo.url} alt="Fresh groceries in a yellow shopping bag" />
              <div className="promo-copy">
                <h1>
                  Free Delivery
                  <br />
                  Above {money(data.settings.free_delivery)}
                </h1>
                <p>
                  Groceries, Ration &<br />
                  Daily Essentials
                </p>
                <Button asChild variant="promo" size="sm">
                  <Link to="/category/$slug" params={{ slug: "vegetables" }}>
                    Order Now <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="section-heading">
              <h2>Shop by category</h2>
              <Link to="/categories">
                See all <ArrowRight />
              </Link>
            </div>
            <div className="category-row">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  className={`category category-${c.slug}`}
                >
                  <div>
                    <img src={photos[c.image]} alt={c.name} />
                  </div>
                  <strong>{c.name}</strong>
                </Link>
              ))}
            </div>
            <Link to="/category/$slug" params={{ slug: "vegetables" }} className="fresh-promo">
              <img src={basket.url} alt="Fresh vegetables" />
              <div>
                <h2>
                  Fresh Vegetables
                  <br />
                  at Best Price
                </h2>
                <span>Shop Now →</span>
              </div>
            </Link>
          </>
        )}
        <div className="section-heading">
          <div>
            <h2>{search ? "Search results" : "Fresh veggies, happy meals"}</h2>
            <p>{search ? `For “${search}”` : "Handpicked every morning. Priced just right."}</p>
          </div>
          {!search && (
            <Link to="/category/$slug" params={{ slug: "vegetables" }}>
              <ArrowRight />
            </Link>
          )}
        </div>
        <div className="product-grid">
          {data.products
            .filter((p) =>
              search
                ? p.name.toLowerCase().includes(search.toLowerCase())
                : p.category === "Vegetables",
            )
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
        {search &&
          !data.products.some((p) => p.name.toLowerCase().includes(search.toLowerCase())) && (
            <Empty title="No products found">
              <p>Try another grocery or category.</p>
            </Empty>
          )}
        {!search && (
          <div className="home-end">
            <Leaf />
            <h2>
              A little local.
              <br />A lot of love.
            </h2>
            <p>Proudly delivering happiness in Hata.</p>
            <span>BROTHERS KART · 274203</span>
          </div>
        )}
      </div>
    </ShopShell>
  );
}
export function CategoryPage({ slug }: { slug?: string }) {
  const { data } = useSuspenseQuery(catalogOptions);
  const category = categories.find((c) => c.slug === slug);
  const [sort, setSort] = useState("fresh");
  const [search, setSearch] = useState("");
  return (
    <ShopShell title={category?.name ?? "All categories"}>
      <div className="store-content">
        {!slug ? (
          <div className="categories-grid">
            {categories.map((c) => (
              <Link
                to="/category/$slug"
                params={{ slug: c.slug }}
                key={c.slug}
                className={`category category-${c.slug}`}
              >
                <div>
                  <img src={photos[c.image]} alt={c.name} />
                </div>
                <strong>{c.name}</strong>
                <small>
                  {data.products.filter((p) => p.category === c.name).length} products{" "}
                  <ArrowRight />
                </small>
              </Link>
            ))}
          </div>
        ) : (
          <>
            <div className="search-field">
              <Search />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${category?.name ?? "products"}`}
              />
            </div>
            <div className="filter-row">
              <Button
                variant={sort === "fresh" ? "default" : "outline"}
                size="sm"
                onClick={() => setSort("fresh")}
              >
                All
              </Button>
              <Button
                variant={sort === "price" ? "default" : "outline"}
                size="sm"
                onClick={() => setSort("price")}
              >
                <SlidersHorizontal />
                Price: low to high
              </Button>
            </div>
            <div className="product-list">
              {data.products
                .filter(
                  (p) =>
                    p.category === category?.name &&
                    p.name.toLowerCase().includes(search.toLowerCase()),
                )
                .sort((a, b) =>
                  sort === "price" ? a.price - b.price : a.image_index - b.image_index,
                )
                .map((p) => (
                  <div className="product-list-row" key={p.id}>
                    <Link to="/product/$id" params={{ id: p.id }}>
                      <img src={photos[p.image_index]} alt={p.name} />
                    </Link>
                    <div>
                      <Link to="/product/$id" params={{ id: p.id }}>
                        <h3>{p.name}</h3>
                      </Link>
                      <p>({p.unit})</p>
                      <strong>{money(p.price)}</strong>
                    </div>
                    <Stepper product={p} />
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </ShopShell>
  );
}
export function ProductPage({ id }: { id: string }) {
  const { data } = useSuspenseQuery(catalogOptions);
  const product = data.products.find((p) => p.id === id);
  return (
    <ShopShell title={product?.name ?? "Product"}>
      {product ? (
        <>
          <div className="detail-image">
            <img src={photos[product.image_index]} alt={product.name} />
          </div>
          <div className="store-content">
            <span className="fresh-label">
              <Leaf /> FRESH FROM LOCAL SHOPS
            </span>
            <h1 className="detail-title">{product.name}</h1>
            <p className="text-muted-foreground">{product.unit}</p>
            <div className="detail-price">
              <div>
                <strong>{money(product.price)}</strong>
                <del>{money(product.mrp)}</del>
              </div>
              <Stepper product={product} />
            </div>
            <TrustStrip />
            <h2 className="mt-7 font-bold">About this product</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Carefully selected by our neighbourhood shops in Hata. Fresh quality, packed with care
              and brought straight to your doorstep.
            </p>
            <p className="mt-4 text-sm">
              Store in a cool, dry place. Wash fresh produce before use.
            </p>
          </div>
        </>
      ) : (
        <Empty title="Product not found" />
      )}
    </ShopShell>
  );
}
