'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitKycSchema, type SubmitKycInput } from '@gem/validators';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { CheckCircle2, UploadCloud, FileText, ChevronRight, ChevronLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';

const STEPS = ['Business Info', 'Documents', 'Review'];

export default function SellerOnboardingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // File state
  const [nicFile, setNicFile] = useState<File | null>(null);
  const [regFile, setRegFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
    getValues,
  } = useForm<SubmitKycInput>({
    resolver: zodResolver(submitKycSchema),
    mode: 'onChange',
  });

  const handleNext = async () => {
    if (currentStep === 0) {
      const isStepValid = await trigger(['businessName', 'registrationNo', 'taxId', 'address']);
      if (!isStepValid) return;
    }
    
    if (currentStep === 1) {
      if (!nicFile) {
        toast.error('NIC or Passport is required');
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'nic' | 'reg') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be smaller than 5MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      toast.error('Only JPG, PNG or PDF are allowed');
      return;
    }

    if (type === 'nic') setNicFile(file);
    if (type === 'reg') setRegFile(file);
  };

  const uploadFileToMinio = async (file: File) => {
    // 1. Get presigned URL
    const res = await api.client.post('/kyc/presigned-url', {
      fileName: file.name,
      contentType: file.type,
    });
    
    const { uploadUrl, publicUrl } = res.data.data;

    // 2. Upload file directly to MinIO using native fetch
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    return publicUrl;
  };

  const onSubmit = async () => {
    if (!nicFile) return;

    try {
      setIsSubmitting(true);
      setUploadProgress(10);

      // Upload files
      toast.loading('Uploading documents...', { id: 'kyc' });
      const nicPassportUrl = await uploadFileToMinio(nicFile);
      setUploadProgress(50);
      
      let businessRegUrl = '';
      if (regFile) {
        businessRegUrl = await uploadFileToMinio(regFile);
      }
      setUploadProgress(80);

      // Submit application
      toast.loading('Submitting application...', { id: 'kyc' });
      const data = getValues();
      await api.client.post('/kyc/submit', {
        ...data,
        nicPassportUrl,
        businessRegUrl: businessRegUrl || undefined,
      });

      setUploadProgress(100);
      toast.success('Application submitted successfully!', { id: 'kyc' });
      router.push('/settings');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong', { id: 'kyc' });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#080d1a]">
      <div className="max-w-3xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-10">
          <ShieldCheck className="mx-auto text-gold-500 mb-4" size={48} />
          <h1 className="text-3xl font-bold text-white mb-2">Seller Verification</h1>
          <p className="text-gray-400">Complete your KYC to start listing gemstones on Gem Project.</p>
        </div>

        {/* Stepper */}
        <div className="mb-10">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-[#1e2d4e] z-0" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gold-500 z-0 transition-all duration-300"
              style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
            />
            {STEPS.map((step, idx) => (
              <div key={step} className="relative z-10 flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300",
                  idx <= currentStep ? "bg-gold-500 text-navy-900" : "bg-[#0e1628] text-gray-500 border-2 border-[#1e2d4e]"
                )}>
                  {idx < currentStep ? <CheckCircle2 size={20} /> : idx + 1}
                </div>
                <div className={cn(
                  "absolute top-12 text-xs font-medium whitespace-nowrap transition-colors",
                  idx <= currentStep ? "text-gold-400" : "text-gray-500"
                )}>
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="card-gem p-6 md:p-10 mb-8 mt-16">
          
          {/* STEP 1: Business Info */}
          {currentStep === 0 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-white mb-6">Business Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Business / Store Name <span className="text-red-400">*</span>
                </label>
                <input
                  {...register('businessName')}
                  className="input-gem"
                  placeholder="e.g. Ratnapura Gems"
                />
                {errors.businessName && <p className="mt-1 text-xs text-red-400">{errors.businessName.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Registration No. <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                  </label>
                  <input
                    {...register('registrationNo')}
                    className="input-gem"
                    placeholder="e.g. PV 123456"
                  />
                  {errors.registrationNo && <p className="mt-1 text-xs text-red-400">{errors.registrationNo.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Tax ID (TIN) <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                  </label>
                  <input
                    {...register('taxId')}
                    className="input-gem"
                    placeholder="e.g. 123456789"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Full Business Address <span className="text-red-400">*</span>
                </label>
                <textarea
                  {...register('address')}
                  className="input-gem resize-none h-24"
                  placeholder="123 Gem Street, Ratnapura, Sri Lanka"
                />
                {errors.address && <p className="mt-1 text-xs text-red-400">{errors.address.message}</p>}
              </div>
            </div>
          )}

          {/* STEP 2: Documents */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-white mb-2">Identity & Documents</h2>
              <p className="text-sm text-gray-400 mb-6">
                Upload clear, color images or PDFs. Max size: 5MB.
              </p>

              {/* NIC Upload */}
              <div className="bg-[#0a0f1e] border border-[#1e2d4e] rounded-xl p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">NIC or Passport <span className="text-red-400">*</span></h3>
                    <p className="text-xs text-gray-500 mt-1">Required for identity verification</p>
                  </div>
                  {nicFile && <CheckCircle2 className="text-emerald-400" size={20} />}
                </div>

                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#1e2d4e] rounded-lg cursor-pointer bg-[#080d1a] hover:bg-[#1e2d4e]/30 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="mb-2 text-gray-400" size={24} />
                    <p className="mb-1 text-sm text-gray-400">
                      <span className="font-semibold text-gold-500">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or PDF</p>
                  </div>
                  <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileUpload(e, 'nic')} />
                </label>
                {nicFile && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gold-400">
                    <FileText size={16} />
                    {nicFile.name}
                  </div>
                )}
              </div>

              {/* Business Reg Upload */}
              <div className="bg-[#0a0f1e] border border-[#1e2d4e] rounded-xl p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Business Registration <span className="text-gray-500 text-xs font-normal">(Optional)</span></h3>
                    <p className="text-xs text-gray-500 mt-1">Required for company verification</p>
                  </div>
                  {regFile && <CheckCircle2 className="text-emerald-400" size={20} />}
                </div>

                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#1e2d4e] rounded-lg cursor-pointer bg-[#080d1a] hover:bg-[#1e2d4e]/30 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="mb-2 text-gray-400" size={24} />
                    <p className="mb-1 text-sm text-gray-400">
                      <span className="font-semibold text-gold-500">Click to upload</span> or drag and drop
                    </p>
                  </div>
                  <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileUpload(e, 'reg')} />
                </label>
                {regFile && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gold-400">
                    <FileText size={16} />
                    {regFile.name}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Review */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-white mb-4">Review Application</h2>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-amber-200/80 leading-relaxed">
                  Please confirm all details are accurate. Once submitted, your application will be reviewed by our team within 1-2 business days. False information may lead to account termination.
                </p>
              </div>

              <div className="bg-[#0a0f1e] border border-[#1e2d4e] rounded-xl p-5 space-y-4">
                <div className="grid grid-cols-3 gap-4 border-b border-[#1e2d4e] pb-4">
                  <div className="text-sm text-gray-500">Business Name</div>
                  <div className="col-span-2 text-sm text-white font-medium">{getValues('businessName')}</div>
                </div>
                <div className="grid grid-cols-3 gap-4 border-b border-[#1e2d4e] pb-4">
                  <div className="text-sm text-gray-500">Registration No</div>
                  <div className="col-span-2 text-sm text-white">{getValues('registrationNo') || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-3 gap-4 border-b border-[#1e2d4e] pb-4">
                  <div className="text-sm text-gray-500">Address</div>
                  <div className="col-span-2 text-sm text-white">{getValues('address')}</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-gray-500">Documents</div>
                  <div className="col-span-2 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                      <CheckCircle2 size={16} /> {nicFile?.name} (NIC/Passport)
                    </div>
                    {regFile && (
                      <div className="flex items-center gap-2 text-sm text-emerald-400">
                        <CheckCircle2 size={16} /> {regFile.name} (Business Reg)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
            className="btn-outline px-6 disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronLeft size={18} className="mr-2" /> Back
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button onClick={handleNext} className="btn-gold px-8">
              Continue <ChevronRight size={18} className="ml-2" />
            </button>
          ) : (
            <button onClick={onSubmit} disabled={isSubmitting} className="btn-gold px-8 overflow-hidden relative">
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                  Submitting ({uploadProgress}%)
                </div>
              ) : (
                'Submit Application'
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
