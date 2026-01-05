import React, { useState, useMemo, useEffect } from 'react';
import { AnalysisReport, Screenshot, CriticalIssue } from '../types';
import { SkeletonLoader } from './SkeletonLoader';
import { Logo } from './Logo';
import { UserBadge } from './UserBadge';
import toast from 'react-hot-toast';

// --- PARTNER FEATURES (Logic) ---
import { saveSharedAudit } from '../services/auditStorage';
import { AuthBlocker } from './AuthBlocker';
import { useAuth } from '../contexts/AuthContext';

// --- YOUR UI COMPONENTS ---
import { ScoreDisplayCard } from './report/ScoreComponents';
import { CriticalIssueCard } from './report/AuditCards';
import { DetailedAuditView, DetailedAuditType } from './report/DetailedAuditView';
import { ASSETS } from './report/constants';

// --- YOUR PDF HOOK ---
import { useReportPdf } from '../hooks/useReportPdf';

interface ReportDisplayProps {
    report: AnalysisReport | null;
    url: string;
    screenshots: Screenshot[];
    screenshotMimeType: string;
    performanceError: string | null;
    auditId: string | null;
    onRunNewAudit: () => void;
    whiteLabelLogo?: string | null;
    isSharedView?: boolean;
}

export function ReportDisplay({ 
    report, 
    url, 
    screenshots, 
    auditId, 
    onRunNewAudit, 
    whiteLabelLogo, 
    screenshotMimeType, 
    isSharedView = false 
}: ReportDisplayProps) {

    // --- STATE ---
    const [activeTab, setActiveTab] = useState('Executive Summary');
    const [isSharing, setIsSharing] = useState(false);
    const TABS = ['Executive Summary', 'UX Audit', 'Product Audit', 'Visual Design'];

    // --- AUTH LOGIC (Partner's Feature) ---
    const { user, isLoading: isAuthLoading } = useAuth();
    // Logic: If NOT shared view and NO user logged in -> Lock it
    const [isLocked, setIsLocked] = useState(!isSharedView);

    useEffect(() => {
        if (user && !isSharedView) {
            setIsLocked(false);
        }
    }, [user, isSharedView]);

    // --- PDF LOGIC (Your Feature) ---
    const { generatePdf, isPdfGenerating, pdfError } = useReportPdf({
        report,
        url,
        screenshots,
        whiteLabelLogo,
        defaultLogoSrc: ASSETS.headerLogo
    });

    // --- DATA ---
    const { "UX Audit expert": ux, "Product Audit expert": product, "Visual Audit expert": visual, "Strategy Audit expert": strategy, Top5ContextualIssues } = report || {};
    const primaryScreenshot = screenshots.find(s => !s.isMobile);
    const primaryScreenshotSrc = primaryScreenshot?.url || (primaryScreenshot?.data ? `data:image/jpeg;base64,${primaryScreenshot.data}` : undefined);
    const isReportReady = report && ux && product && visual && strategy;

    const overallScore = useMemo(() => {
        if (!report) return 0;
        const scores = [ux?.CategoryScore, product?.CategoryScore, visual?.CategoryScore].filter(s => typeof s === 'number') as number[];
        if (scores.length === 0) return 0;
        return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    }, [ux, product, visual, report]);

    // --- ACTIONS ---
    const handleShareAudit = async () => {
        if (!report || isSharing) return;
        setIsSharing(true);
        try {
            const sharedAuditId = await saveSharedAudit({
                url,
                report,
                screenshots,
                screenshotMimeType,
                whiteLabelLogo,
            });
            const shareUrl = `${window.location.origin}/shared/${sharedAuditId}`;
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Share link copied to clipboard!', { icon: '🔗' });
        } catch (error) {
            console.error('Error sharing audit:', error);
            toast.error('Failed to create share link.');
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <header className="text-center my-8 sm:my-12 px-4">
                <div className="flex flex-col items-center justify-center pt-8 pb-6 bg-slate-50 relative">
                    <div className="absolute top-4 right-4">
                        <UserBadge />
                    </div>
                    {isSharedView && whiteLabelLogo ? (
                        <img src={whiteLabelLogo} alt="Logo" className="mb-6 max-h-[140px] w-auto object-contain" />
                    ) : (
                        <Logo className="mb-6" />
                    )}
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 text-center px-4">
                        Let's Put Your Website Through a UX Checkup
                    </h1>
                    <p className="mt-4 text-lg text-slate-600 text-center px-4 max-w-2xl">
                        AI-powered UX assessment to spot friction, gaps, and quick wins.
                    </p>
                </div>
            </header>

            {/* Main Content */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                {pdfError && <div className="m-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">{pdfError}</div>}

                {!isReportReady && <div className="p-8"><SkeletonLoader className="h-[100vh] w-full" /></div>}

                {isReportReady && (
                    <>
                        {/* Tab Navigation & Actions */}
                        <div className="px-4 sm:px-6 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center py-4 gap-4 bg-slate-50/50">
                            <nav className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl overflow-x-auto">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`whitespace-nowrap py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                                            activeTab === tab
                                                ? 'bg-white text-indigo-600 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </nav>

                            <div className="flex items-center gap-3">
                                {/* PDF Button (Your Feature) */}
                                <button
                                    onClick={generatePdf}
                                    disabled={isPdfGenerating}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
                                >
                                    {isPdfGenerating ? 'Generating...' : 'Download Report'}
                                </button>
                                
                                {/* Share Button (Partner Feature) */}
                                {!isSharedView && (
                                    <button onClick={handleShareAudit} disabled={isSharing} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100">
                                        {isSharing ? 'Sharing...' : 'Share Audit'}
                                    </button>
                                )}

                                {/* New Audit Button */}
                                {!isSharedView && onRunNewAudit && (
                                    <button onClick={onRunNewAudit} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                                        New Audit
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content Area with Auth Lock */}
                        <div className="relative">
                            {isLocked && !isAuthLoading && <AuthBlocker isUnlocked={false} onUnlock={() => setIsLocked(false)} auditUrl={url} />}
                            
                            <div className={`p-6 font-['DM_Sans'] transition-all duration-500 ${isLocked ? 'blur-sm pointer-events-none select-none h-[600px] overflow-hidden' : ''}`}>
                                
                                {/* Executive Summary Tab */}
                                {activeTab === 'Executive Summary' && (
                                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                                        
                                        {/* Scores & Screenshot */}
                                        <div className="flex flex-col self-stretch">
                                            <div className="w-full max-w-md mx-auto mb-6">
                                                <ScoreDisplayCard score={overallScore} label="Overall Score" isHero={true} />
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                                                {product ? <ScoreDisplayCard score={product.CategoryScore} label="Product Audit" /> : <SkeletonLoader className="h-32" />}
                                                {ux ? <ScoreDisplayCard score={ux.CategoryScore} label="UX Audit" /> : <SkeletonLoader className="h-32" />}
                                                {visual ? <ScoreDisplayCard score={visual.CategoryScore} label="Visual Design" /> : <SkeletonLoader className="h-32" />}
                                            </div>
                                            {primaryScreenshotSrc ? (
                                                <div className="self-stretch w-full mb-8">
                                                    <div className="text-[14px] font-bold text-slate-500 uppercase tracking-wider mb-3 text-left">Analyzed Page View</div>
                                                    <div className="rounded-xl border border-slate-200 bg-slate-50 shadow-sm relative overflow-hidden h-[450px]">
                                                        <img src={primaryScreenshotSrc} className="w-full absolute top-0 left-0 h-auto" alt="Preview" />
                                                    </div>
                                                </div>
                                            ) : <SkeletonLoader className="h-[400px] w-full mb-8 rounded-xl" />}
                                        </div>

                                        {/* Executive Summary Text (Partner Feature) */}
                                        {strategy?.ExecutiveSummary && (
                                            <div className="mb-8 p-6 bg-indigo-50 border border-indigo-100 rounded-xl relative overflow-hidden">
                                                <div className="relative z-10">
                                                    <h3 className="text-indigo-900 font-bold text-xl mb-3">Executive Summary</h3>
                                                    <p className="text-indigo-900/90 leading-relaxed text-base font-medium whitespace-pre-line">
                                                        {strategy.ExecutiveSummary}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Strategy Audit */}
                                        <DetailedAuditView auditData={strategy} auditType={'Strategic Foundation'} />

                                        {/* Top 5 Issues */}
                                        <div className="mt-8">
                                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Top 5 Impactful Issues</h2>
                                            <div className="flex flex-col gap-4">
                                                {Top5ContextualIssues?.map((issue, index) => (
                                                    <CriticalIssueCard key={index} issue={issue} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Other Tabs */}
                                {activeTab !== 'Executive Summary' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4">
                                        <DetailedAuditView
                                            auditData={activeTab === 'UX Audit' ? ux : activeTab === 'Product Audit' ? product : activeTab === 'Visual Design' ? visual : strategy}
                                            auditType={activeTab as DetailedAuditType}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}