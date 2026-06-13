"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Image from "next/image";
import { AlertTriangle, CheckCircle2, Edit2, Info, Search, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { formatDate } from "@/lib/utils";
import {
  getMediaPlacementBadgeLabel,
  isProductShowcasePlacement,
  isProminentMediaPlacement,
  sortMediaAssetsByPlacementUse,
  convertStoredOrderToUiPosition,
  convertUiPositionToStoredOrder,
  type MediaPlacementWarning,
} from "@/lib/admin/media-placement-utils";
import type { MediaLibraryAsset } from "@/lib/admin/site-management";
import { updateMediaAsset, deleteMediaAsset } from "@/app/admin/(protected)/media/actions";

// We mirror the server type for categories to ensure perfect alignment
type GalleryCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
};

type MediaPlacementDefinition = {
  description: string;
  key: string;
  label: string;
  pageKey: string;
  sectionKey: string;
  slotKey: string;
};

type MediaLibraryManagerProps = {
  categories: GalleryCategoryRow[];
  placementWarnings: MediaPlacementWarning[];
  websiteAssets: MediaLibraryAsset[];
  placements: MediaPlacementDefinition[];
};

export function MediaLibraryManager({
  categories,
  placementWarnings,
  websiteAssets,
  placements,
}: Readonly<MediaLibraryManagerProps>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedAsset, setSelectedAsset] = useState<MediaLibraryAsset | null>(null);

  // Unsaved changes tracking state
  const [title, setTitle] = useState("");
  const [altText, setAltText] = useState("");
  const [featured, setFeatured] = useState(false);
  const [categoriesSelected, setCategoriesSelected] = useState<Set<string>>(new Set());
  const [placementsSelected, setPlacementsSelected] = useState<Set<string>>(new Set());
  const [categoryOrders, setCategoryOrders] = useState<Record<string, number>>({});
  const [placementOrders, setPlacementOrders] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSavingOrDeleting, setIsSavingOrDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const dialogId = useId();
  const sortedWebsiteAssets = useMemo(
    () => sortMediaAssetsByPlacementUse(websiteAssets),
    [websiteAssets],
  );
  const hasPlacementWarnings = placementWarnings.length > 0;

  // Calculate dynamic asset category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: sortedWebsiteAssets.length };
    
    categories.forEach((cat) => {
      counts[cat.id] = sortedWebsiteAssets.filter((asset) =>
        asset.categoryAssignments.some((a) => a.categoryId === cat.id)
      ).length;
    });
    
    return counts;
  }, [categories, sortedWebsiteAssets]);

  // Handle client-side search and category filtering
  const filteredAssets = useMemo(() => {
    return sortedWebsiteAssets.filter((asset) => {
      // Category filter
      if (activeCategory !== "All") {
        const matchesCategory = asset.categoryAssignments.some(
          (a) => a.categoryId === activeCategory
        );
        if (!matchesCategory) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = asset.caption?.toLowerCase().includes(query);
        const matchesFilename = asset.filename?.toLowerCase().includes(query);
        const matchesAlt = asset.altText?.toLowerCase().includes(query);
        
        return matchesTitle || matchesFilename || matchesAlt;
      }

      return true;
    });
  }, [sortedWebsiteAssets, activeCategory, searchQuery]);

  // Synchronize form editing states when selected asset changes
  useEffect(() => {
    if (selectedAsset) {
      setTitle(selectedAsset.caption || "");
      setAltText(selectedAsset.altText || "");
      setFeatured(selectedAsset.featured || false);
      setCategoriesSelected(new Set(selectedAsset.categoryAssignments.map((a) => a.categoryId)));
      setPlacementsSelected(new Set(selectedAsset.pageAssignments.map((a) => a.placementKey)));

      const catOrders: Record<string, number> = {};
      categories.forEach((cat) => {
        const existing = selectedAsset.categoryAssignments.find((a) => a.categoryId === cat.id);
        catOrders[cat.id] = existing ? existing.displayOrder : cat.display_order;
      });
      setCategoryOrders(catOrders);

      const pageOrders: Record<string, number> = {};
      placements.forEach((placement, index) => {
        const existing = selectedAsset.pageAssignments.find((a) => a.placementKey === placement.key);
        pageOrders[placement.key] = existing ? existing.displayOrder : (index + 1) * 10;
      });
      setPlacementOrders(pageOrders);

      setHasChanges(false);
      setIsSavingOrDeleting(false);
      setActionMessage(null);
    }
  }, [selectedAsset, categories, placements]);

  useEffect(() => {
    if (!selectedAsset) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedAsset]);

  // Detect unsaved changes by comparing current state to original asset details
  useEffect(() => {
    if (!selectedAsset) {
      setHasChanges(false);
      return;
    }

    const origCategories = new Set(selectedAsset.categoryAssignments.map((a) => a.categoryId));
    const origPlacements = new Set(selectedAsset.pageAssignments.map((a) => a.placementKey));

    const categoriesChanged =
      categoriesSelected.size !== origCategories.size ||
      [...categoriesSelected].some((id) => !origCategories.has(id));

    const placementsChanged =
      placementsSelected.size !== origPlacements.size ||
      [...placementsSelected].some((key) => !origPlacements.has(key));

    let ordersChanged = false;
    selectedAsset.categoryAssignments.forEach((a) => {
      if (categoryOrders[a.categoryId] !== a.displayOrder) {
        ordersChanged = true;
      }
    });
    selectedAsset.pageAssignments.forEach((a) => {
      if (placementOrders[a.placementKey] !== a.displayOrder) {
        ordersChanged = true;
      }
    });

    const isDifferent =
      title !== (selectedAsset.caption || "") ||
      altText !== (selectedAsset.altText || "") ||
      featured !== (selectedAsset.featured || false) ||
      categoriesChanged ||
      placementsChanged ||
      ordersChanged;

    setHasChanges(isDifferent);
  }, [
    title,
    altText,
    featured,
    categoriesSelected,
    placementsSelected,
    categoryOrders,
    placementOrders,
    selectedAsset,
  ]);

  const handleCloseDrawer = () => {
    if (isSavingOrDeleting) {
      return;
    }

    if (hasChanges) {
      const confirmClose = window.confirm(
        "You have unsaved changes. Are you sure you want to close and discard them?"
      );
      if (!confirmClose) return;
    }
    setSelectedAsset(null);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setCategoriesSelected((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handlePlacementToggle = (placementKey: string) => {
    setPlacementsSelected((prev) => {
      const next = new Set(prev);
      if (next.has(placementKey)) {
        next.delete(placementKey);
      } else {
        next.add(placementKey);
      }
      return next;
    });
  };

  const handleCategoryOrderChange = (categoryId: string, val: number) => {
    setCategoryOrders((prev) => ({ ...prev, [categoryId]: val }));
  };

  const handlePlacementOrderChange = (placementKey: string, val: number) => {
    setPlacementOrders((prev) => ({ ...prev, [placementKey]: val }));
  };

  const handleSaveSubmit = () => {
    setIsSavingOrDeleting(true);
    setActionMessage("Saving changes...");
  };

  const handleDeleteSubmit = () => {
    setIsSavingOrDeleting(true);
    setActionMessage("Deleting photo...");
  };

  return (
    <div className="space-y-6">
      <div
        className={`rounded-[1.6rem] border px-4 py-4 sm:px-5 ${
          hasPlacementWarnings
            ? "border-rose-200 bg-rose-50"
            : "border-emerald-200 bg-emerald-50"
        }`}
      >
        <div className="flex gap-3">
          <span
            className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              hasPlacementWarnings
                ? "bg-rose-100 text-rose-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
            aria-hidden="true"
          >
            {hasPlacementWarnings ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0 space-y-2 flex-1">
            <p className="text-sm font-semibold text-charcoal">
              {hasPlacementWarnings
                ? "Major website image placements need attention."
                : "All major website image placements are assigned."}
            </p>
            {hasPlacementWarnings ? (
              <ul className="space-y-2.5">
                {placementWarnings.map((warning, index) => {
                  const isHigh = warning.severity === "high";
                  return (
                    <li
                      key={`${warning.placementKey}-${index}`}
                      className={`text-sm leading-6 flex flex-col sm:flex-row sm:items-start gap-2 rounded-xl p-3 border ${
                        isHigh
                          ? "bg-rose-100/50 border-rose-200 text-rose-900"
                          : "bg-amber-100/50 border-amber-200 text-amber-900"
                      }`}
                    >
                      <span className="flex-1">
                        <strong className="font-semibold">{warning.label}:</strong> {warning.message}
                      </span>
                      {warning.type === "stale" && warning.assignmentId ? (
                        <form action={async (formData) => {
                          const { acknowledgeStalePlacement } = await import("@/app/admin/(protected)/media/actions");
                          await acknowledgeStalePlacement(formData);
                        }}>
                          <input type="hidden" name="assignmentId" value={warning.assignmentId} />
                          <input type="hidden" name="redirectTo" value="/admin/media" />
                          <Button type="submit" variant="secondary" size="sm" className="h-8 shrink-0 bg-white shadow-sm border border-amber-300 text-amber-900 hover:bg-amber-50">
                            Acknowledge
                          </Button>
                        </form>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm leading-6 text-charcoal/70">
                Product heroes and homepage product-card images have selected
                website photos.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Search and Dynamic Category Filter Chips */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-4 flex items-center text-charcoal/40" aria-hidden="true">
            <Search className="h-4 w-4" />
          </span>
          <Input
            type="search"
            placeholder="Search by title, Google description, or filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 bg-white border-charcoal/10 rounded-full"
          />
        </div>

        {/* Dynamic Category Selector */}
        <div className="flex flex-wrap gap-1.5 px-0.5">
          <button
            type="button"
            onClick={() => setActiveCategory("All")}
            className={`inline-flex items-center justify-center gap-1.5 shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition border min-h-[2.25rem] ${
              activeCategory === "All"
                ? "bg-charcoal border-charcoal text-ivory shadow-sm"
                : "bg-white/80 border-charcoal/10 text-charcoal/80 hover:border-charcoal/30"
            }`}
          >
            <span>All</span>
            <span className={`text-[10px] font-bold ${activeCategory === "All" ? "text-ivory/60" : "text-charcoal/40"}`}>
              ({categoryCounts.All})
            </span>
          </button>
          {categories.filter(c => c.slug !== 'celebration').map((cat) => {
            const count = categoryCounts[cat.id] ?? 0;
            if (count === 0) return null; // Only show active categories with assets
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center justify-center gap-1.5 shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition border min-h-[2.25rem] ${
                  isActive
                    ? "bg-charcoal border-charcoal text-ivory shadow-sm"
                    : "bg-white/80 border-charcoal/10 text-charcoal/80 hover:border-charcoal/30"
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] font-bold ${isActive ? "text-ivory/60" : "text-charcoal/40"}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Compact Photo Cards */}
      {filteredAssets.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredAssets.map((asset) => {
            // Find active categories names to print on card
            const activeCats = categories.filter((cat) =>
              asset.categoryAssignments.some((a) => a.categoryId === cat.id)
            );
            const prominentPlacement = asset.pageAssignments.find((assignment) =>
              isProminentMediaPlacement(assignment.placementKey),
            );
            const productShowcasePlacement = asset.pageAssignments.find((assignment) =>
              isProductShowcasePlacement(assignment.placementKey),
            );
            const galleryPlacement = asset.pageAssignments.find(
              (assignment) => assignment.placementKey === "gallery.grid",
            );
            const primaryPlacementLabel = prominentPlacement
              ? getMediaPlacementBadgeLabel(prominentPlacement.placementKey, placements)
              : productShowcasePlacement
                ? getMediaPlacementBadgeLabel(productShowcasePlacement.placementKey, placements)
                : galleryPlacement
                  ? "Full gallery"
                  : null;

            return (
              <article
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-charcoal/8 bg-paper transition-all duration-200 hover:-translate-y-1 hover:shadow-soft cursor-pointer"
              >
                {/* Thumbnail Preview */}
                <div className="relative aspect-square w-full overflow-hidden bg-ivory/40">
                  {asset.previewUrl ? (
                    <Image
                      src={asset.previewUrl}
                      alt={asset.altText || asset.caption || asset.filename}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                      unoptimized
                      className="object-cover transition duration-300 group-hover:scale-102"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-charcoal/5 px-2 text-center text-[10px] text-charcoal/58">
                      No Image
                    </div>
                  )}

                  {/* Badges on Thumbnail Overlay */}
                  <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1 items-start justify-between pointer-events-none">
                    {primaryPlacementLabel ? (
                      <span
                        className={`inline-flex max-w-[9rem] items-center gap-1 truncate rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] shadow-sm ${
                          prominentPlacement
                            ? "bg-gold text-charcoal"
                            : "bg-white/88 text-charcoal"
                        }`}
                      >
                        <Sparkles className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{primaryPlacementLabel}</span>
                      </span>
                    ) : asset.featured ? (
                      <span className="inline-flex max-w-[8rem] items-center gap-1 truncate rounded-full bg-white/88 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-charcoal shadow-sm">
                        Fallback highlight
                      </span>
                    ) : <span />}

                    {/* Edit hover overlay icon */}
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-charcoal/10 bg-white/80 text-charcoal opacity-0 transition group-hover:opacity-100 shadow-sm">
                      <Edit2 className="h-3 w-3" />
                    </span>
                  </div>
                </div>

                {/* Info and Naming Panel */}
                <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-charcoal line-clamp-1 group-hover:text-gold transition">
                      {asset.caption || asset.filename || "Untitled Photo"}
                    </h3>
                    <p className="text-[10px] text-charcoal/52 truncate">
                      {asset.filename}
                    </p>
                  </div>

                  {/* Primary Category Tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {prominentPlacement ? (
                      <span className="rounded-full bg-gold/18 border border-gold/28 px-1.5 py-0.5 text-[8.5px] text-charcoal font-semibold truncate max-w-[112px]">
                        Used on site
                      </span>
                    ) : productShowcasePlacement ? (
                      <span className="rounded-full bg-charcoal/5 border border-charcoal/8 px-1.5 py-0.5 text-[8.5px] text-charcoal/66 font-semibold truncate max-w-[112px]">
                        Product examples
                      </span>
                    ) : null}
                    {activeCats.length > 0 ? (
                      activeCats.slice(0, 2).map((cat) => (
                        <span
                          key={cat.id}
                          className="rounded-full bg-ivory border border-charcoal/8 px-1.5 py-0.5 text-[8.5px] text-charcoal/60 font-medium truncate max-w-[80px]"
                        >
                          {cat.name}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-rose/5 border border-rose/10 px-1.5 py-0.5 text-[8.5px] text-rose-700/60 font-medium select-none">
                        Unassigned
                      </span>
                    )}
                    {activeCats.length > 2 && (
                      <span className="rounded-full bg-charcoal/5 border border-charcoal/8 px-1.5 py-0.5 text-[8.5px] text-charcoal/60 font-medium select-none">
                        +{activeCats.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center rounded-2xl border border-dashed border-charcoal/10 bg-ivory/20">
          <p className="text-sm text-charcoal/52">No photos match your active search or category filter.</p>
        </div>
      )}

      {/* Selected Photo Slide Drawer Overlay */}
      {selectedAsset && (
        <div className="fixed inset-0 z-[70] bg-charcoal/20 backdrop-blur-[2px]">
          {/* Backdrop layer */}
          <button
            type="button"
            aria-label="Close selected photo editor"
            className="absolute inset-0"
            onClick={handleCloseDrawer}
            disabled={isSavingOrDeleting}
          />

          <div className="relative z-10 flex h-[100dvh] w-full justify-end p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:p-0">
          {/* Sliding Side Drawer panel */}
          <div
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-label={`Edit Photo: ${selectedAsset.filename}`}
            className="flex h-full max-h-[calc(100dvh_-_env(safe-area-inset-bottom)_-_1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-[1.55rem] border border-charcoal/10 bg-ivory/96 shadow-[0_24px_72px_rgba(53,37,29,0.18)] backdrop-blur-xl transition-transform duration-300 md:max-h-none md:rounded-none md:border-y-0 md:border-r-0"
          >
            {/* Drawer Header */}
            <div className="shrink-0 border-b border-charcoal/8 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Website Photos Manager
                </p>
                <h2 className="mt-1 truncate font-serif text-[1.65rem] tracking-tight text-charcoal sm:text-2xl">
                  Edit Photo Settings
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close drawer"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-charcoal/10 bg-white/82 text-charcoal transition hover:border-charcoal/20 hover:bg-white focus-visible:outline focus-visible:outline-gold/50 disabled:cursor-not-allowed disabled:opacity-45"
                onClick={handleCloseDrawer}
                disabled={isSavingOrDeleting}
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5 sm:py-6"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <form
                action={updateMediaAsset}
                id="update-asset-form"
                className="space-y-6 pb-32"
                onSubmit={handleSaveSubmit}
              >
                <input type="hidden" name="mediaAssetId" value={selectedAsset.id} />
                <input type="hidden" name="redirectTo" value="/admin/media" />

                {/* Section 1: Basic Details */}
                <div className="space-y-4 rounded-2xl border border-charcoal/10 bg-white p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-charcoal/50 border-b border-charcoal/5 pb-2">
                    1. Basic Details
                  </h3>

                  {/* Read-only Current Context Section */}
                  <div className="mb-4 rounded-xl border border-gold/20 bg-gold/5 p-3 text-sm text-charcoal/80 space-y-2">
                    <p className="font-semibold text-charcoal flex items-center gap-1.5"><Info className="h-4 w-4 text-gold"/> Where this photo currently appears</p>
                    {selectedAsset.pageAssignments.length > 0 || selectedAsset.categoryAssignments.length > 0 || selectedAsset.featured ? (
                      <ul className="list-disc pl-5 space-y-1 mt-1 text-charcoal/70">
                        {selectedAsset.pageAssignments.map((assignment) => (
                          <li key={assignment.placementKey}>
                            {getMediaPlacementBadgeLabel(assignment.placementKey, placements)}
                          </li>
                        ))}
                        {selectedAsset.categoryAssignments.map((catAssignment) => {
                          const catName = categories.find(c => c.id === catAssignment.categoryId)?.name ?? "Unknown Category";
                          return <li key={catAssignment.categoryId}>Public Gallery ({catName})</li>;
                        })}
                        {selectedAsset.featured && <li>Highlighted generally (Featured)</li>}
                      </ul>
                    ) : (
                      <p className="pl-1 italic">This photo is currently unassigned and hidden.</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="drawer-caption">Photo Title</Label>
                    <Input
                      id="drawer-caption"
                      name="caption"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Elegant White Wedding Cake"
                    />
                  </div>

                  <div>
                    <Label htmlFor="drawer-alt">Google / Accessibility Description</Label>
                    <Textarea
                      id="drawer-alt"
                      name="altText"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      placeholder="Describe the image so Google and visually impaired clients can read it."
                      className="min-h-16"
                    />
                  </div>

                  <label className="flex items-center gap-3 rounded-xl border border-charcoal/8 bg-ivory/40 px-4 py-3 text-sm text-charcoal/74 cursor-pointer hover:bg-ivory/60 transition">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="h-4 w-4 rounded border-charcoal/20 text-charcoal focus:ring-gold/20"
                    />
                    <span>
                      <span className="block font-medium text-charcoal">Fallback homepage/gallery highlight</span>
                      <span className="mt-1 block text-xs leading-5 text-charcoal/58">
                        Major site placements are controlled in Website Sections below.
                      </span>
                    </span>
                  </label>
                </div>

                {/* Section 2: Where This Photo Shows */}
                <div className="space-y-5 rounded-2xl border border-charcoal/10 bg-white p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-charcoal/50 border-b border-charcoal/5 pb-2">
                    2. Where This Photo Shows
                  </h3>

                  {/* Categories checkboxes */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-charcoal/45">
                      Gallery categories
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {categories.filter(c => c.slug !== 'celebration').map((cat) => {
                        const isChecked = categoriesSelected.has(cat.id);
                        return (
                          <label
                            key={cat.id}
                            className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-xs text-charcoal/74 cursor-pointer hover:bg-ivory/20 transition ${
                              isChecked ? "border-charcoal/20 bg-ivory/10" : "border-charcoal/8 bg-white"
                            }`}
                          >
                            <input
                              type="checkbox"
                              name="galleryCategoryIds"
                              value={cat.id}
                              checked={isChecked}
                              onChange={() => handleCategoryToggle(cat.id)}
                              className="mt-0.5 h-3.5 w-3.5 rounded border-charcoal/20 text-charcoal focus:ring-gold/20"
                            />
                            <div>
                              <span className="block font-semibold text-charcoal">{cat.name}</span>
                              {cat.description && (
                                <span className="block text-[10px] text-charcoal/52 line-clamp-1">
                                  {cat.description}
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Placements checkboxes */}
                  <div className="space-y-3 border-t border-charcoal/5 pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-charcoal/45">
                      Website sections and placements
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {placements.map((placement) => {
                        const isChecked = placementsSelected.has(placement.key);
                        return (
                          <label
                            key={placement.key}
                            className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-xs text-charcoal/74 cursor-pointer hover:bg-ivory/20 transition ${
                              isChecked ? "border-charcoal/20 bg-ivory/10" : "border-charcoal/8 bg-white"
                            }`}
                          >
                            <input
                              type="checkbox"
                              name="pagePlacementKeys"
                              value={placement.key}
                              checked={isChecked}
                              onChange={() => handlePlacementToggle(placement.key)}
                              className="mt-0.5 h-3.5 w-3.5 rounded border-charcoal/20 text-charcoal focus:ring-gold/20"
                            />
                            <div>
                              <span className="block font-semibold text-charcoal">{placement.label}</span>
                              <span className="block text-[10px] text-charcoal/52">
                                {placement.description}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Section 3: Display Order */}
                <div className="space-y-4 rounded-2xl border border-charcoal/10 bg-white p-5">
                  <div className="flex items-center justify-between border-b border-charcoal/5 pb-2">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-charcoal/50">
                      3. Display Order
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[10px] text-charcoal/58 bg-ivory px-2 py-0.5 rounded-md font-medium">
                      <Info className="h-3 w-3" /> Lower numbers show first
                    </span>
                  </div>

                  <p className="text-xs text-charcoal/60 leading-normal">
                    Determine sorting priority. Assign order priorities below for the specific views this photo is enabled on.
                  </p>

                  <div className="space-y-3">
                    {/* Active Categories ordering */}
                    {categories.filter((cat) => categoriesSelected.has(cat.id)).map((cat) => {
                      const storedVal = categoryOrders[cat.id] ?? cat.display_order;
                      const assignedAssetsCount = websiteAssets.filter((asset) =>
                        asset.categoryAssignments.some((ca) => ca.categoryId === cat.id)
                      ).length;
                      const hasThisAsset = selectedAsset.categoryAssignments.some((ca) => ca.categoryId === cat.id);
                      const totalCount = hasThisAsset ? assignedAssetsCount : assignedAssetsCount + 1;
                      const uiPosition = convertStoredOrderToUiPosition(storedVal, totalCount);

                      return (
                        <div
                          key={`order-cat-${cat.id}`}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-charcoal/8 bg-ivory/30 px-3 py-2.5 text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-charcoal block truncate">Position in {cat.name}</span>
                            <span className="text-[10px] text-charcoal/50 block">Shows as item {uiPosition} of {totalCount} in the gallery</span>
                          </div>
                          {totalCount <= 1 ? (
                            <span className="text-xs text-charcoal/50 italic py-1">
                              Only one image in this set — no ordering needed.
                            </span>
                          ) : (
                            <div className="flex items-center gap-3">
                              <input
                                id={`categoryOrder-${cat.id}`}
                                type="range"
                                min="1"
                                max={totalCount}
                                step="1"
                                value={uiPosition}
                                onChange={(e) => handleCategoryOrderChange(cat.id, convertUiPositionToStoredOrder(parseInt(e.target.value) || 1))}
                                className="accent-charcoal flex-1 sm:w-32"
                              />
                              <input
                                type="hidden"
                                name={`categoryOrder.${cat.id}`}
                                value={storedVal}
                              />
                              <span className="w-16 text-right tabular-nums text-charcoal/70 font-medium">
                                {uiPosition} of {totalCount}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Active Sections ordering */}
                    {placements.filter((placement) => placementsSelected.has(placement.key) && !isProminentMediaPlacement(placement.key)).map((placement) => {
                      const storedVal = placementOrders[placement.key] ?? 10;
                      const assignedAssetsCount = websiteAssets.filter((asset) =>
                        asset.pageAssignments.some((pa) => pa.placementKey === placement.key)
                      ).length;
                      const hasThisAsset = selectedAsset.pageAssignments.some((pa) => pa.placementKey === placement.key);
                      const totalCount = hasThisAsset ? assignedAssetsCount : assignedAssetsCount + 1;
                      const uiPosition = convertStoredOrderToUiPosition(storedVal, totalCount);

                      return (
                        <div
                          key={`order-placement-${placement.key}`}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-charcoal/8 bg-ivory/30 px-3 py-2.5 text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-charcoal block truncate">Position in {placement.label}</span>
                            <span className="text-[10px] text-charcoal/50 block">Shows as item {uiPosition} of {totalCount} in this section</span>
                          </div>
                          {totalCount <= 1 ? (
                            <span className="text-xs text-charcoal/50 italic py-1">
                              Only one image in this set — no ordering needed.
                            </span>
                          ) : (
                            <div className="flex items-center gap-3">
                              <input
                                id={`placementOrder-${placement.key}`}
                                type="range"
                                min="1"
                                max={totalCount}
                                step="1"
                                value={uiPosition}
                                onChange={(e) => handlePlacementOrderChange(placement.key, convertUiPositionToStoredOrder(parseInt(e.target.value) || 1))}
                                className="accent-charcoal flex-1 sm:w-32"
                              />
                              <input
                                type="hidden"
                                name={`placementOrder.${placement.key}`}
                                value={storedVal}
                              />
                              <span className="w-16 text-right tabular-nums text-charcoal/70 font-medium">
                                {uiPosition} of {totalCount}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Fallback when no orderable categories or placements are selected */}
                    {categories.filter((cat) => categoriesSelected.has(cat.id)).length === 0 &&
                      placements.filter((placement) => placementsSelected.has(placement.key) && !isProminentMediaPlacement(placement.key)).length === 0 && (
                        <p className="text-xs text-center text-charcoal/50 bg-ivory/50 border border-charcoal/10 py-3 rounded-xl select-none">
                          Enable at least one multi-image Category or Section above to configure its display order.
                        </p>
                      )}
                  </div>
                </div>

                {/* Section 4: Advanced */}
                <details className="group rounded-2xl border border-charcoal/10 bg-white/70 p-4 shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-[0.15em] text-charcoal/50 [&::-webkit-details-marker]:hidden select-none">
                    <span>4. Advanced / Technical Details</span>
                    <span className="text-[10px] text-gold font-bold group-open:hidden">Show</span>
                    <span className="text-[10px] text-charcoal/40 font-bold hidden group-open:inline">Hide</span>
                  </summary>
                  <div className="mt-4 space-y-4 pt-3 border-t border-charcoal/5 text-xs leading-normal">
                    <div className="rounded-xl border border-charcoal/8 bg-white p-3 space-y-2 text-charcoal/66">
                      <p>
                        <span className="font-semibold text-charcoal">Filename:</span> {selectedAsset.filename}
                      </p>
                      <p>
                        <span className="font-semibold text-charcoal">Storage Path:</span> {selectedAsset.bucket}/{selectedAsset.id}
                      </p>
                      <p>
                        <span className="font-semibold text-charcoal">Library Classification:</span> Website Photo
                      </p>
                      <p>
                        <span className="font-semibold text-charcoal">Added Date:</span> {formatDate(selectedAsset.createdAt)}
                      </p>
                      <p>
                        <span className="font-semibold text-charcoal">Upload Source:</span> {selectedAsset.sourceKind || "upload"}
                      </p>
                    </div>

                    {/* Dangerous Delete Row */}
                    <div className="rounded-xl border border-rose/12 bg-rose/5 p-4 space-y-3">
                      <div>
                        <h4 className="font-semibold text-rose-800">Danger Zone</h4>
                        <p className="text-[11px] text-rose-700/80 leading-normal">
                          Removing this photo deletes it from the Supabase bucket and strips all category and section assignments permanently.
                        </p>
                      </div>
                      <ConfirmSubmitButton
                        type="submit"
                        form="delete-asset-form"
                        variant="secondary"
                        size="sm"
                        className="min-h-11 rounded-full border-rose/30 bg-white px-4 text-rose-700 hover:border-rose/45 hover:bg-rose/10 disabled:cursor-not-allowed disabled:opacity-45"
                        confirmMessage="Delete this photo permanently from the database and storage? This cannot be undone."
                        disabled={isSavingOrDeleting}
                      >
                        Delete Photo
                      </ConfirmSubmitButton>
                    </div>
                  </div>
                </details>
              </form>
            </div>

            {/* Fixed Drawer Footer (Crucial for Mobile - stays visible above bottom nav) */}
            <div className="shrink-0 border-t border-charcoal/8 bg-white/94 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-8px_32px_rgba(53,37,29,0.06)] sm:px-5 sm:py-4 sm:pb-4">
              <div className="mb-2 min-h-5 text-xs text-charcoal/58" aria-live="polite">
                {actionMessage ?? (hasChanges ? "Unsaved changes" : "No changes")}
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseDrawer}
                  className="h-11 px-5 rounded-full border-charcoal/12 hover:bg-charcoal/5 disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={isSavingOrDeleting}
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  form="update-asset-form"
                  className="h-11 px-6 rounded-full bg-charcoal hover:bg-charcoal/90 text-white font-medium disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={!hasChanges || isSavingOrDeleting}
                >
                  {isSavingOrDeleting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
            <form
              action={deleteMediaAsset}
              id="delete-asset-form"
              className="hidden"
              onSubmit={handleDeleteSubmit}
            >
              <input type="hidden" name="mediaAssetId" value={selectedAsset.id} />
              <input type="hidden" name="redirectTo" value="/admin/media" />
            </form>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
