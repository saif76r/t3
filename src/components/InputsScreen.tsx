import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Check,
  Trash2,
  Calendar,
  Package,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  FolderArchive,
  RefreshCw,
  ShoppingBag,
  CheckCircle2,
  PlusCircle,
} from 'lucide-react';
import { InputItem } from '../types';
import { toBengali } from './CreditScoreGauge';
import { AuthUserData } from './AuthScreens';
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from './LanguageToggle';
import {
  saveInputExpenseToFirestore,
  getFarmerInputExpenses,
  deleteInputExpenseFromFirestore,
  addFarmInputToFirestore,
  getFarmInputsFromFirestore,
  deleteFarmInputFromFirestore,
  saveFarmerCustomInputItems,
  clearAllFarmInputsAndExpenses,
  SavedInputExpenseRecord,
} from '../lib/firebase';

interface Props {
  onBack: () => void;
  user?: AuthUserData | null;
  initialTab?: 'calculator' | 'records';
}

export const InputsScreen: React.FC<Props> = ({
  onBack,
  user,
  initialTab = 'calculator',
}) => {
  const { language, t, formatNumber } = useLanguage();
  // Navigation tabs: 'calculator' (উপকরণ নির্বাচন ও হিসাব) vs 'records' (সংরক্ষিত খরচের খতিয়ান)
  const [activeTab, setActiveTab] = useState<'calculator' | 'records'>(initialTab);

  // Real input items only (NO DEMO DATA)
  const [items, setItems] = useState<InputItem[]>([]);
  const [isLoadingInputs, setIsLoadingInputs] = useState<boolean>(true);

  const [selectedCategory, setSelectedCategory] = useState<string>('সব');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<string>('সার');
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemUnit, setNewItemUnit] = useState<string>('কেজি');
  const [newItemPrice, setNewItemPrice] = useState<string>('');
  const [isAddingItem, setIsAddingItem] = useState<boolean>(false);

  // Cloud saved records state
  const [savedRecords, setSavedRecords] = useState<SavedInputExpenseRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState<boolean>(false);

  const categories = ['সব', 'সার', 'বীজ', 'কীটনাশক', 'ছত্রাকনাশক', 'অন্যান্য'];

  // Farmer identifier
  const farmerPhone =
    user?.phone || localStorage.getItem('krishi_farmer_phone') || '01700000000';
  const farmerName =
    user?.name || localStorage.getItem('krishi_farmer_name') || 'সম্মানিত কৃষক';

  // Load real inputs & saved records on mount
  useEffect(() => {
    // Immediate wipe of any previous test entries ("tpo", "gh", test calculation) to make the screen completely fresh
    const freshDone = localStorage.getItem('krishi_fresh_reset_applied_v4');
    if (!freshDone) {
      clearAllFarmInputsAndExpenses(farmerPhone).then(() => {
        try {
          localStorage.setItem('krishi_fresh_reset_applied_v4', 'true');
        } catch (_) {}
        setItems([]);
        setSavedRecords([]);
        setIsLoadingInputs(false);
        setIsLoadingRecords(false);
      });
    } else {
      loadRealInputs();
      loadSavedRecords();
    }
  }, [farmerPhone]);

  // Fetch only real inputs from Firebase Firestore
  const loadRealInputs = async () => {
    setIsLoadingInputs(true);
    try {
      const realItems = await getFarmInputsFromFirestore(farmerPhone);
      setItems(realItems);
    } catch (err) {
      console.warn('Error fetching real inputs:', err);
    } finally {
      setIsLoadingInputs(false);
    }
  };

  // Fetch saved expense calculations from Cloud Firestore
  const loadSavedRecords = async () => {
    setIsLoadingRecords(true);
    try {
      const records = await getFarmerInputExpenses(farmerPhone);
      setSavedRecords(records);
    } catch (err) {
      console.warn('Error loading saved input expenses:', err);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  // Toggle selection of item for cost calculation
  const toggleSelect = (id: string) => {
    const updated = items.map((it) =>
      it.id === id ? { ...it, selected: !it.selected } : it
    );
    setItems(updated);
    saveFarmerCustomInputItems(updated, farmerPhone);
  };

  // Add real input directly to Firebase Firestore
  const handleAddRealItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newItemName.trim();
    if (!cleanName) return;

    const priceNumber = Number(newItemPrice) || 0;
    const qtyNumber = Number(newItemQty) || 1;

    setIsAddingItem(true);

    const dateStr = new Date().toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const payload = {
      farmerPhone,
      farmerName,
      name: cleanName,
      category: newItemCategory as any,
      quantity: qtyNumber,
      unit: newItemUnit,
      price: priceNumber,
      date: dateStr,
      selected: true,
    };

    try {
      const res = await addFarmInputToFirestore(payload);
      const newlyCreated: InputItem = {
        ...payload,
        id: res.id,
      };

      setItems((prev) => [newlyCreated, ...prev.filter((it) => it.id !== res.id)]);
      setNewItemName('');
      setNewItemPrice('');
      setNewItemQty(1);
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to add input:', err);
      alert('উপকরণ যোগ করার সময় ত্রুটি হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsAddingItem(false);
    }
  };

  // Delete real input from Firebase Firestore
  const handleDeleteRealItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('আপনি কি এই উপকরণটি তালিকা থেকে মুছে ফেলতে চান?')) {
      return;
    }

    setDeletingItemId(id);
    try {
      await deleteFarmInputFromFirestore(id);
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (err) {
      console.error('Failed to delete input:', err);
    } finally {
      setDeletingItemId(null);
    }
  };

  // Filter items by category
  const filteredItems = items.filter(
    (item) => selectedCategory === 'সব' || item.category === selectedCategory
  );

  // Selected items calculation
  const selectedItems = items.filter((it) => it.selected);
  const totalCost = selectedItems.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );

  // Save current real input batch calculation to Firebase Firestore
  const handleSaveToCloud = async () => {
    if (selectedItems.length === 0) {
      alert('অনুগ্রহ করে হিসাব সংরক্ষণের জন্য কমপক্ষে একটি উপকরণ সিলেক্ট করুন।');
      return;
    }

    setIsSaving(true);
    setSaveSuccessMsg(null);

    const dateFormatted = new Date().toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeFormatted = new Date().toLocaleTimeString('bn-BD', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const uniqueCategories = Array.from(
      new Set(selectedItems.map((it) => it.category))
    );
    const title =
      uniqueCategories.length === 1
        ? `${uniqueCategories[0]} খরচ হিসাব`
        : `${uniqueCategories.slice(0, 2).join(' ও ')} হিসাব`;

    const expensePayload = {
      farmerPhone,
      farmerName,
      title,
      totalAmount: totalCost,
      itemCount: selectedItems.length,
      items: selectedItems.map((it) => ({
        id: it.id,
        name: it.name,
        category: it.category,
        quantity: it.quantity,
        unit: it.unit,
        price: it.price,
      })),
      categorySummary: uniqueCategories.join(', '),
      date: `${dateFormatted}, ${timeFormatted}`,
      timestamp: Date.now(),
    };

    try {
      const res = await saveInputExpenseToFirestore(expensePayload);
      if (res.success) {
        setSaveSuccessMsg(`৳ ${toBengali(totalCost)} টাকার হিসাব সফলভাবে ক্লাউড ডাটাবেজে সংরক্ষিত হয়েছে!`);
        await loadSavedRecords();
        setTimeout(() => setSaveSuccessMsg(null), 4500);
      }
    } catch (err) {
      console.error('Error saving input expense:', err);
      alert('সংরক্ষণ করার সময় সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete saved record from Firestore and LocalStorage
  const handleDeleteRecord = async (recordId: string) => {
    if (!window.confirm('আপনি কি এই সংরক্ষিত খরচের হিসাবটি মুছে ফেলতে চান?')) {
      return;
    }

    setDeletingRecordId(recordId);
    try {
      await deleteInputExpenseFromFirestore(recordId);
      setSavedRecords((prev) => prev.filter((r) => r.id !== recordId));
    } catch (err) {
      console.error('Error deleting record:', err);
    } finally {
      setDeletingRecordId(null);
    }
  };

  // Reload an old record's items into current calculator selection
  const handleReloadRecord = (record: SavedInputExpenseRecord) => {
    const recordItemNames = new Set(record.items.map((it) => it.name.toLowerCase()));
    const updated = items.map((it) => ({
      ...it,
      selected: recordItemNames.has(it.name.toLowerCase()),
    }));
    setItems(updated);
    setActiveTab('calculator');
    alert(`'${record.title}' এর উপকরণগুলো আপনার হিসাবে নির্বাচন করা হয়েছে।`);
  };

  // Completely clear all items and records to make the screen fresh
  const handleClearAllAndReset = async () => {
    if (!window.confirm('আপনি কি বর্তমান সকল ইনপুট ও খরচের খতিয়ান মুছে স্ক্রিন সম্পূর্ণ ফ্রেশ করতে চান?')) {
      return;
    }
    setIsClearingAll(true);
    try {
      await clearAllFarmInputsAndExpenses(farmerPhone);
      setItems([]);
      setSavedRecords([]);
      setSaveSuccessMsg('সকল ইনপুট ও খতিয়ান মুছে সম্পূর্ণ ফ্রেশ করা হয়েছে।');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (e) {
      console.error('Error clearing inputs:', e);
    } finally {
      setIsClearingAll(false);
    }
  };

  // Total amount from all saved historical records
  const totalAllSavedCost = savedRecords.reduce(
    (sum, r) => sum + (r.totalAmount || 0),
    0
  );

  return (
    <div id="inputs-management-screen" className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          id="btn-inputs-back"
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
          title={language === 'en' ? 'Back' : 'ফিরে যান'}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h1 className="text-lg font-bold text-stone-900">
            {language === 'en' ? 'Farm Inputs & Ledger' : 'ইনপুট ও উপকরণ ব্যবস্থাপনা'}
          </h1>
          <p className="text-[10px] text-stone-500">
            {language === 'en' ? 'Real Fertilizer, Seed & Pesticide Expenses' : 'আসল সার, বীজ ও বালাইনাশক খরচ খতিয়ান'}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <LanguageToggle />

          {(items.length > 0 || savedRecords.length > 0) && (
            <button
              id="btn-clear-all-inputs"
              type="button"
              onClick={handleClearAllAndReset}
              disabled={isClearingAll}
              className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title={language === 'en' ? 'Clear all and start fresh' : 'সব মুছে ফ্রেশ করুন'}
            >
              {isClearingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>{language === 'en' ? 'Fresh' : 'ফ্রেশ করুন'}</span>
            </button>
          )}

          <button
            id="btn-add-input-item"
            type="button"
            onClick={() => {
              setNewItemCategory(selectedCategory === 'সব' ? 'সার' : selectedCategory);
              setShowAddModal(true);
            }}
            className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
            title={language === 'en' ? 'Add new input' : 'আসল উপকরণ যোগ করুন'}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Navigation Segmented Control: ক্যালকুলেটর বনাম খতিয়ান */}
      <div className="bg-stone-100/90 p-1 rounded-2xl flex items-center border border-stone-200 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('calculator')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'calculator'
              ? 'bg-white text-stone-900 shadow-xs border border-stone-200/60'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
          <span>{language === 'en' ? 'Input Calculator' : 'উপকরণ হিসাব'}</span>
          {items.length > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-800 text-[10px] font-bold">
              {language === 'en' ? items.length : toBengali(items.length)}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('records');
            loadSavedRecords();
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'records'
              ? 'bg-white text-stone-900 shadow-xs border border-stone-200/60'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <FolderArchive className="w-3.5 h-3.5 text-emerald-600" />
          <span>{language === 'en' ? 'Saved Ledger' : 'সংরক্ষিত খতিয়ান'}</span>
          {savedRecords.length > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
              {language === 'en' ? savedRecords.length : toBengali(savedRecords.length)}
            </span>
          )}
        </button>
      </div>

      {/* VIEW 1: REAL INPUT ITEMS & CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Total Selected Cost Summary Card */}
          <div className="bg-emerald-50/80 border border-emerald-300/80 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
                  <span>নির্বাচিত উপকরণের মোট খরচ</span>
                  <span className="text-[11px] text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full font-bold">
                    {toBengali(selectedItems.length)} টি
                  </span>
                </div>
                <div className="text-xl font-black text-emerald-900 mt-0.5">
                  ৳ {toBengali(totalCost)}
                </div>
              </div>

              <button
                id="btn-save-inputs-expense"
                type="button"
                onClick={handleSaveToCloud}
                disabled={isSaving || selectedItems.length === 0}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>সেভ করুন</span>
                  </>
                )}
              </button>
            </div>

            {/* Success Feedback Alert banner */}
            {saveSuccessMsg && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-100/90 border border-emerald-300 text-emerald-950 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('records')}
                  className="text-[11px] font-black text-emerald-900 underline hover:text-emerald-700 whitespace-nowrap cursor-pointer"
                >
                  খতিয়ান দেখুন →
                </button>
              </div>
            )}
          </div>

          {/* Quick link banner to Saved Records if farmer has history */}
          {savedRecords.length > 0 && (
            <div
              onClick={() => setActiveTab('records')}
              className="p-3 bg-white border border-stone-200 rounded-2xl flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-stone-900 block">
                    সংরক্ষিত খতিয়ান রয়েছে ({toBengali(savedRecords.length)} টি)
                  </span>
                  <span className="text-[10px] text-stone-500">
                    পূর্বে সেভ করা আসল খরচের হিসাব দেখতে ট্যাপ করুন
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700">দেখুন →</span>
            </div>
          )}

          {/* Real Input Items List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-stone-800">
                {selectedCategory === 'সব' ? 'উপকরণ তালিকা' : `${selectedCategory} তালিকা`} ({toBengali(filteredItems.length)})
              </span>
              {filteredItems.length > 0 && (
                <span className="text-[11px] text-stone-500">
                  হিসাবে অন্তর্ভুক্ত করতে টিক দিন
                </span>
              )}
            </div>

            {isLoadingInputs ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
                <p className="text-xs text-stone-600">আপনার আসল উপকরণ লোড হচ্ছে...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">
                    কোনো উপকরণ যুক্ত করা নেই
                  </h4>
                  <p className="text-[11px] text-stone-500 max-w-xs mx-auto mt-1 leading-relaxed">
                    আপনার জমিতে ব্যবহৃত বা ক্রয়কৃত আসল সার, বীজ বা বালাইনাশক যোগ করতে নিচের বাটনে চাপ দিন।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewItemCategory(selectedCategory === 'সব' ? 'সার' : selectedCategory);
                    setShowAddModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>নতুন উপকরণ যোগ করুন</span>
                </button>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  id={`input-item-row-${item.id}`}
                  onClick={() => toggleSelect(item.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-xs ${
                    item.selected
                      ? 'bg-white border-emerald-500 ring-1 ring-emerald-400'
                      : 'bg-stone-50 border-stone-200 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox box */}
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                        item.selected
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'border-2 border-stone-300 bg-white'
                      }`}
                    >
                      {item.selected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-stone-900">{item.name}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-stone-500 mt-0.5">
                        <span>
                          পরিমাণ: {toBengali(item.quantity)} {item.unit}
                        </span>
                        <span>•</span>
                        <span>{item.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-black text-stone-900 block">
                        ৳ {toBengali(item.price * item.quantity)}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                        {item.category}
                      </span>
                    </div>

                    {/* Delete item button */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteRealItem(e, item.id)}
                      disabled={deletingItemId === item.id}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      {deletingItemId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: SAVED EXPENSES & RECORDS (যেখানে কৃষক পরবর্তীতে সব হিসাব দেখতে পারবে) */}
      {activeTab === 'records' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Top Summary Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FolderArchive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-900">
                    কৃষকের সংরক্ষিত খরচ খতিয়ান
                  </h3>
                  <p className="text-[10px] text-stone-500">
                    Firebase ক্লাউড ডাটাবেজে স্থায়ীভাবে সংরক্ষিত
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadSavedRecords}
                className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                title="রিফ্রেশ করুন"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRecords ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-stone-600 font-bold block">
                  সর্বমোট সংরক্ষিত খরচ
                </span>
                <span className="text-base font-black text-emerald-900">
                  ৳ {toBengali(totalAllSavedCost)}
                </span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-600 font-bold block">
                  মোট সংরক্ষিত হিসাব
                </span>
                <span className="text-base font-black text-stone-900">
                  {toBengali(savedRecords.length)} টি
                </span>
              </div>
            </div>
          </div>

          {/* List of Saved Records */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-bold text-stone-800">
                সংরক্ষিত ভাউচার ও তারিখসমূহ
              </h4>
              <span className="text-[10px] text-stone-500">
                {savedRecords.length} টি রেকর্ড পাওয়া গেছে
              </span>
            </div>

            {isLoadingRecords && savedRecords.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
                <p className="text-xs text-stone-600">ক্লাউড থেকে খতিয়ান লোড হচ্ছে...</p>
              </div>
            ) : savedRecords.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-3xl border border-stone-200 space-y-3">
                <div className="w-12 h-12 rounded-full bg-stone-200/80 text-stone-500 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-800">
                    এখনো কোনো হিসাব সংরক্ষণ করা হয়নি
                  </h4>
                  <p className="text-[11px] text-stone-500 max-w-xs mx-auto mt-1 leading-relaxed">
                    'উপকরণ হিসাব' ট্যাব থেকে আপনার ব্যবহৃত উপকরণ নির্বাচন করে 'সেভ করুন' বাটনে চাপলে এখানে আজীবন সংরক্ষিত থাকবে।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('calculator')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>উপকরণ হিসাব করুন</span>
                </button>
              </div>
            ) : (
              savedRecords.map((record) => {
                const isExpanded = expandedRecordId === record.id;
                const isDeleting = deletingRecordId === record.id;

                return (
                  <div
                    key={record.id}
                    className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs transition-all hover:border-emerald-300"
                  >
                    {/* Record Header */}
                    <div className="p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-stone-900">
                              {record.title || 'কৃষি উপকরণ হিসাব'}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                              {toBengali(record.itemCount || record.items?.length || 0)} টি উপকরণ
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] text-stone-500 mt-1">
                            <Calendar className="w-3 h-3 text-stone-400" />
                            <span>{record.date}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-emerald-800 block">
                            ৳ {toBengali(record.totalAmount)}
                          </span>
                          <span className="text-[9px] font-bold text-stone-400">
                            মোট খরচ
                          </span>
                        </div>
                      </div>

                      {/* Summary pill tags */}
                      {record.categorySummary && (
                        <div className="mt-2 text-[10px] text-stone-600 bg-stone-50 px-2 py-1 rounded-lg border border-stone-100 flex items-center justify-between">
                          <span>উপাদান: {record.categorySummary}</span>
                          <span className="text-emerald-700 font-bold">ক্লাউডে সুরক্ষিত</span>
                        </div>
                      )}

                      {/* Action buttons bar */}
                      <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedRecordId(isExpanded ? null : record.id)
                          }
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExpanded ? 'বিবরণ লুকান' : 'বিস্তারিত উপকরণ দেখুন'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleReloadRecord(record)}
                            className="text-[11px] font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                            title="এই উপকরণগুলো ক্যালকুলেটরে লোড করুন"
                          >
                            পুনরায় লোড
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(record.id)}
                            disabled={isDeleting}
                            className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="খতিয়ান থেকে মুছুন"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable itemized table */}
                    {isExpanded && (
                      <div className="bg-stone-50/90 border-t border-stone-100 p-3 space-y-2 animate-in fade-in duration-100">
                        <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                          অন্তর্ভুক্ত উপকরণের বিস্তারিত:
                        </div>
                        <div className="space-y-1.5">
                          {record.items?.map((it, idx) => (
                            <div
                              key={idx}
                              className="p-2 bg-white rounded-xl border border-stone-200/80 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-stone-800 block">
                                  {it.name}
                                </span>
                                <span className="text-[10px] text-stone-500">
                                  {it.category} • পরিমাণ: {toBengali(it.quantity)} {it.unit}
                                </span>
                              </div>
                              <span className="font-black text-stone-900">
                                ৳ {toBengali(it.price * it.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Add New Real Input Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-xl animate-in zoom-in duration-150">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                নতুন কৃষি উপকরণ যোগ করুন
              </h3>
              <p className="text-[11px] text-stone-500">
                আপনার আসল সার, বীজ বা বালাইনাশকের বিবরণ দিন
              </p>
            </div>

            <form onSubmit={handleAddRealItem} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ক্যাটাগরি
                </label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="সার">সার (Fertilizer)</option>
                  <option value="বীজ">বীজ (Seed)</option>
                  <option value="কীটনাশক">কীটনাশক (Insecticide)</option>
                  <option value="ছত্রাকনাশক">ছত্রাকনাশক (Fungicide)</option>
                  <option value="অন্যান্য">অন্যান্য (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  উপকরণের নাম
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ডিএপি সার, ব্রি ধান ৪৯ বা কার্বেন্ডাজিম"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    পরিমাণ
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    একক
                  </label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="কেজি">কেজি (Kg)</option>
                    <option value="বস্তা">বস্তা (Bag)</option>
                    <option value="প্যাকেট">প্যাকেট (Packet)</option>
                    <option value="লিটার">লিটার (Liter)</option>
                    <option value="গ্রাম">গ্রাম (Gram)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  একক মূল্য (টাকা)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="যেমন: ১২০০"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isAddingItem}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold hover:bg-stone-200 transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isAddingItem}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  {isAddingItem ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>যোগ হচ্ছে...</span>
                    </>
                  ) : (
                    <span>যোগ করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
