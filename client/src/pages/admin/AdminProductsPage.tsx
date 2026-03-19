import { Button, Card, CardBody, Chip, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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

  // Create product form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");

  // Edit product modal
  const editModal = useDisclosure();
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editActive, setEditActive] = useState(true);

  // Subscription management
  const [manageProduct, setManageProduct] = useState<Product | null>(null);
  const [subDuration, setSubDuration] = useState("3");
  const [subPrice, setSubPrice] = useState("");
  const [subDiscount, setSubDiscount] = useState("0");

  const load = async () => {
    const res = await getAdminProducts();
    setProducts(res.data);
    // sync manageProduct using functional update to avoid stale closure
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
      setNewTitle(""); setNewDesc(""); setNewPrice("");
      msg("Product created.");
      await load();
    } catch (e) { msg(getErrorMessage(e, "Create failed"), "error"); }
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
    } catch (e) { msg(getErrorMessage(e, "Update failed"), "error"); }
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
    } catch (e) { msg(getErrorMessage(e, "Update failed"), "error"); }
  };

  const onDeleteProduct = async (id: number) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteAdminProduct(id);
      msg("Product deleted.");
      await load();
    } catch (e) { msg(getErrorMessage(e, "Delete failed"), "error"); }
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
      setSubPrice(""); setSubDiscount("0");
      msg("Subscription plan saved.");
      await load();
    } catch (e) {
      const errMsg = getErrorMessage(e, "Save failed");
      console.error("saveAdminSubscription error:", e);
      msg(errMsg, "error");
    }
  };

  const onDeleteSubscription = async (id: number) => {
    try {
      await deleteAdminSubscription(id);
      msg("Plan deleted.");
      await load();
    } catch (e) { msg(getErrorMessage(e, "Delete failed"), "error"); }
  };

  return (
    <section className="space-y-4">
      <h2 className="section-title">Product Management</h2>
      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}

      {/* Add Product */}
      <Card className="border border-slate-800 bg-slate-900/70">
        <CardBody className="space-y-3">
          <p className="text-sm font-medium text-slate-300">Add New Product</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Title" value={newTitle} onValueChange={setNewTitle} />
            <Input label="Description" value={newDesc} onValueChange={setNewDesc} />
            <Input label="Base Price (৳)" type="number" value={newPrice} onValueChange={setNewPrice} />
            <div className="flex items-end">
              <Button color="primary" className="w-full" onPress={onCreateProduct} startContent={<Plus size={14} />}>
                Add Product
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Products Table */}
      <Card className="border border-slate-800 bg-slate-900/70">
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-slate-400">{product.id}</td>
                    <td className="px-4 py-3 font-medium text-white">{product.title}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{product.shortDescription}</td>
                    <td className="px-4 py-3 text-slate-300">৳{product.price}</td>
                    <td className="px-4 py-3">
                      <Chip size="sm" variant="flat" color={product.isActive ? "success" : "danger"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Chip>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="flat" color="primary" startContent={<Pencil size={12} />} onPress={() => openEdit(product)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          color="secondary"
                          onPress={() => setManageProduct(manageProduct?.id === product.id ? null : product)}>
                          📅 Plans
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          color={product.isActive ? "danger" : "success"}
                          onPress={() => onToggleActive(product)}>
                          {product.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          size="sm"
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
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No products found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Subscription Management */}
      {manageProduct && (
        <Card className="border border-blue-800/40 bg-slate-900/80">
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Subscription Plans — {manageProduct.title}</h3>
              <Button size="sm" variant="light" onPress={() => setManageProduct(null)}>Close ✕</Button>
            </div>

            {/* Current plans */}
            {manageProduct.subscriptions.length === 0 ? (
              <p className="text-sm text-slate-500">No plans yet. Add one below.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-3 py-2">Duration</th>
                      <th className="px-3 py-2">Base Price</th>
                      <th className="px-3 py-2">Discount</th>
                      <th className="px-3 py-2">Final Price</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manageProduct.subscriptions.map((sub) => (
                      <tr key={sub.id} className="border-b border-slate-800/40">
                        <td className="px-3 py-2 text-slate-300">{sub.durationMonths} months</td>
                        <td className="px-3 py-2 text-slate-300">৳{sub.price}</td>
                        <td className="px-3 py-2 text-emerald-400">{sub.discountPercent}%</td>
                        <td className="px-3 py-2 font-semibold text-white">৳{sub.finalPrice}</td>
                        <td className="px-3 py-2">
                          <Button
                            size="sm"
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

            {/* Add/update plan form */}
            <div className="grid gap-3 sm:grid-cols-4 border-t border-slate-800 pt-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Duration (months)</label>
                <select
                  value={subDuration}
                  onChange={(e) => setSubDuration(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                </select>
              </div>
              <Input label="Base Price (৳)" type="number" value={subPrice} onValueChange={setSubPrice} />
              <Input label="Discount %" type="number" value={subDiscount} onValueChange={setSubDiscount} />
              <div className="flex items-end">
                <Button color="primary" className="w-full" onPress={onSaveSubscription}>
                  Save Plan
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Edit Product Modal */}
      <Modal isOpen={editModal.isOpen} onOpenChange={editModal.onOpenChange} className="bg-slate-900 border border-slate-800">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-white">Edit Product</ModalHeader>
              <ModalBody className="space-y-3">
                <Input label="Title" value={editTitle} onValueChange={setEditTitle} />
                <Input label="Short Description" value={editDesc} onValueChange={setEditDesc} />
                <Input label="Price (৳)" type="number" value={editPrice} onValueChange={setEditPrice} />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editActive"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="accent-blue-500"
                  />
                  <label htmlFor="editActive" className="text-sm text-slate-300">Active</label>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>Cancel</Button>
                <Button color="primary" onPress={onSaveEdit}>Save Changes</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </section>
  );
}
