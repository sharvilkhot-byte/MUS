
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { sendOtp, verifyOtp } from '../services/authService';
import { createLead, verifyLead } from '../services/leadService';

interface AuthBlockerProps {
    onUnlock: () => void;
    isUnlocked: boolean;
    auditUrl: string;
}

export const AuthBlocker: React.FC<AuthBlockerProps> = ({ onUnlock, isUnlocked, auditUrl }) => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [orgType, setOrgType] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'info' | 'otp'>('info');
    const [isLoading, setIsLoading] = useState(false);

    // If unlocked, don't render anything
    if (isUnlocked) return null;

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !name) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsLoading(true);

        // 1. Save Lead Data immediately
        const { error: leadError } = await createLead({
            email,
            name,
            organization_type: orgType,
            audit_url: auditUrl
        });

        if (leadError) {
            console.warn("Failed to capture lead data:", leadError);
            // We continue anyway to let them auth
        }

        // 2. Send OTP
        const { error } = await sendOtp(email);
        setIsLoading(false);

        if (error) {
            toast.error(error);
        } else {
            toast.success('Verification code sent to ' + email);
            setStep('otp');
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp) return;

        setIsLoading(true);
        const { session, error } = await verifyOtp(email, otp);

        if (error) {
            setIsLoading(false);
            toast.error(error);
        } else if (session) {
            // Mark lead as verified in background
            await verifyLead(email);

            setIsLoading(false);
            toast.success('Successfully verified!');
            onUnlock();
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop with stronger blur and dark overlay */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"></div>

            {/* Modal Card */}
            <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl p-6 md:p-8 border border-slate-200">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 rounded-full mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-indigo-600">
                            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Unlock Full Audit Report</h2>
                    <p className="mt-2 text-slate-600 text-sm">
                        Get instant access to your details strategic roadmap and UX insights.
                    </p>
                </div>

                {step === 'info' ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-1">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
                                Business Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="orgType" className="block text-xs font-semibold text-slate-700 mb-1">
                                Organization Type <span className="text-slate-400 font-normal">(Optional)</span>
                            </label>
                            <select
                                id="orgType"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-sm"
                                value={orgType}
                                onChange={(e) => setOrgType(e.target.value)}
                            >
                                <option value="">Select type...</option>
                                <option value="agency">Agency / Consultancy</option>
                                <option value="startup">Startup</option>
                                <option value="enterprise">Enterprise</option>
                                <option value="ecommerce">E-commerce</option>
                                <option value="saas">SaaS</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 px-4 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processsing...
                                </span>
                            ) : (
                                'Unlock Report'
                            )}
                        </button>
                        <p className="text-center text-[10px] text-slate-400 mt-3">
                            We'll send a one-time verification code to your email. No passwords needed.
                        </p>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div>
                            <label htmlFor="otp" className="block text-xs font-semibold text-slate-700 mb-2 text-center">
                                Enter Verification Code sent to <span className="text-indigo-600">{email}</span>
                            </label>
                            <input
                                type="text"
                                id="otp"
                                required
                                autoFocus
                                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-center tracking-[0.5em] text-xl font-mono"
                                placeholder="------"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />
                            <p className="mt-2 text-xs text-center text-slate-500">
                                Can't find it? Check your spam folder.
                            </p>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {isLoading ? 'Verifying...' : 'Verify Access'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep('info')}
                            className="w-full py-1 text-xs text-slate-500 hover:text-slate-700 font-medium underline decoration-slate-300 underline-offset-4"
                        >
                            Change Details
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
