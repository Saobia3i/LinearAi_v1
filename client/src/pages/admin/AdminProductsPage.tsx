import {
  Card,
  CardBody,
  Chip,
  Pagination
} from "@heroui/react";
import { NotebookTabs, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  createAdminProduct,
  deleteAdminProduct,
  deleteAdminSubscription,
  getAdminProducts,
  getErrorMessage,
  saveAdminSubscription,
  updateAdminProduct
} from "../../api";
import { AppButton as Button } from "../../components/ui/AppButton";
import { getProductFilterCategories, matchesProductCategory } from "../../productCategories";
import type { Product } from "../../types";

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
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
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const pageSize = 6;
  const managePanelRef = useRef<HTMLDivElement | null>(null);
  const editPanelRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!manageProduct || !managePanelRef.current) return;
    requestAnimationFrame(() => {
      managePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [manageProduct]);

  const msg = (text: string, type: "success" | "error" = "success") => setMessage({ text, type });

  const onCreateProduct = async () => {
    if (!newTitle || !newPrice) return msg("Title and price are required.", "error");
    try {
      await createAdminProduct({ title: newTitle, shortDescription: newDesc, price: Number(newPrice) });
      setNewTitle(""); setNewDesc(""); setNewPrice("");
      msg("Product created.");
      await load();
    } catch (e) {
      msg(getErrorMessage(e, "Create failed"), "error");
    }
  };

  const openEdit = (product: Product) => {
    const isOpening = editProduct?.id !== product.id || !isEditOpen;
    setEditProduct(isOpening ? product : null);
    setEditTitle(product.title);
    setEditDesc(product.shortDescription);
    setEditPrice(String(product.price));
    setEditActive(product.isActive ?? true);
    setIsEditOpen(isOpening);
    if (isOpening) {
      setTimeout(() => {
        editPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
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
      setIsEditOpen(false);
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
      setSubPrice(""); setSubDiscount("0");
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

  const categoryOptions = getProductFilterCategories(products);
  const filteredProducts = products.filter((product) => {
    const searchText = search.trim().toLowerCase();
    const matchesSearch =
      searchText.length === 0 ||
      product.title.toLowerCase().includes(searchText) ||
      product.shortDescription.toLowerCase().includes(searchText);

    const matchesCategory = matchesProductCategory(product, categoryFilter);

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const visibleProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="premium-section">
      <div className="premium-section-head">
        <div>
          <p className="premium-kicker">Catalog Control</p>
          <h2 className="section-title">Product Management</h2>
        </div>
      </div>

      {message && (
        <p className={`text-sm ${message.type === "success" ? "premium-success" : "premium-danger"}`}>
          {message.text}
        </p>
      )}

      <div className="premium-filter-bar">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search products"
          className="admin-input premium-filter-input"
        />
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="admin-input premium-filter-select"
        >
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category === "All" ? "All Plans" : category}
            </option>
          ))}
        </select>
      </div>

      {/* Add Product */}
      <Card className="premium-card">
        <CardBody className="space-y-4 p-5 sm:p-6">
          <div>
            <p className="premium-kicker">Add Product</p>
            <p className="text-sm text-[var(--theme-muted)]">Keep pricing, copy, and subscriptions visually consistent.</p>
          </div>
          <div className="premium-form-grid">
            <div className="premium-admin-field">
              <label className="premium-field-label">Title</label>
              <input className="admin-input" placeholder="Product title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            </div>
            <div className="premium-admin-field">
              <label className="premium-field-label">Description</label>
              <input className="admin-input" placeholder="Short description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            </div>
            <div className="premium-admin-field">
              <label className="premium-field-label">Base Price (৳)</label>
              <input className="admin-input" type="number" placeholder="e.g. 1200" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button color="danger" radius="full" className="h-[54px] w-full font-bold" onPress={onCreateProduct} startContent={<Plus size={14} />}>
                Add Product
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Products table */}
      <Card className="premium-card">
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="premium-data-table min-w-[1180px]">
              <thead>
                <tr>
                  <th className="w-[70px]">#</th>
                  <th className="w-[18%]">Title</th>
                  <th>Description</th>
                  <th className="w-[120px]">Price</th>
                  <th className="w-[120px]">Status</th>
                  <th className="w-[520px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td className="font-semibold text-[var(--theme-text)]">{product.title}</td>
                    <td className="max-w-xs truncate">{product.shortDescription}</td>
                    <td>৳{product.price}</td>
                    <td className="whitespace-nowrap">
                      <Chip size="sm" variant="flat" color={product.isActive ? "success" : "danger"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Chip>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button type="button" className="admin-action-btn admin-action-edit" onClick={() => openEdit(product)}>
                          <Pencil size={12} /><span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="admin-action-btn admin-action-plans"
                          onClick={() => setManageProduct((current) => (current?.id === product.id ? null : product))}
                        >
                          <NotebookTabs size={12} /><span>Plans</span>
                        </button>
                        <button
                          type="button"
                          className={`admin-action-btn ${product.isActive ? "admin-action-toggle-off" : "admin-action-toggle-on"}`}
                          onClick={() => onToggleActive(product)}
                        >
                          <span>{product.isActive ? "Deactivate" : "Activate"}</span>
                        </button>
                        <button type="button" className="admin-action-btn admin-action-delete" onClick={() => onDeleteProduct(product.id)}>
                          <Trash2 size={12} /><span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-[var(--theme-muted)]">No products found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {filteredProducts.length > pageSize && (
        <div className="premium-pagination-wrap">
          <Pagination page={page} total={totalPages} onChange={setPage} radius="full" color="danger" showControls />
        </div>
      )}

      {/* Manage subscriptions panel */}
      {manageProduct && (
        <div ref={managePanelRef} className="scroll-mt-6">
          <Card className="premium-card premium-card-strong">
            <CardBody className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="premium-kicker">Subscription Plans</p>
                  <h3 className="text-xl font-bold text-[var(--theme-text)]">{manageProduct.title}</h3>
                </div>
                <Button size="sm" radius="full" variant="light" onPress={() => setManageProduct(null)}>Close</Button>
              </div>

              {manageProduct.subscriptions.length === 0 ? (
                <p className="section-subtitle">No plans yet. Add one below.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="premium-data-table min-w-[700px]">
                    <thead>
                      <tr>
                        <th className="w-[150px]">Duration</th>
                        <th className="w-[130px]">Base Price</th>
                        <th className="w-[120px]">Discount</th>
                        <th className="w-[130px]">Final Price</th>
                        <th className="w-[150px]">Action</th>
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
                            <Button size="sm" radius="full" variant="flat" color="danger" startContent={<Trash2 size={12} />} onPress={() => onDeleteSubscription(sub.id)}>
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
                <div className="premium-admin-field">
                  <label className="premium-field-label">Duration (months)</label>
                  <select value={subDuration} onChange={(e) => setSubDuration(e.target.value)} className="admin-input">
                    <option value="3">3 months</option>
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                  </select>
                </div>
                <div className="premium-admin-field">
                  <label className="premium-field-label">Base Price (৳)</label>
                  <input className="admin-input" type="number" placeholder="e.g. 1200" value={subPrice} onChange={(e) => setSubPrice(e.target.value)} />
                </div>
                <div className="premium-admin-field">
                  <label className="premium-field-label">Discount %</label>
                  <input className="admin-input" type="number" placeholder="0" value={subDiscount} onChange={(e) => setSubDiscount(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button color="danger" radius="full" className="h-[54px] w-full font-bold" onPress={onSaveSubscription}>
                    Save Plan
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Edit product panel */}
      {isEditOpen && editProduct && (
        <div ref={editPanelRef} className="scroll-mt-6">
          <Card className="premium-card premium-card-strong">
            <CardBody className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="premium-kicker">Edit Product</p>
                  <h3 className="text-xl font-bold text-[var(--theme-text)]">{editProduct.title}</h3>
                </div>
                <button type="button" className="admin-action-btn admin-action-delete w-fit" onClick={() => setIsEditOpen(false)}>
                  Close
                </button>
              </div>

              <div className="premium-form-grid">
                <div className="premium-admin-field">
                  <label className="premium-field-label">Title</label>
                  <input className="admin-input" placeholder="Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>
                <div className="premium-admin-field">
                  <label className="premium-field-label">Short Description</label>
                  <input className="admin-input" placeholder="Short description" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                </div>
                <div className="premium-admin-field">
                  <label className="premium-field-label">Price (৳)</label>
                  <input className="admin-input" type="number" placeholder="Price" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 self-end pb-2">
                  <input
                    type="checkbox"
                    id="editActive"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="accent-[var(--theme-red)]"
                  />
                  <label htmlFor="editActive" className="text-sm text-[var(--theme-text)]">Active</label>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" className="admin-action-btn admin-action-edit" onClick={onSaveEdit}>Save Changes</button>
                <button type="button" className="admin-action-btn admin-action-delete" onClick={() => setIsEditOpen(false)}>Cancel</button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </section>
  );
}
