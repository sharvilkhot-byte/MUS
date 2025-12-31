import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AnalysisReport, CriticalIssue, Screenshot } from '../types';
import { SkeletonLoader } from './SkeletonLoader';
import { Logo } from './Logo';
import toast from 'react-hot-toast';

import { saveSharedAudit } from '../services/auditStorage';
import { AuthBlocker } from './AuthBlocker';
// import { getCurrentSession } from '../services/authService'; // Keeping this commented out as per user snippet

import { ASSETS } from './report/constants';
import { ScoreDisplayCard } from './report/ScoreComponents';
import { CriticalIssueCard } from './report/AuditCards';
import { DetailedAuditView, DetailedAuditType } from './report/DetailedAuditView';
import { StrategyAuditDisplay } from './report/StrategyComponents';
import { useAuth } from '../contexts/AuthContext';
import { UserBadge } from './UserBadge';

// --- Supabase Client Details ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// -----------------------------

interface ReportDisplayProps {
    report: AnalysisReport | null;
    url: string;
    screenshots: Screenshot[];
    screenshotMimeType: string;
    performanceError: string | null;
    auditId: string | null;
    onRunNewAudit: () => void;
    whiteLabelLogo?: string | null;
    isSharedView?: boolean; // NEW: Indicates if this is a shared/read-only view
}

// --- MAIN COMPONENTS ---

export const ReportBody: React.FC<{ report: AnalysisReport, url: string, screenshots: Screenshot[] }> = ({ report, url, screenshots }) => {
    const { "UX Audit expert": ux, "Product Audit expert": product, "Visual Audit expert": visual, "Strategy Audit expert": strategy, Top5ContextualIssues } = report;
    const primaryScreenshot = screenshots.find(s => !s.isMobile);
    const primaryScreenshotSrc = primaryScreenshot?.url || (primaryScreenshot?.data ? `data:image/jpeg;base64,${primaryScreenshot.data}` : undefined);

    const overallScore = useMemo(() => {
        const scores = [ux?.CategoryScore, product?.CategoryScore, visual?.CategoryScore].filter(s => typeof s === 'number') as number[];
        if (scores.length === 0) return 0;
        const average = scores.reduce((a, b) => a + b, 0) / scores.length;
        return Math.round(average * 10) / 10;
    }, [ux, product, visual]);

    const allIssues = useMemo(() => {
        if (Top5ContextualIssues) return Top5ContextualIssues.slice(0, 5);
        const issues: (CriticalIssue & { source: string })[] = [
            ...(ux?.Top5CriticalUXIssues?.map(i => ({ ...i, source: 'UX Audit' })) || []),
            ...(product?.Top5CriticalProductIssues?.map(i => ({ ...i, source: 'Product Audit' })) || []),
            ...(visual?.Top5CriticalVisualIssues?.map(i => ({ ...i, source: 'Visual Design' })) || [])
        ];
        issues.sort((a, b) => a.Score - b.Score);
        return issues.slice(0, 5);
    }, [report, Top5ContextualIssues]);

    return (
        <div className="flex flex-col bg-white p-6 gap-8 font-['DM_Sans']" style={{ fontFamily: '"DM Sans", sans-serif' }}>
            {/* Cover Section */}
            <div className="flex flex-col self-stretch break-inside-avoid pdf-item">
                <div className="flex justify-between items-center self-stretch mb-5">
                    <span className="text-black text-base font-bold">Comprehensive AI Website Audit</span>
                    <span className="text-[#757575] text-xs">{url}</span>
                </div>
                {primaryScreenshotSrc ? (
                    <div className="self-stretch aspect-video mb-8 sm:mb-[60px] rounded-md border border-slate-200 overflow-hidden bg-white relative">
                        <img
                            src={primaryScreenshotSrc}
                            className="w-full absolute top-0 left-0"
                            style={{ height: 'auto' }}
                            alt="website screenshot"
                        />
                    </div>
                ) : (
                    <SkeletonLoader className="aspect-video w-full mb-8 sm:mb-[60px] rounded-md" />
                )}
                <div className="grid grid-cols-2 min-[550px]:grid-cols-4 gap-3 break-inside-avoid">
                    <ScoreDisplayCard score={overallScore} label="Overall Score" />
                    {product ? <ScoreDisplayCard score={product.CategoryScore} label="Product Audit" /> : <SkeletonLoader className="h-32 flex-1 rounded-lg" />}
                    {ux ? <ScoreDisplayCard score={ux.CategoryScore} label="UX Audit" /> : <SkeletonLoader className="h-32 flex-1 rounded-lg" />}
                    {visual ? <ScoreDisplayCard score={visual.CategoryScore} label="Visual Design" /> : <SkeletonLoader className="h-32 flex-1 rounded-lg" />}
                </div>
            </div>

            {/* Executive Summary Issues */}
            <div className="self-stretch force-page-break-before">
                <h2 className="text-black text-base font-bold mt-8 mb-4 break-inside-avoid pdf-item pdf-section-title force-page-break-before">Executive Summary</h2>

                {/* Executive Summary Text Card */}
                {strategy?.ExecutiveSummary && (
                    <div className="mb-6 p-6 bg-indigo-50 border border-indigo-100 rounded-xl relative overflow-hidden break-inside-avoid shadow-sm">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <svg className="w-24 h-24 text-indigo-600 transform rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"></path><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"></path></svg>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-indigo-900 font-bold text-lg mb-2 flex items-center gap-2">
                                <span className="bg-indigo-600 text-white p-1 rounded">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                </span>
                                Audit Overview
                            </h3>
                            <p className="text-indigo-900/80 leading-relaxed text-sm sm:text-base font-medium">
                                {strategy.ExecutiveSummary}
                            </p>
                        </div>
                    </div>
                )}

                <h2 className="text-black text-base font-bold mt-4 mb-4 break-inside-avoid pdf-item pdf-section-title">Top 5 Most Impactful Issues</h2>
                <div className="flex flex-col self-stretch gap-3">
                    {allIssues.length > 0 ? (
                        allIssues.map((issue, index) => (
                            <React.Fragment key={index}>
                                <CriticalIssueCard issue={issue} />
                            </React.Fragment>
                        ))
                    ) : (Array.from({ length: 5 }).map((_, index) => <SkeletonLoader key={index} className="h-64 w-full rounded-xl" />))}
                </div>
            </div>

            {/* Strategic Foundation */}
            {strategy && <DetailedAuditView auditData={strategy} auditType={'Strategic Foundation'} />}

            {/* Render other detailed sections for printing */}
            {[
                { data: ux, type: 'UX Audit' },
                { data: product, type: 'Product Audit' },
                { data: visual, type: 'Visual Design' },
            ].map(({ data, type }) => (
                data ? (
                    <div key={type} className="force-page-break-before">
                        <DetailedAuditView auditData={data} auditType={type as DetailedAuditType} />
                    </div>
                ) : null
            ))}

            <div className="mb-8"></div> {/* Bottom spacer */}

        </div>
    );
};

export function ReportDisplay({ report, url, screenshots, auditId, onRunNewAudit, whiteLabelLogo, screenshotMimeType, isSharedView = false }: ReportDisplayProps) {
    const [isPdfGenerating, setIsPdfGenerating] = useState(false);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('Executive Summary');

    const [isSharing, setIsSharing] = useState(false);
    const { user, isLoading: isAuthLoading } = useAuth(); // Use Global Auth State

    // Auth Blocking State
    // Lock if NOT shared view AND NO user logged in
    const [isLocked, setIsLocked] = useState(!isSharedView);

    // Effect to auto-unlock if user is logged in
    React.useEffect(() => {
        if (user && !isSharedView) {
            setIsLocked(false);
        }
    }, [user, isSharedView]);

    const TABS = ['Executive Summary', 'UX Audit', 'Product Audit', 'Visual Design'];

    const { "UX Audit expert": ux, "Product Audit expert": product, "Visual Audit expert": visual, "Strategy Audit expert": strategy, Top5ContextualIssues } = report || {};

    console.log('--- DEBUG STRATEGY DATA ---', strategy); // Debug logging


    const primaryScreenshot = screenshots.find(s => !s.isMobile);
    const primaryScreenshotSrc = primaryScreenshot?.url || (primaryScreenshot?.data ? `data:image/jpeg;base64,${primaryScreenshot.data}` : undefined);


    const overallScore = useMemo(() => {
        if (!report) return 0;
        const scores = [ux?.CategoryScore, product?.CategoryScore, visual?.CategoryScore].filter(s => typeof s === 'number') as number[];
        if (scores.length === 0) return 0;
        const average = scores.reduce((a, b) => a + b, 0) / scores.length;
        return Math.round(average * 10) / 10;
    }, [ux, product, visual, report]);

    const allIssues = useMemo(() => {
        if (!report) return [];
        if (Top5ContextualIssues) return Top5ContextualIssues.slice(0, 5);
        const issues: (CriticalIssue & { source: string })[] = [
            ...(ux?.Top5CriticalUXIssues?.map(i => ({ ...i, source: 'UX Audit' })) || []),
            ...(product?.Top5CriticalProductIssues?.map(i => ({ ...i, source: 'Product Audit' })) || []),
            ...(visual?.Top5CriticalVisualIssues?.map(i => ({ ...i, source: 'Visual Design' })) || [])
        ];
        issues.sort((a, b) => a.Score - b.Score);
        return issues.slice(0, 5);
    }, [report, Top5ContextualIssues]);

    const isReportReady = report && ux && product && visual && strategy;

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

            // Copy to clipboard
            await navigator.clipboard.writeText(shareUrl);

            toast.success('Share link copied to clipboard!', {
                duration: 4000,
                icon: '🔗',
            });
        } catch (error) {
            console.error('Error sharing audit:', error);
            toast.error('Failed to create share link. Please try again.');
        } finally {
            setIsSharing(false);
        }
    };


    const generatePdf = async () => {
        if (!report) return;
        setIsPdfGenerating(true);
        setPdfError(null);

        // 1. Create a "Source" container - hidden, renders the *entire* report content in one continuous flow.
        const sourceContainer = document.createElement('div');
        sourceContainer.className = "font-['DM_Sans'] bg-white text-slate-900";
        // Offscreen but laid out normally
        sourceContainer.style.position = 'absolute';
        sourceContainer.style.left = '-10000px';
        sourceContainer.style.top = '0';

        const CONTENT_WIDTH = 640;
        sourceContainer.style.width = `${CONTENT_WIDTH}px`;

        document.body.appendChild(sourceContainer);

        const root = ReactDOM.createRoot(sourceContainer);

        await new Promise<void>((resolve) => {
            root.render(
                <React.StrictMode>
                    <ReportBody
                        report={report}
                        url={url}
                        screenshots={screenshots}
                    />
                </React.StrictMode>
            );
            // Give it time to render and load initial DOM
            setTimeout(resolve, 800);
        });

        // 1.5 WAIT FOR IMAGES TO LOAD
        const images = Array.from(sourceContainer.querySelectorAll('img'));
        await Promise.all(images.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise<void>(resolve => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
                setTimeout(() => resolve(), 3000);
            });
        }));

        // Calculate Page Dimensions
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 20; // pt

        // A4 Height in PX for our content width. 
        // A4 Height (842pt) - Margin (40pt) = 802pt safe height.
        // Scale ratio: 802pt / 0.867 (from 640px width) -> ~924px.
        // We set to 920 to be safe but maximize space for 2 cards.
        const PAGE_HEIGHT_PX = 920;

        // --- PREPARE LOGOS ---
        // 1. White Label Logo
        let whiteLabelImg: HTMLImageElement | null = null;
        if (whiteLabelLogo) {
            try {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = whiteLabelLogo;
                await new Promise<void>((resolve, reject) => {
                    if (img.complete) resolve();
                    img.onload = () => resolve();
                    img.onerror = (e) => reject(new Error(`WL Logo load failed: ${e}`));
                    // fallback
                    setTimeout(resolve, 2000);
                });
                whiteLabelImg = img;
            } catch (e) {
                console.warn("Failed to load WL logo", e);
            }
        }

        // 2. Default Branding Logo (Fallback)
        let defaultLogoImg: HTMLImageElement | null = null;
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = ASSETS.headerLogo;
            await new Promise<void>((resolve, reject) => {
                if (img.complete) resolve();
                img.onload = () => resolve();
                img.onerror = (e) => reject(new Error(`Default Logo load failed: ${e}`));
                setTimeout(resolve, 2000);
            });
            defaultLogoImg = img;
        } catch (e) {
            console.warn("Failed to load Default logo", e);
        }

        const createPageDiv = () => {
            const div = document.createElement('div');
            div.className = "flex flex-col gap-4 font-['DM_Sans'] bg-white text-slate-900 relative box-border";
            div.style.width = `${CONTENT_WIDTH}px`;
            div.style.minHeight = `${PAGE_HEIGHT_PX}px`;
            div.style.padding = '24px';

            // LOGO LOGIC: Use White Label if available, otherwise Default.
            const activeLogo = whiteLabelImg || defaultLogoImg;

            // CRITICAL: Top padding to prevent LOGO overlap
            // Logo is max 60px + 12px top pos = ~72px used. 
            // We give 88px top padding to maintain spacing.
            div.style.paddingTop = activeLogo ? '88px' : '24px';

            div.style.paddingBottom = '28px'; // Bottom safety
            div.style.backgroundColor = '#ffffff';

            div.style.position = 'absolute';
            div.style.left = '-10000px';
            div.style.top = '0';

            // Inject Logo if present
            if (activeLogo) {
                const logoClone = activeLogo.cloneNode(true) as HTMLImageElement;
                logoClone.style.position = 'absolute';
                logoClone.style.top = '12px';
                logoClone.style.right = '12px';
                // Enforce Max Size 60x60
                logoClone.style.maxHeight = '60px';
                logoClone.style.maxWidth = '60px';
                logoClone.style.width = 'auto';
                logoClone.style.height = 'auto';
                logoClone.style.objectFit = 'contain';

                div.appendChild(logoClone);
            }

            return div;
        };

        // 2. Extract Items
        const items = Array.from(sourceContainer.querySelectorAll('.pdf-item')) as HTMLElement[];
        const pages: HTMLElement[] = [];
        let currentPage = createPageDiv();
        document.body.appendChild(currentPage);
        pages.push(currentPage);

        // Tracking items for "max 2 cards" logic
        let cardsOnPage = 0;

        // 3. Distribute Items
        for (const item of items) {
            const isCard = item.classList.contains('pdf-card');
            const forceBreak = item.classList.contains('force-page-break-before');

            const isPageEmpty = currentPage.children.length === ((whiteLabelImg || defaultLogoImg) ? 1 : 0); // Account for logo if present

            if (forceBreak && !isPageEmpty) {
                currentPage = createPageDiv();
                document.body.appendChild(currentPage);
                pages.push(currentPage);
                cardsOnPage = 0;
            }

            // Append temporarily
            currentPage.appendChild(item);

            const currentHeight = currentPage.scrollHeight;
            // Use slightly loose check for "fits" to avoid premature breaking on tiny overages
            const contentFits = currentHeight <= PAGE_HEIGHT_PX;

            const cardLimitExceeded = isCard && (cardsOnPage >= 2);

            const isPageCurrentlyEmpty = currentPage.children.length === ((whiteLabelImg || defaultLogoImg) ? 2 : 1); // Logo + Item

            if (contentFits && !cardLimitExceeded) {
                if (isCard) cardsOnPage++;
            } else {
                // Determine if we FORCE move or keep it

                // If it's the *only* content item on the page and it doesn't fit, 
                // we HAVE to keep it (it's too big for one page, will be clipped/shrunk, but moving it won't help).
                // UNLESS it's the card limit causing the rejection.
                if (isPageCurrentlyEmpty && !cardLimitExceeded) {
                    if (isCard) cardsOnPage++;
                } else {
                    // Move to next page
                    currentPage.removeChild(item);

                    currentPage = createPageDiv();
                    document.body.appendChild(currentPage);
                    pages.push(currentPage);
                    cardsOnPage = 0;

                    currentPage.appendChild(item);
                    if (isCard) cardsOnPage++;
                }
            }
        }

        // 4. Generate PDF
        try {
            await document.fonts.ready;

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];

                const canvas = await html2canvas(page, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    windowWidth: CONTENT_WIDTH,
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.95);

                const imgWidth = pdfWidth - (margin * 2);
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                if (i > 0) pdf.addPage();

                pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);

                // Logo is now embedded in the page image, so no need to add it separately!
            }

            pdf.save(`audit-report-${url.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`);

        } catch (err) {
            console.error("PDF Gen Error:", err);
            setPdfError(err instanceof Error ? err.message : "Failed to generate PDF");
        } finally {
            document.body.removeChild(sourceContainer);
            pages.forEach(p => {
                if (document.body.contains(p)) document.body.removeChild(p);
            });
            setTimeout(() => root.unmount(), 0);
            setIsPdfGenerating(false);
        }
    };

    return (
        <div>
            <header className="text-center my-8 sm:my-12 px-4">
                <div className="flex flex-col items-center justify-center pt-8 pb-6 bg-slate-50 relative">
                    {/* User Badge (Top Right) */}
                    <div className="absolute top-4 right-4">
                        <UserBadge />
                    </div>

                    {isSharedView && whiteLabelLogo ? (
                        <img
                            src={whiteLabelLogo}
                            alt="White Label Logo"
                            className="mb-6 max-h-[140px] max-w-[140px] w-auto object-contain"
                        />
                    ) : (
                        <Logo className="mb-6" />
                    )}
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 text-center px-4">
                        Let's Put Your Website Through a UX Checkup
                    </h1>
                    <p className="mt-4 text-lg text-slate-600 text-center px-4 max-w-2xl">
                        AI-powered UX assessment to spot friction, gaps, and quick wins.
                        <span className="block mt-2 font-semibold" style={{ color: 'rgb(79, 70, 229)' }}>Clear insights. Practical fixes. No fluff.</span>
                    </p>
                </div></header>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200">
                {pdfError && (
                    <div className="m-4 sm:m-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        <p><strong>PDF Generation Failed:</strong> {pdfError}</p>
                    </div>
                )}

                {!isReportReady && (
                    <div className="p-4 sm:p-6">
                        <SkeletonLoader className="h-[100vh] w-full" />
                    </div>
                )}

                {isReportReady && (
                    <>
                        <div className="px-4 sm:px-6 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center py-4 md:py-0 gap-4">
                            <nav className="-mb-px grid grid-cols-2 gap-x-2 md:flex md:space-x-8" aria-label="Tabs">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors text-center ${activeTab === tab
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                            }`}
                                        aria-current={activeTab === tab ? 'page' : undefined}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </nav>
                            <div className="flex items-center justify-center flex-shrink-0 gap-3">
                                <button
                                    onClick={generatePdf}
                                    disabled={isPdfGenerating}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:opacity-50 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    {isPdfGenerating ? 'Generating...' : 'Download Report'}
                                </button>
                                {!isSharedView && (
                                    <button
                                        onClick={handleShareAudit}
                                        disabled={isSharing}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 disabled:opacity-50 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                                        </svg>
                                        {isSharing ? 'Sharing...' : 'Share Audit'}
                                    </button>
                                )}
                                {!isSharedView && (
                                    <button
                                        onClick={onRunNewAudit}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                        </svg>
                                        New Audit
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* AUTH BLOCKER OVERLAY */}
                        <div className="relative">
                            {isLocked && !isAuthLoading && (
                                <AuthBlocker
                                    isUnlocked={false}
                                    onUnlock={() => setIsLocked(false)}
                                    auditUrl={url}
                                />
                            )}

                            {/* Main Content with conditional blur */}
                            <div className={`p-4 sm:p-6 font-['DM_Sans'] transition-all duration-500 ${isLocked ? 'blur-sm pointer-events-none select-none h-[600px] overflow-hidden' : ''}`}>
                                {/* When locked, we force show UX Audit (but blurred) for better "sneak peek" effect */}
                                {isLocked ? (
                                    <DetailedAuditView
                                        auditData={ux}
                                        auditType="UX Audit"
                                    />
                                ) : (
                                    <>
                                        {activeTab === 'Executive Summary' && (
                                            <div>
                                                {/* Scores and Screenshot */}
                                                <div className="flex flex-col self-stretch">
                                                    {primaryScreenshotSrc ? (
                                                        <div className="self-stretch aspect-video mb-8 sm:mb-[60px] rounded-md border border-slate-200 overflow-hidden bg-white relative">
                                                            <img src={primaryScreenshotSrc} className="w-full absolute top-0 left-0" style={{ height: 'auto' }} alt="website screenshot" />
                                                        </div>
                                                    ) : <SkeletonLoader className="aspect-video w-full mb-8 sm:mb-[60px] rounded-md" />}
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                        <ScoreDisplayCard score={overallScore} label="Overall Score" />
                                                        <ScoreDisplayCard score={product.CategoryScore} label="Product Audit" />
                                                        <ScoreDisplayCard score={ux.CategoryScore} label="UX Audit" />
                                                        <ScoreDisplayCard score={visual.CategoryScore} label="Visual Design" />
                                                    </div>
                                                </div>

                                                <div className="my-8"></div>

                                                {/* Executive Summary Card */}
                                                {strategy?.ExecutiveSummary && (
                                                    <div className="mb-8 p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 border-2 border-indigo-200 rounded-2xl relative overflow-hidden shadow-lg">
                                                        {/* Decorative Background Elements */}
                                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                                            <svg className="w-32 h-32 text-indigo-600 transform rotate-12" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"></path>
                                                                <path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"></path>
                                                            </svg>
                                                        </div>
                                                        <div className="absolute bottom-0 left-0 p-4 opacity-5">
                                                            <svg className="w-24 h-24 text-purple-600 transform -rotate-12" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                        </div>
                                                        <div className="relative z-10">
                                                            <h3 className="text-indigo-900 font-bold text-xl mb-3 flex items-center gap-2">
                                                                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-2 rounded-lg shadow-md">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                                    </svg>
                                                                </span>
                                                                Executive Summary
                                                            </h3>
                                                            <p className="text-indigo-900/90 leading-relaxed text-base font-medium whitespace-pre-line">
                                                                {strategy.ExecutiveSummary}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Context Capture */}
                                                <DetailedAuditView auditData={strategy} auditType={'Strategic Foundation'} />

                                                <div className="my-8"></div>

                                                {/* Top 5 Issues */}
                                                <div className="force-page-break-before">
                                                    <h2 className="text-black text-base font-bold mb-4">Executive Summary: Top 5 Most Impactful Issues</h2>
                                                    <div className="flex flex-col self-stretch gap-3">
                                                        {Top5ContextualIssues.map((issue, index) => (
                                                            <React.Fragment key={index}>
                                                                <CriticalIssueCard issue={issue} />
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab !== 'Executive Summary' && (
                                            <DetailedAuditView
                                                auditData={activeTab === 'UX Audit' ? ux : activeTab === 'Product Audit' ? product : activeTab === 'Visual Design' ? visual : strategy}
                                                auditType={activeTab as DetailedAuditType}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
