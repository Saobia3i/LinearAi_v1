import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  useDisclosure
} from "@heroui/react";
import { NotebookTabs, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createAdminProduct,
  deleteAdminProduct,
  deleteAdminSubscription,
  getAdminProducts,
  getErrorMessage,
  saveAdminSubscription,
  updateAdminProduct
} from "../../api";
import type { Product } from "../../types";

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const editModal = useDisclosure();
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [manageProduct, setManageProduct] = useState<Product | null>(null);
  const [subDuration, setSubDuration] = useState("3");
  const [subPrice, setSubPrice] = useState("");
  const [subDiscount, setSubDiscount] = useState("0");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const load = async () => {
    const res = await getAdminProducts();
    setProducts(res.data);
    setManageProduct((prev) => {
      if (!prev) return null;
      return res.data.find((p) => p.id === prev.id) ?? null;
    });
  };

  useEffect(() => {
    load().catch(() => setProducts([]));
  }, []);

  const msg = (text: string, type: "success" | "error" = "success") => setMessage({ text, type });

  const onCreateProduct = async () => {
    if (!newTitle || !newPrice) return msg("Title and price are required.", "error");

    try {
      await createAdminProduct({ title: newTitle, shortDescription: newDesc, price: Number(newPrice) });
      setNewTitle("");
      setNewDesc("");
      setNewPrice("");
      msg("Product created.");
      await load();
    } catch (e) {
      msg(getErrorMessage(e, "Create failed"), "error");
    }
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setEditTitle(product.title);
    setEditDesc(product.shortDescription);
    setEditPrice(String(product.price));
    setEditActive(product.isActive ?? true);
    editModal.onOpen();
  };

  const onSaveEdit = async () => {
    if (!editProduct) return;

    try {
      await updateAdminProduct(editProduct.id, {
        title: editTitle,
        shortDescription: editDesc,
        price: Number(editPrice),
        isActive: editActive
      });
      editModal.onClose();
      msg("Product updated.");
      await load();
    } catch (e) {
      msg(getErrorMessage(e, "Update failed"), "error");
    }
  };

  const onToggleActive = async (product: Product) => {
    try {
      await updateAdminProduct(product.id, {
        title: product.title,
        shortDescription: product.shortDescription,
        price: product.price,
        isActive: !product.isActive
      });
      await load();
    } catch (e) {
      msg(getErrorMessage(e, "Update failed"), "error");
    }
  };

  const onDeleteProduct = async (id: number) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      await deleteAdminProduct(id);
      msg("Product deleted.");
      await load();
    } catch (e) {
      msg(getErrorMessage(e, "Delete failed"), "error");
    }
  };

  const onSaveSubscription = async () => {
    if (!manageProduct) return;
    if (!subPrice) return msg("Price is required.", "error");

    const payload = {
      durationMonths: Number(subDuration),
      price: Number(subPrice),
      discountPercent: Number(subDiscount),
      isActive: true
    };

    try {
      await saveAdminSubscription(manageProduct.id, payload);
      setSubPrice("");
      setSubDiscount("0");
      msg("Subscription plan saved.");
      await load();
    } catch (e) {
      msg(getErrorMessage(e, "Save failed"), "error");
    }
  };

  const onDeleteSubscription = async (id: number) => {
    try {
      await deleteAdminSubscription(id);
      msg("Plan deleted.");
      await load();
    } catch (e) {
      msg(getErrorMessage(e, "Delete failed"), "error");
    }
  };

  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const visibleProducts = products.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="premium-section">
      <div className="premium-section-head">
        <div>
          <p className="premium-kicker">Catalog Control</p>
          <h2 className="section-title">Product Management</h2>
        </div>
      </div>

      {message && <p className={`text-sm ${message.type === "success" ? "premium-success" : "premium-danger"}`}>{message.text}</p>}

      <Card className="premium-card">
        <CardBody className="space-y-4 p-5 sm:p-6">
          <div>
            <p className="premium-kicker">Add Product</p>
            <p className="text-sm text-[var(--theme-muted)]">Keep pricing, copy, and subscriptions visually consistent.</p>
          </div>

          <div className="premium-form-grid">
            <Input label="Title" value={newTitle} onValueChange={setNewTitle} radius="lg" classNames={{ inputWrapper: "premium-input" }} />
            <Input label="Description" value={newDesc} onValueChange={setNewDesc} radius="lg" classNames={{ inputWrapper: "premium-input" }} />
            <Input label="Base Price (৳)" type="number" value={newPrice} onValueChange={setNewPrice} radius="lg" classNames={{ inputWrapper: "premium-input" }} />
            <div className="flex items-end">
              <Button color="danger" radius="full" className="w-full" onPress={onCreateProduct} startContent={<Plus size={14} />}>
                Add Product
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="premium-card">
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="premium-data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td className="font-semibold text-[var(--theme-text)]">{product.title}</td>
                    <td className="max-w-xs truncate">{product.shortDescription}</td>
                    <td>৳{product.price}</td>
                    <td>
                      <Chip size="sm" variant="flat" color={product.isActive ? "success" : "danger"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Chip>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" radius="full" variant="flat" color="primary" startContent={<Pencil size={12} />} onPress={() => openEdit(product)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          radius="full"
                          variant="flat"
                          color="secondary"
                          startContent={<NotebookTabs size={12} />}
                          onPress={() => setManageProduct(manageProduct?.id === product.id ? null : product)}>
                          Plans
                        </Button>
                        <Button size="sm" radius="full" variant="flat" color={product.isActive ? "danger" : "success"} onPress={() => onToggleActive(product)}>
                          {product.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          size="sm"
                          radius="full"
                          variant="flat"
                          color="danger"
                          startContent={<Trash2 size={12} />}
                          onPress={() => onDeleteProduct(product.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-[var(--theme-muted)]">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {products.length > pageSize && (
        <div className="premium-pagination-wrap">
          <Pagination page={page} total={totalPages} onChange={setPage} radius="full" color="danger" showControls />
        </div>
      )}

      {manageProduct && (
        <Card className="premium-card premium-card-strong">
          <CardBody className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="premium-kicker">Subscription Plans</p>
                <h3 className="text-xl font-bold text-[var(--theme-text)]">{manageProduct.title}</h3>
              </div>
              <Button size="sm" radius="full" variant="light" onPress={() => setManageProduct(null)}>
                Close
              </Button>
            </div>

            {manageProduct.subscriptions.length === 0 ? (
              <p className="section-subtitle">No plans yet. Add one below.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="premium-data-table">
                  <thead>
                    <tr>
                      <th>Duration</th>
                      <th>Base Price</th>
                      <th>Discount</th>
                      <th>Final Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manageProduct.subscriptions.map((sub) => (
                      <tr key={sub.id}>
                        <td>{sub.durationMonths} months</td>
                        <td>৳{sub.price}</td>
                        <td className="text-[var(--theme-green)]">{sub.discountPercent}%</td>
                        <td className="font-bold text-[var(--theme-text)]">৳{sub.finalPrice}</td>
                        <td>
                          <Button
                            size="sm"
                            radius="full"
                            variant="flat"
                            color="danger"
                            startContent={<Trash2 size={12} />}
                            onPress={() => onDeleteSubscription(sub.id)}>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="premium-subscription-grid">
              <div className="flex flex-col gap-2">
                <label className="premium-stat-label">Duration (months)</label>
                <select value={subDuration} onChange={(e) => setSubDuration(e.target.value)} className="premium-select">
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                </select>
              </div>
              <Input label="Base Price (৳)" type="number" value={subPrice} onValueChange={setSubPrice} radius="lg" classNames={{ inputWrapper: "premium-input" }} />
              <Input label="Discount %" type="number" value={subDiscount} onValueChange={setSubDiscount} radius="lg" classNames={{ inputWrapper: "premium-input" }} />
              <div className="flex items-end">
                <Button color="danger" radius="full" className="w-full" onPress={onSaveSubscription}>
                  Save Plan
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <Modal isOpen={editModal.isOpen} onOpenChange={editModal.onOpenChange} className="border border-[var(--theme-border)] bg-[var(--theme-surface-strong)]">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-[var(--theme-text)]">Edit Product</ModalHeader>
              <ModalBody className="space-y-3">
                <Input label="Title" value={editTitle} onValueChange={setEditTitle} radius="lg" classNames={{ inputWrapper: "premium-input" }} />
                <Input label="Short Description" value={editDesc} onValueChange={setEditDesc} radius="lg" classNames={{ inputWrapper: "premium-input" }} />
                <Input label="Price (৳)" type="number" value={editPrice} onValueChange={setEditPrice} radius="lg" classNames={{ inputWrapper: "premium-input" }} />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editActive"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="accent-[var(--theme-red)]"
                  />
                  <label htmlFor="editActive" className="text-sm text-[var(--theme-text)]">
                    Active
                  </label>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" radius="full" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="danger" radius="full" onPress={onSaveEdit}>
                  Save Changes
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </section>
  );
}
