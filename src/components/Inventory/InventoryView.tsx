import { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Barcode,
  Edit2,
  Trash2,
  AlertTriangle,
  Download,
  Camera,
  Sparkles,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { Product, Department, DEFAULT_CATEGORIES, INITIAL_DEPARTMENTS } from '../../types/pos';
import { SAMPLE_CARDS_AND_GIFTS } from '../../utils/storage';
import { CameraScannerModal } from '../POS/CameraScannerModal';
import { posSound } from '../../utils/sound';

interface InventoryViewProps {
  products: Product[];
  departments?: Department[];
  onSaveProducts: (products: Product[]) => void;
  currencySymbol: string;
}

export function InventoryView({
  products,
  departments = INITIAL_DEPARTMENTS,
  onSaveProducts,
  currencySymbol,
}: InventoryViewProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');

  const categoriesList = useMemo(() => {
    if (departments && departments.length > 0) {
      return departments.map((d) => d.name);
    }
    return [...DEFAULT_CATEGORIES];
  }, [departments]);

  // Product Add / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState<string>(categoriesList[0] || 'Department Cards');
  const [formPrice, setFormPrice] = useState('10.00');
  const [formCostPrice, setFormCostPrice] = useState('2.50');
  const [formStock, setFormStock] = useState('20');
  const [formMinStock, setFormMinStock] = useState('5');
  const [formTaxable, setFormTaxable] = useState(true);

  // Camera scanner for barcode field
  const [isCameraScanning, setIsCameraScanning] = useState(false);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    // Auto-generate realistic barcode
    setFormBarcode(`79${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    setFormSku(`CG-${Math.floor(1000 + Math.random() * 9000)}`);
    const initialCat = categoriesList[0] || 'Department Cards';
    const deptObj = departments.find((d) => d.name === initialCat);
    setFormCategory(initialCat);
    setFormPrice(deptObj ? deptObj.defaultPrice.toFixed(2) : '10.00');
    setFormCostPrice('2.50');
    setFormStock('20');
    setFormMinStock('5');
    setFormTaxable(deptObj ? deptObj.taxable : true);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormBarcode(p.barcode);
    setFormSku(p.sku);
    setFormCategory(p.category);
    setFormPrice(p.price.toString());
    setFormCostPrice(p.costPrice.toString());
    setFormStock(p.stock.toString());
    setFormMinStock(p.minStock.toString());
    setFormTaxable(p.taxable);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const priceNum = parseFloat(formPrice) || 0;
    const costNum = parseFloat(formCostPrice) || 0;
    const stockNum = parseInt(formStock, 10) || 0;
    const minStockNum = parseInt(formMinStock, 10) || 5;

    if (editingProduct) {
      const updated = products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              name: formName.trim(),
              barcode: formBarcode.trim(),
              sku: formSku.trim(),
              category: formCategory,
              price: priceNum,
              costPrice: costNum,
              stock: stockNum,
              minStock: minStockNum,
              taxable: formTaxable,
            }
          : p
      );
      onSaveProducts(updated);
    } else {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: formName.trim(),
        barcode: formBarcode.trim(),
        sku: formSku.trim(),
        category: formCategory,
        price: priceNum,
        costPrice: costNum,
        stock: stockNum,
        minStock: minStockNum,
        taxable: formTaxable,
        createdAt: new Date().toISOString(),
      };
      onSaveProducts([...products, newProduct]);
    }

    posSound.playScanBeep();
    setIsModalOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      posSound.playKeyClick();
      onSaveProducts(products.filter((p) => p.id !== id));
    }
  };

  // Optional: load starter cards/gifts items if store manager desires
  const handleLoadSampleCatalog = () => {
    if (
      window.confirm(
        'Load 6 Cards & Gifts retail starter items (Birthday Cards, Gift Bags, Scented Soy Candles, etc.) into inventory?'
      )
    ) {
      const newItems: Product[] = SAMPLE_CARDS_AND_GIFTS.map((item, idx) => ({
        ...item,
        id: `prod-sample-${Date.now()}-${idx}`,
        createdAt: new Date().toISOString(),
      }));
      onSaveProducts([...products, ...newItems]);
      posSound.playDiscountFanfare();
    }
  };

  // Export Inventory as CSV
  const handleExportCSV = () => {
    const headers = ['Name', 'Category', 'Barcode', 'SKU', 'Price', 'CostPrice', 'Stock', 'MinStock', 'Taxable'];
    const rows = products.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.barcode}"`,
      `"${p.sku}"`,
      p.price.toFixed(2),
      p.costPrice.toFixed(2),
      p.stock,
      p.minStock,
      p.taxable ? 'YES' : 'NO',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cards-Gifts-Inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      p.sku.toLowerCase().includes(search.toLowerCase());

    let matchStock = true;
    if (filterStock === 'low') matchStock = p.stock > 0 && p.stock <= p.minStock;
    if (filterStock === 'out') matchStock = p.stock <= 0;

    return matchCat && matchSearch && matchStock;
  });

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 max-w-7xl mx-auto w-full overflow-hidden">
      {/* Top Bar with Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            Inventory & Products Management
          </h2>
          <p className="text-xs text-slate-400">
            {products.length} total items in store catalog • Real-time barcode & stock tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {products.length === 0 && (
            <button
              type="button"
              onClick={handleLoadSampleCatalog}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-800/60 font-semibold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Load Starter Catalog
            </button>
          )}

          {products.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-sky-400" />
              Export CSV
            </button>
          )}

          <button
            type="button"
            onClick={openAddModal}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by product name, barcode, or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Categories / Depts</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value as 'all' | 'low' | 'out')}
            className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Stock Statuses</option>
            <option value="low">Low Stock Only</option>
            <option value="out">Out of Stock Only</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Barcode / SKU</th>
                <th className="py-3 px-3 text-right">Retail Price</th>
                <th className="py-3 px-3 text-right">Cost</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-3 text-center">Taxable</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    {products.length === 0
                      ? 'No products added yet. Click "Add New Product" to populate your store inventory without demo items!'
                      : 'No products match your current search or filter.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock > 0 && p.stock <= p.minStock;
                  const isOut = p.stock <= 0;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-850/80 transition-colors group"
                    >
                      <td className="py-3 px-4 font-medium text-slate-200">
                        <div className="font-semibold">{p.name}</div>
                        {isLow && (
                          <div className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5 font-sans">
                            <AlertTriangle className="w-3 h-3" /> Reorder soon (threshold: {p.minStock})
                          </div>
                        )}
                        {isOut && (
                          <div className="text-[10px] text-rose-400 flex items-center gap-1 mt-0.5 font-sans">
                            <AlertTriangle className="w-3 h-3" /> Out of stock
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400">{p.category}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        <div>{p.barcode || '—'}</div>
                        <div className="text-[10px] text-slate-600">{p.sku}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                        {currencySymbol}{p.price.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-400">
                        {currencySymbol}{p.costPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs ${
                            isOut
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : isLow
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'text-slate-200'
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400">
                        {p.taxable ? 'Yes' : 'Exempt'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-300 hover:bg-slate-750 transition cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-750 transition cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <h3 className="font-bold text-slate-100 text-base">
                {editingProduct ? 'Edit Product' : 'Add New Retail Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 flex flex-col gap-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Handmade Birthday Floral Card"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              {/* Barcode & SKU */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold uppercase text-slate-400">
                      Barcode
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCameraScanning(true)}
                      className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Camera className="w-3 h-3" /> Scan Barcode
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 793573100121"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    SKU / Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CRD-001"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Department / Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setFormCategory(newCat);
                    const matchedDept = departments.find((d) => d.name === newCat);
                    if (matchedDept && matchedDept.defaultPrice > 0) {
                      setFormPrice(matchedDept.defaultPrice.toFixed(2));
                      setFormTaxable(matchedDept.taxable);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {categoriesList.map((cat) => {
                    const d = departments.find((dept) => dept.name === cat);
                    return (
                      <option key={cat} value={cat}>
                        {cat} {d && d.defaultPrice > 0 ? `(${currencySymbol}${d.defaultPrice.toFixed(2)})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Retail Selling Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 font-mono text-slate-500 font-bold">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-3 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Cost Price (Wholesale)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 font-mono text-slate-500 font-bold">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formCostPrice}
                      onChange={(e) => setFormCostPrice(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-3 py-2 text-sm font-mono text-slate-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Inventory Stock & Alerts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Current Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Low Stock Alert At
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Taxable Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="form-taxable"
                  checked={formTaxable}
                  onChange={(e) => setFormTaxable(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="form-taxable" className="text-xs text-slate-300 cursor-pointer">
                  Item is subject to standard sales tax
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer shadow-md"
                >
                  {editingProduct ? 'Save Changes' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode scanner for modal */}
      <CameraScannerModal
        isOpen={isCameraScanning}
        onClose={() => setIsCameraScanning(false)}
        onDetected={(code) => {
          setFormBarcode(code);
        }}
      />
    </div>
  );
}
