'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'react-hot-toast';
import { Gem, PlusCircle, UploadCloud, X, ImageIcon, FileText, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateListingForm {
  title: string;
  description: string;
  categoryId: string;
  gemType: string;
  variety: string;
  originCountry: string;
  caratWeight: number;
  color: string;
  clarity: string;
  cut: string;
  shape: string;
  isCertified: boolean;
  listingType: 'FIXED_PRICE' | 'NEGOTIABLE';
  fixedPrice?: number;
  negotiablePrice?: number;
  // Certificate fields
  labName?: string;
  certificateNumber?: string;
}

interface UploadedImage {
  file: File;
  preview: string;
  url?: string; // MinIO public URL after upload
  uploading?: boolean;
}

export default function CreateListingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPreview, setCertPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect if not authenticated or not a seller
  useEffect(() => {
    if (isMounted && !isAuthLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login?redirect=/seller/listings/create');
      } else if (user?.role === 'BUYER') {
        toast.error('You must complete onboarding as a seller to create listings');
        router.push('/seller/onboarding');
      }
    }
  }, [isMounted, isAuthLoading, isAuthenticated, user, router]);

  // Fetch categories
  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.listings.getCategories();
      return res.data.data;
    },
    enabled: isMounted,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateListingForm>({
    defaultValues: {
      listingType: 'FIXED_PRICE',
      isCertified: false,
      caratWeight: 1.0,
    },
  });

  const listingType = watch('listingType');
  const isCertified = watch('isCertified');

  // ---- Image handling ----
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = 5 - images.length;
    if (remaining <= 0) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const validFiles = files.slice(0, remaining).filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error(`${file.name}: Only JPG, PNG or WebP allowed`);
        return false;
      }
      return true;
    });

    const newImages = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);

    // Reset input
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const updated = [...prev];
      const target = updated[index];
      if (target) {
        URL.revokeObjectURL(target.preview);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  // ---- Certificate image handling ----
  const handleCertSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Certificate image must be smaller than 10MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      toast.error('Only JPG, PNG, WebP or PDF allowed for certificates');
      return;
    }

    setCertFile(file);
    if (file.type.startsWith('image/')) {
      setCertPreview(URL.createObjectURL(file));
    } else {
      setCertPreview(null);
    }
  };

  const removeCert = () => {
    if (certPreview) URL.revokeObjectURL(certPreview);
    setCertFile(null);
    setCertPreview(null);
    if (certInputRef.current) certInputRef.current.value = '';
  };

  // ---- Upload file to MinIO ----
  const uploadFileToMinio = async (file: File): Promise<string> => {
    const res = await api.listings.presignedUrl({
      fileName: file.name,
      contentType: file.type,
    });
    const { uploadUrl, publicUrl } = res.data.data;

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error('MinIO upload failed:', uploadRes.status, errorText);
      throw new Error(`Upload failed (${uploadRes.status}): ${errorText.substring(0, 100)}`);
    }

    return publicUrl;
  };

  // ---- Listing creation mutation ----
  const createMutation = useMutation({
    mutationFn: async (data: CreateListingForm) => {
      if (images.length === 0) {
        throw new Error('Please upload at least 1 gemstone image');
      }

      setIsUploading(true);

      // 1. Upload all images to MinIO
      toast.loading('Uploading images...', { id: 'create-listing' });
      const uploadedUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img) {
          const url = await uploadFileToMinio(img.file);
          uploadedUrls.push(url);
        }
      }

      // 2. Upload certificate image if applicable
      let certUrl: string | undefined;
      if (data.isCertified && certFile) {
        toast.loading('Uploading certificate...', { id: 'create-listing' });
        certUrl = await uploadFileToMinio(certFile);
      }

      // 3. Create the listing
      toast.loading('Creating listing...', { id: 'create-listing' });
      const payload = {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        gemType: data.gemType,
        variety: data.variety || undefined,
        originCountry: data.originCountry || undefined,
        caratWeight: Number(data.caratWeight),
        color: data.color || undefined,
        clarity: data.clarity || undefined,
        cut: data.cut || undefined,
        shape: data.shape || undefined,
        isCertified: data.isCertified,
        listingType: data.listingType,
        fixedPrice: data.fixedPrice ? Number(data.fixedPrice) : undefined,
        negotiablePrice: data.negotiablePrice ? Number(data.negotiablePrice) : undefined,
      };

      const res = await api.listings.create(payload);
      const newListing = res.data.data;

      // 4. Attach media to the listing
      toast.loading('Attaching images...', { id: 'create-listing' });
      const mediaPayload = uploadedUrls.map((url, i) => ({
        url,
        sortOrder: i,
        isThumbnail: i === 0,
      }));
      await api.listings.addMedia(newListing.id, { media: mediaPayload });

      // 5. Attach certificate if applicable
      if (data.isCertified && certUrl && data.labName) {
        toast.loading('Attaching certificate...', { id: 'create-listing' });
        await api.listings.addCertificate(newListing.id, {
          labName: data.labName,
          certificateNumber: data.certificateNumber || undefined,
          fileUrl: certUrl,
        });
      }

      // 6. Publish the listing
      toast.loading('Publishing listing...', { id: 'create-listing' });
      await api.listings.publish(newListing.id);

      return newListing;
    },
    onSuccess: (newListing) => {
      toast.success('Listing created and published!', { id: 'create-listing' });
      router.push(`/listings/${newListing.id}`);
    },
    onError: (err: any) => {
      const message = err?.response?.data?.error?.message ?? err.message ?? 'Failed to create listing.';
      toast.error(message, { id: 'create-listing' });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const onSubmit = (data: CreateListingForm) => {
    if (images.length === 0) {
      toast.error('Please upload at least 1 gemstone image');
      return;
    }
    if (data.isCertified && !certFile) {
      toast.error('Please upload the certificate image');
      return;
    }
    if (data.isCertified && !data.labName) {
      toast.error('Please enter the lab name for the certificate');
      return;
    }
    createMutation.mutate(data);
  };

  if (!isMounted || isAuthLoading || isCategoriesLoading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role === 'BUYER') return null;

  const isPending = createMutation.isPending || isUploading;

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8">
        
        <div className="flex items-center gap-3 mb-8">
          <Gem className="text-gold-500" size={28} />
          <h1 className="text-2xl font-bold text-white">Create New Gemstone Listing</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ==================== GEMSTONE IMAGES ==================== */}
          <div className="card-gem p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white border-b border-[#1e2d4e] pb-2 flex-1">
                Gemstone Images <span className="text-red-400">*</span>
              </h2>
              <span className="text-xs text-gray-500 ml-4">{images.length}/5</span>
            </div>

            <p className="text-sm text-gray-400">
              Upload 1–5 high-quality images of your gemstone. The first image will be used as the thumbnail.
            </p>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-square rounded-xl overflow-hidden border-2 border-[#1e2d4e] bg-[#0a0f1e]"
                  >
                    <img
                      src={img.preview}
                      alt={`Gem image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Thumbnail badge */}
                    {idx === 0 && (
                      <div className="absolute top-1 left-1 bg-gold-500 text-navy-900 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                        COVER
                      </div>
                    )}
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Zone */}
            {images.length < 5 && (
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-[#1e2d4e] rounded-xl cursor-pointer bg-[#080d1a] hover:bg-[#1e2d4e]/20 hover:border-gold-500/40 transition-all duration-200">
                <div className="flex flex-col items-center justify-center py-5">
                  <UploadCloud className="mb-2 text-gray-400" size={28} />
                  <p className="mb-1 text-sm text-gray-400">
                    <span className="font-semibold text-gold-500">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">JPG, PNG or WebP · Max 10MB per image</p>
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.webp"
                  multiple
                  onChange={handleImageSelect}
                />
              </label>
            )}
          </div>

          {/* ==================== BASIC INFO ==================== */}
          <div className="card-gem p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white border-b border-[#1e2d4e] pb-2">Basic Info</h2>
            
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1.5">
                Listing Title <span className="text-red-400">*</span>
              </label>
              <input
                {...register('title', { required: 'Title is required', minLength: { value: 5, message: 'Title must be at least 5 characters' } })}
                id="title"
                type="text"
                placeholder="e.g. 2.4ct Royal Blue Sapphire Oval Cut"
                className={cn('input-gem', errors.title && 'border-red-500')}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1.5">
                Detailed Description <span className="text-red-400">*</span>
              </label>
              <textarea
                {...register('description', { required: 'Description is required', minLength: { value: 20, message: 'Description must be at least 20 characters' } })}
                id="description"
                placeholder="Describe the gem color, clarity, origin, cert details, and any treatments..."
                className={cn('input-gem h-32', errors.description && 'border-red-500')}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  {...register('categoryId', { required: 'Category is required' })}
                  id="categoryId"
                  className={cn('input-gem', errors.categoryId && 'border-red-500')}
                >
                  <option value="">Select Category</option>
                  {categories?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="mt-1 text-xs text-red-400">{errors.categoryId.message}</p>
                )}
              </div>

              {/* Gem Type */}
              <div>
                <label htmlFor="gemType" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Gem Type <span className="text-red-400">*</span>
                </label>
                <input
                  {...register('gemType', { required: 'Gem type is required' })}
                  id="gemType"
                  type="text"
                  placeholder="e.g. Sapphire, Ruby, Spinel"
                  className={cn('input-gem', errors.gemType && 'border-red-500')}
                />
                {errors.gemType && (
                  <p className="mt-1 text-xs text-red-400">{errors.gemType.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* ==================== SPECIFICATIONS ==================== */}
          <div className="card-gem p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white border-b border-[#1e2d4e] pb-2">Gemstone Specifications</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Carat Weight */}
              <div>
                <label htmlFor="caratWeight" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Carat Weight <span className="text-red-400">*</span>
                </label>
                <input
                  {...register('caratWeight', { required: 'Weight is required', min: { value: 0.01, message: 'Must be positive' } })}
                  id="caratWeight"
                  type="number"
                  step="0.01"
                  className="input-gem"
                />
                {errors.caratWeight && (
                  <p className="mt-1 text-xs text-red-400">{errors.caratWeight.message}</p>
                )}
              </div>

              {/* Color */}
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Color
                </label>
                <input
                  {...register('color')}
                  id="color"
                  type="text"
                  placeholder="Royal Blue, Pigeon Blood Red"
                  className="input-gem"
                />
              </div>

              {/* Clarity */}
              <div>
                <label htmlFor="clarity" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Clarity
                </label>
                <input
                  {...register('clarity')}
                  id="clarity"
                  type="text"
                  placeholder="Eye Clean, VVS"
                  className="input-gem"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Shape */}
              <div>
                <label htmlFor="shape" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Shape
                </label>
                <input
                  {...register('shape')}
                  id="shape"
                  type="text"
                  placeholder="Oval, Cushion, Round"
                  className="input-gem"
                />
              </div>

              {/* Cut */}
              <div>
                <label htmlFor="cut" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Cut / Faceting
                </label>
                <input
                  {...register('cut')}
                  id="cut"
                  type="text"
                  placeholder="Mixed Cut, Brilliant Cut"
                  className="input-gem"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Origin Country */}
              <div>
                <label htmlFor="originCountry" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Origin Country
                </label>
                <input
                  {...register('originCountry')}
                  id="originCountry"
                  type="text"
                  placeholder="Sri Lanka, Madagascar"
                  className="input-gem"
                />
              </div>

              {/* Variety */}
              <div>
                <label htmlFor="variety" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Variety
                </label>
                <input
                  {...register('variety')}
                  id="variety"
                  type="text"
                  placeholder="Blue Sapphire, Pigeon Blood Ruby"
                  className="input-gem"
                />
              </div>
            </div>
          </div>

          {/* ==================== CERTIFICATION ==================== */}
          <div className="card-gem p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white border-b border-[#1e2d4e] pb-2">Certification</h2>

            {/* Certified Checkbox */}
            <div className="flex items-center gap-3">
              <input
                {...register('isCertified')}
                id="isCertified"
                type="checkbox"
                className="w-5 h-5 rounded border-[#1e2d4e] bg-[#0a0f1e] text-gold-500 focus:ring-gold-500/30"
              />
              <label htmlFor="isCertified" className="text-sm font-medium text-gray-300">
                This gemstone has a lab certificate
              </label>
            </div>

            {/* Certificate details — shown when isCertified is true */}
            {isCertified && (
              <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-[#1e2d4e] pt-5">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <ShieldCheck className="text-amber-400 shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-amber-200/80">
                    Upload a clear photo of the certificate for verification. This helps build buyer trust and may increase your gem's value.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lab Name */}
                  <div>
                    <label htmlFor="labName" className="block text-sm font-medium text-gray-300 mb-1.5">
                      Lab Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      {...register('labName')}
                      id="labName"
                      type="text"
                      placeholder="e.g. GIA, GRS, AIGS, GIC"
                      className="input-gem"
                    />
                  </div>

                  {/* Certificate Number */}
                  <div>
                    <label htmlFor="certificateNumber" className="block text-sm font-medium text-gray-300 mb-1.5">
                      Certificate Number
                    </label>
                    <input
                      {...register('certificateNumber')}
                      id="certificateNumber"
                      type="text"
                      placeholder="e.g. 2201234567"
                      className="input-gem"
                    />
                  </div>
                </div>

                {/* Certificate Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Certificate Photo <span className="text-red-400">*</span>
                  </label>

                  {certFile ? (
                    <div className="relative bg-[#0a0f1e] border border-[#1e2d4e] rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        {certPreview ? (
                          <img
                            src={certPreview}
                            alt="Certificate preview"
                            className="w-20 h-20 object-cover rounded-lg border border-[#1e2d4e]"
                          />
                        ) : (
                          <div className="w-20 h-20 flex items-center justify-center bg-[#080d1a] rounded-lg border border-[#1e2d4e]">
                            <FileText className="text-gold-500" size={28} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gold-400 font-medium truncate">{certFile.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{(certFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button
                          type="button"
                          onClick={removeCert}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#1e2d4e] rounded-xl cursor-pointer bg-[#080d1a] hover:bg-[#1e2d4e]/20 hover:border-gold-500/40 transition-all duration-200">
                      <div className="flex flex-col items-center justify-center py-5">
                        <ShieldCheck className="mb-2 text-gray-400" size={24} />
                        <p className="mb-1 text-sm text-gray-400">
                          <span className="font-semibold text-gold-500">Upload certificate photo</span>
                        </p>
                        <p className="text-xs text-gray-500">JPG, PNG, WebP or PDF · Max 10MB</p>
                      </div>
                      <input
                        ref={certInputRef}
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                        onChange={handleCertSelect}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ==================== PRICING ==================== */}
          <div className="card-gem p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white border-b border-[#1e2d4e] pb-2">Pricing & Listing Type</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Listing Type Selector */}
              <div>
                <label htmlFor="listingType" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Listing Type <span className="text-red-400">*</span>
                </label>
                <select
                  {...register('listingType')}
                  id="listingType"
                  className="input-gem"
                >
                  <option value="FIXED_PRICE">Fixed Price</option>
                  <option value="NEGOTIABLE">Negotiable (Accept Offers)</option>
                </select>
              </div>

              {/* Price Input based on type */}
              {listingType === 'FIXED_PRICE' ? (
                <div>
                  <label htmlFor="fixedPrice" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Price (LKR) <span className="text-red-400">*</span>
                  </label>
                  <input
                    {...register('fixedPrice', { required: 'Price is required', min: { value: 1, message: 'Price must be positive' } })}
                    id="fixedPrice"
                    type="number"
                    placeholder="Enter fixed price"
                    className={cn('input-gem', errors.fixedPrice && 'border-red-500')}
                  />
                  {errors.fixedPrice && (
                    <p className="mt-1 text-xs text-red-400">{errors.fixedPrice.message}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label htmlFor="negotiablePrice" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Asking Price (LKR) <span className="text-red-400">*</span>
                  </label>
                  <input
                    {...register('negotiablePrice', { required: 'Asking price is required', min: { value: 1, message: 'Price must be positive' } })}
                    id="negotiablePrice"
                    type="number"
                    placeholder="Enter asking price"
                    className={cn('input-gem', errors.negotiablePrice && 'border-red-500')}
                  />
                  {errors.negotiablePrice && (
                    <p className="mt-1 text-xs text-red-400">{errors.negotiablePrice.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ==================== SUBMIT ==================== */}
          <button
            type="submit"
            disabled={isPending}
            className="btn-gold w-full justify-center py-3"
          >
            {isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin mr-2" />
                {isUploading ? 'Uploading & Creating...' : 'Creating listing...'}
              </>
            ) : (
              <>
                <PlusCircle size={18} />
                Create and Publish Listing
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
