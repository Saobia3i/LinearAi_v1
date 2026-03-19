import { Button, Card, CardBody, Chip } from "@heroui/react";
import { Package, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { addToCart, getErrorMessage, getProducts } from "../api";
import type { Product } from "../types";

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await getProducts();
        setProducts(response.data);
      } catch {
        setError("Failed to load products. Login required.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const onAdd = async (productId: number, durationMonths: number) => {
    try {
      await addToCart(productId, durationMonths);
      setError("Item added to cart.");
    } catch (e) {
      setError(getErrorMessage(e, "Failed to add item"));
    }
  };

  if (loading) return <p className="section-subtitle">Loading products...</p>;
  if (error && products.length === 0) return <p className="section-subtitle">{error}</p>;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Package size={20} className="text-blue-300" />
        <h2 className="section-title">Products</h2>
      </div>

      {error && <p className="section-subtitle">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        {products.map((product) => (
          <Card key={product.id} className="border border-slate-800 bg-slate-900/70">
            <CardBody className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{product.title}</h3>
                <p className="text-sm text-slate-400">{product.shortDescription}</p>
              </div>

              <Chip variant="flat" color="primary" className="w-fit">
                Base price ৳{product.price}
              </Chip>

              <div className="flex flex-wrap gap-2">
                {product.subscriptions.map((s) => (
                  <Button
                    key={s.id}
                    color="primary"
                    variant="flat"
                    startContent={<ShoppingCart size={14} />}
                    onPress={() => onAdd(product.id, s.durationMonths)}>
                    {s.durationMonths}m • ৳{s.finalPrice}
                  </Button>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}
