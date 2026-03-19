import { Button, Card, CardBody, Chip, Input } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import {
  createAdminProduct,
  deleteAdminSubscription,
  getAdminProducts,
  getErrorMessage,
  saveAdminSubscription,
  updateAdminProduct
} from "../../api";
import type { Product } from "../../types";

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const [durationMonths, setDurationMonths] = useState("3");
  const [subscriptionPrice, setSubscriptionPrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("0");

  const selectedProduct = useMemo(() => products[0], [products]);

  const load = async () => {
    const response = await getAdminProducts();
    setProducts(response.data);
  };

  useEffect(() => {
    load().catch(() => setProducts([]));
  }, []);

  const onCreateProduct = async () => {
    try {
      await createAdminProduct({
        title,
        shortDescription,
        price: Number(price)
      });
      setTitle("");
      setShortDescription("");
      setPrice("");
      setMessage("Product created.");
      await load();
    } catch (error) {
      setMessage(getErrorMessage(error, "Product create failed"));
    }
  };

  const onToggle = async (product: Product) => {
    try {
      await updateAdminProduct(product.id, {
        title: product.title,
        shortDescription: product.shortDescription,
        price: product.price,
        isActive: !product.isActive
      });
      await load();
    } catch (error) {
      setMessage(getErrorMessage(error, "Product update failed"));
    }
  };

  const onSaveSubscription = async () => {
    if (!selectedProduct) return;

    try {
      await saveAdminSubscription(selectedProduct.id, {
        durationMonths: Number(durationMonths),
        price: Number(subscriptionPrice),
        discountPercent: Number(discountPercent),
        isActive: true
      });
      setSubscriptionPrice("");
      setDiscountPercent("0");
      setMessage("Subscription saved.");
      await load();
    } catch (error) {
      setMessage(getErrorMessage(error, "Subscription save failed"));
    }
  };

  const onDeleteSubscription = async (id: number) => {
    try {
      await deleteAdminSubscription(id);
      await load();
    } catch (error) {
      setMessage(getErrorMessage(error, "Subscription delete failed"));
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="section-title">Admin Products</h2>
      {message && <p className="section-subtitle">{message}</p>}

      <Card className="border border-slate-800 bg-slate-900/70">
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Title" value={title} onValueChange={setTitle} />
          <Input label="Description" value={shortDescription} onValueChange={setShortDescription} />
          <Input label="Base Price" type="number" value={price} onValueChange={setPrice} />
          <div className="flex items-end">
            <Button color="primary" className="w-full" onPress={onCreateProduct}>
              Create Product
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {products.map((product) => (
          <Card key={product.id} className="border border-slate-800 bg-slate-900/60">
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-white">{product.title}</h3>
                  <p className="text-sm text-slate-400">{product.shortDescription}</p>
                </div>
                <Chip color={product.isActive ? "success" : "danger"} variant="flat">
                  {product.isActive ? "Active" : "Inactive"}
                </Chip>
              </div>

              <p className="text-sm text-slate-300">Price: ৳{product.price}</p>

              <div className="flex flex-wrap gap-2">
                {product.subscriptions.map((sub) => (
                  <Chip key={sub.id} variant="flat" color={sub.isActive ? "primary" : "default"}>
                    {sub.durationMonths}m • ৳{sub.finalPrice}
                  </Chip>
                ))}
              </div>

              <div className="flex justify-end">
                <Button size="sm" variant="flat" color={product.isActive ? "danger" : "success"} onPress={() => onToggle(product)}>
                  {product.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {selectedProduct && (
        <Card className="border border-slate-800 bg-slate-900/70">
          <CardBody className="space-y-3">
            <h3 className="text-base font-semibold text-white">Manage Subscription - {selectedProduct.title}</h3>
            <div className="grid gap-3 sm:grid-cols-4">
              <Input label="Duration (months)" type="number" value={durationMonths} onValueChange={setDurationMonths} />
              <Input label="Price" type="number" value={subscriptionPrice} onValueChange={setSubscriptionPrice} />
              <Input label="Discount %" type="number" value={discountPercent} onValueChange={setDiscountPercent} />
              <div className="flex items-end">
                <Button color="primary" className="w-full" onPress={onSaveSubscription}>
                  Save Plan
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedProduct.subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2">
                  <span className="text-sm text-slate-200">{sub.durationMonths}m / ৳{sub.finalPrice}</span>
                  <Button size="sm" variant="light" color="danger" onPress={() => onDeleteSubscription(sub.id)}>
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </section>
  );
}
