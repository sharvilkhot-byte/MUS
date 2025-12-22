
import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AnalysisReport, CriticalIssue, ScoredParameter, ExpertKey, StrategyAudit, Screenshot, UXAudit, ProductAudit, VisualAudit } from '../types';
import { SkeletonLoader } from './SkeletonLoader';
import { Logo } from './Logo';
import toast from 'react-hot-toast';

import { saveSharedAudit } from '../services/auditStorage';
import { AuthBlocker } from './AuthBlocker';
import { getCurrentSession } from '../services/authService';

// --- Supabase Client Details ---
const supabaseUrl = 'https://sobtfbplbpvfqeubjxex.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvYnRmYnBsYnB2ZnFldWJqeGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNDgzMDYsImV4cCI6MjA3NDcyNDMwNn0.ewfxDwlapmRpfyvYD3ALb-WyL12ty1eP8nzKyrc66ho';
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

type DetailedAuditType = 'UX Audit' | 'Product Audit' | 'Visual Design' | 'Strategic Foundation';

// --- START OF ASSETS & STYLING HELPERS ---
const ASSETS = {
    // Icons from user's provided design
    recommendation: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/ti34aombIV/zp7uywub_expires_30_days.png",
    citations: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/ti34aombIV/izpk4e7a_expires_30_days.png",
    keyFindings: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/ti34aombIV/q6fd05yd_expires_30_days.png",
    personas: {
        one: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/ti34aombIV/ndgxu5iv_expires_30_days.png",
        two: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/ti34aombIV/zibh77po_expires_30_days.png",
        three: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/ti34aombIV/bb9spacl_expires_30_days.png",
    },
    strategyIcons: {
        domain: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/ti34aombIV/d33f2yh1_expires_30_days.png",
        purpose: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/ti34aombIV/ja78rqs0_expires_30_days.png",
        target: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/ti34aombIV/u3exi889_expires_30_days.png",
    },
    // Header/Divider assets
    headerLogo: "/logo.png",
};

const getScoreData = (scoreOutOf10: number) => {
    if (scoreOutOf10 >= 9) return { text: "Very Good", color: "#007000", bg: "#EDF6ED" };
    if (scoreOutOf10 >= 7) return { text: "Satisfactory", color: "#471900", bg: "#FFF6E6" };
    if (scoreOutOf10 >= 5) return { text: "Needs Improvement", color: "#471900", bg: "#FFF6E6" };
    return { text: "Critical", color: "#DC0909", bg: "#FDF0F0" };
};

const getScoreIndicatorData = (scoreOutOf10: number) => {
    if (scoreOutOf10 >= 9) return {
        text: "Very Good",
        textColor: "#00742B", // Matches provided design
        bgColor: "#EDF6ED", // Card BG
        boxColor: "#DDEEDD" // Score Box BG
    };
    if (scoreOutOf10 >= 7) return {
        text: "Satisfactory",
        textColor: "#A66800",
        bgColor: "#FFF6E6",
        boxColor: "#FFECC2" // Estimated darker shade for box
    };
    if (scoreOutOf10 >= 5) return {
        text: "Needs Improvement",
        textColor: "#A66800",
        bgColor: "#FFF6E6",
        boxColor: "#FFECC2"
    };
    return {
        text: "Critical",
        textColor: "#DC0909",
        bgColor: "#FDF0F0",
        boxColor: "#FCE4E4"
    };
};

const CONFIDENCE_STYLES = {
    high: 'text-[#00742B]',
    medium: 'text-amber-800',
    low: 'text-red-800',
};

// --- HELPER COMPONENTS ---

function ScoreGauge({ score, size = 74, strokeWidth = 8 }: { score: number; size?: number; strokeWidth?: number }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * Math.PI; // Half circle
    const cappedScore = Math.max(0, Math.min(10, score));
    const offset = circumference - (cappedScore / 10) * circumference;

    const getGaugeColor = (s: number) => {
        if (s >= 9) return "#00742B"; // Very Good - Green
        if (s >= 7) return "#A66800"; // Satisfactory / Needs Improvement - Brownish/Yellow
        if (s >= 5) return "#A66800"; // Satisfactory / Needs Improvement - Brownish/Yellow
        return "#D00000"; // Critical - Red
    };

    const color = getGaugeColor(cappedScore);
    const trackColor = "#9CA3AF"; // Darker gray (Gray 400) for better visibility on white

    return (
        <svg
            width={size}
            height={size / 2 + strokeWidth / 2}
            viewBox={`0 0 ${size} ${size / 2 + strokeWidth / 2}`}
            style={{ overflow: 'visible' }}
        >
            <path
                d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                fill="none"
                stroke={trackColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
            />
            <path
                d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{
                    transition: 'stroke-dashoffset 0.5s ease-out',
                }}
            />
        </svg>
    );
}

function ScoreIndicator({ score }: { score: number }) {
    const indicatorData = getScoreIndicatorData(score);
    const scoreText = Math.round(score);

    return (
        <div
            className="flex flex-col shrink-0 items-center py-[11px] px-[33px] gap-3 rounded-lg"
            style={{ backgroundColor: "#FFFFFF" }}
        >
            <div className="relative w-[74px] h-[41px]">
                <div className="absolute top-0 left-0">
                    <ScoreGauge score={score} />
                </div>
                <span className="text-black text-xs font-bold absolute bottom-[5px] inset-x-0 text-center">
                    {`${scoreText}/10`}
                </span>
            </div>
            <span className="text-[10px] font-bold" style={{ color: indicatorData.textColor }}>
                {indicatorData.text}
            </span>
        </div>
    );
}

function ScoreDisplayCard({ score, label }: { score?: number; label: string }) {
    if (score === undefined) return <SkeletonLoader className="h-32 flex-1 rounded-lg" />;

    const indicatorData = getScoreIndicatorData(score);
    const scoreText = score.toFixed(1);

    return (
        <div
            className="flex flex-1 flex-col items-center pt-[9px] pb-[9px] rounded-lg break-inside-avoid"
            style={{
                backgroundColor: indicatorData.bgColor,
                fontFamily: '"DM Sans", sans-serif'
            }}
        >
            <span className="text-[#000000] text-[12px] font-bold mb-[8px] text-center">{label}</span>
            <div className="flex flex-col items-center mb-[12px] px-2 sm:px-[23px] relative">
                <div style={{ width: '74px', height: '37px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0 }}>
                        <ScoreGauge score={score} size={74} strokeWidth={8} />
                    </div>
                    <span
                        className="absolute text-center text-[#000000] text-[12px] font-bold"
                        style={{ bottom: '-4px', left: 0, right: 0 }}
                    >
                        {scoreText}/10
                    </span>
                </div>
            </div>
            <span className="text-[10px] font-bold text-center" style={{ color: indicatorData.textColor }}>
                {indicatorData.text}
            </span>
        </div>
    );
}

function CriticalIssueCard({ issue }: { issue: CriticalIssue & { source?: string } }) {
    const indicatorData = getScoreIndicatorData(issue.Score);
    const confidence = issue.Confidence || 'high';
    const confColor = confidence === 'high' ? '#00742B' : (confidence === 'medium' ? '#A66800' : '#D00000');
    const confText = confidence.charAt(0).toUpperCase() + confidence.slice(1) + " Confidence";

    return (
        <div
            className="flex flex-col items-start self-stretch p-4 rounded-xl break-inside-avoid mb-3 gap-6 pdf-item pdf-card"
            style={{ backgroundColor: indicatorData.bgColor, fontFamily: '"DM Sans", sans-serif' }}
        >
            {/* Top Row: Content Left, Score Right */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-start self-stretch gap-6">
                {/* Left Column: Confidence, Title, Analysis */}
                <div className="flex flex-1 flex-col gap-[6px]">
                    <div className="flex flex-col items-start">
                        <span className="text-[10px] font-bold" style={{ color: confColor }}>
                            {confText} {issue.source ? `• ${issue.source}` : ''}
                        </span>
                    </div>
                    <div className="flex flex-col gap-[7px]">
                        <span className="text-[#000000] text-[14px] font-bold">{issue.Issue}</span>
                        <span className="text-[#74736F] text-[12px] leading-[150%]">{issue.Analysis}</span>
                    </div>
                </div>

                {/* Right Column: Score Box */}
                <div
                    className="flex flex-col items-center shrink-0 rounded-lg p-4 sm:py-[34px] sm:px-[33px] gap-2 w-full sm:w-auto"
                    style={{ backgroundColor: indicatorData.boxColor }}
                >
                    <div className="relative w-[74px] h-[37px]">
                        <div className="absolute top-0 left-0">
                            <ScoreGauge score={issue.Score} size={74} strokeWidth={8} />
                        </div>
                        <span className="absolute bottom-0 inset-x-0 text-center text-black text-[12px] font-bold">
                            {Math.round(issue.Score)}/10
                        </span>
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: indicatorData.textColor }}>
                        {indicatorData.text}
                    </span>
                </div>
            </div>

            {/* Bottom Section: Findings, Recommendations, Citations */}
            <div className="flex flex-col self-stretch gap-4">
                {/* Key Findings */}
                {issue.KeyFinding && issue.KeyFinding.toLowerCase() !== 'n/a' && (
                    <div className="flex flex-col gap-[3px] pr-0 lg:pr-[41px] pb-[3px]">
                        <span className="text-[#000000] text-[12px] font-bold">👁️ Key Findings</span>
                        <span className="text-[#74736F] text-[12px] leading-[150%]">{issue.KeyFinding}</span>
                    </div>
                )}

                {/* Recommendation */}
                {issue.Recommendation && issue.Recommendation.toLowerCase() !== 'n/a' && (
                    <div className="flex flex-col gap-[3px] pr-0 lg:pr-[40px]">
                        <span className="text-[#000000] text-[12px] font-bold">💡 Recommendation</span>
                        <span className="text-[#74736F] text-[12px] leading-[150%]">{issue.Recommendation}</span>
                    </div>
                )}

                {/* Citations */}
                {issue.Citations?.length > 0 && (
                    <div className="flex flex-col pt-4 gap-[6px]">
                        <span className="text-[#000000] text-[12px] font-bold">🔗 Citations</span>
                        <div className="flex flex-col gap-2">
                            {issue.Citations.map((citation, i) => (
                                <span key={i} className="text-[#6B6A67] text-[12px] leading-[150%]">
                                    “{citation}”
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ScoredParameterCard({ param }: { param: ScoredParameter }) {
    const isNotApplicable = param.Score === 0;
    const confidence = param.Confidence || 'low';
    const confColor = confidence === 'high' ? '#00742B' : (confidence === 'medium' ? '#A66800' : '#D00000');
    const confText = confidence.charAt(0).toUpperCase() + confidence.slice(1) + " Confidence";
    const title = param.ParameterName?.replace(/([A-Z])/g, ' $1').trim() || 'Parameter';

    const indicatorData = isNotApplicable
        ? { bgColor: '#F3F4F6', boxColor: '#E5E7EB', textColor: '#6B7280', text: 'N/A' }
        : getScoreIndicatorData(param.Score);

    return (
        <div
            className="flex flex-col items-start self-stretch p-4 rounded-xl break-inside-avoid mb-6 gap-6 pdf-item pdf-card"
            style={{ backgroundColor: indicatorData.bgColor, fontFamily: '"DM Sans", sans-serif' }}
        >
            {/* Top Row: Content Left, Score Right */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-start self-stretch gap-6">
                {/* Left Column: Confidence, Title, Analysis */}
                <div className="flex flex-1 flex-col gap-[6px]">
                    {!isNotApplicable && (
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-bold" style={{ color: confColor }}>
                                {confText}
                            </span>
                        </div>
                    )}
                    <div className="flex flex-col gap-[7px]">
                        <span className="text-[#000000] text-[14px] font-bold">{title}</span>
                        <span className="text-[#74736F] text-[12px] leading-[150%]">{param.Analysis}</span>
                    </div>
                </div>

                {/* Right Column: Score Box */}
                {!isNotApplicable && (
                    <div
                        className="flex flex-col items-center shrink-0 rounded-lg p-4 sm:py-[34px] sm:px-[33px] gap-2 w-full sm:w-auto"
                        style={{ backgroundColor: indicatorData.boxColor }}
                    >
                        <div className="relative w-[74px] h-[37px]">
                            <div className="absolute top-0 left-0">
                                <ScoreGauge score={param.Score} size={74} strokeWidth={8} />
                            </div>
                            <span className="absolute bottom-0 inset-x-0 text-center text-black text-[12px] font-bold">
                                {param.Score}/10
                            </span>
                        </div>
                        <span className="text-[10px] font-bold" style={{ color: indicatorData.textColor }}>
                            {indicatorData.text}
                        </span>
                    </div>
                )}
            </div>

            {/* Bottom Section: Findings, Recommendations, Citations */}
            <div className="flex flex-col self-stretch gap-4">
                {/* Key Findings */}
                {param.KeyFinding && param.KeyFinding.toLowerCase() !== 'n/a' && (
                    <div className="flex flex-col gap-[3px] pr-0 lg:pr-[41px] pb-[3px]">
                        <span className="text-[#000000] text-[12px] font-bold">👁️ Key Findings</span>
                        <span className="text-[#74736F] text-[12px] leading-[150%]">{param.KeyFinding}</span>
                    </div>
                )}

                {/* Recommendation */}
                {param.Recommendation && param.Recommendation.toLowerCase() !== 'n/a' && (
                    <div className="flex flex-col gap-[3px] pr-0 lg:pr-[40px]">
                        <span className="text-[#000000] text-[12px] font-bold">💡 Recommendation</span>
                        <span className="text-[#74736F] text-[12px] leading-[150%]">{param.Recommendation}</span>
                    </div>
                )}

                {/* Citations */}
                {param.Citations?.length > 0 && (
                    <div className="flex flex-col pt-4 gap-[6px]">
                        <span className="text-[#000000] text-[12px] font-bold">🔗 Citations</span>
                        <div className="flex flex-col gap-2">
                            {param.Citations.map((citation, i) => (
                                <span key={i} className="text-[#6B6A67] text-[12px] leading-[150%]">
                                    “{citation}”
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function AuditSubSectionHeader({ title, score, forceBreak }: { title: string; score?: number; forceBreak?: boolean }) {
    return (
        <div className={`flex justify-between items-center self-stretch mb-4 rounded-tl-3xl rounded-tr-3xl break-inside-avoid pdf-item pdf-subheader ${forceBreak ? 'force-page-break-before' : ''}`}>
            <h3 className="text-black text-base font-bold">{title}</h3>
            {score !== undefined && (
                <div className="flex shrink-0 items-start py-1">
                    <span className="text-black text-xs font-bold mr-1">Assessment Score</span>
                    <span className="text-[#A66800] text-xs font-bold">{score.toFixed(0)} / 100</span>
                </div>
            )}
        </div>
    );
}

function UserPersonasDisplay({ personas }: { personas?: StrategyAudit['UserPersonas'] }) {
    // New assets for personas
    const personaAvatars = [
        ASSETS.personas.one,
        ASSETS.personas.two,
        ASSETS.personas.three,
    ];

    if (!personas) return null;

    return (
        <div className="flex flex-col gap-3 font-['DM_Sans']">
            {personas.map((p, i) => (
                <div key={i} className="flex flex-col bg-[#F7FAFF] rounded-xl p-4 mb-3 gap-6 break-inside-avoid pdf-item pdf-card">
                    {/* Header Row */}
                    <div className="flex items-start gap-1.5 self-stretch">
                        <img
                            src={personaAvatars[i % 3]}
                            className="w-[39px] h-[39px] object-fill shrink-0"
                            alt={`${p.Name} avatar`}
                        />
                        <div className="flex flex-1 flex-col items-start gap-0.5">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center self-stretch">
                                <span className="text-[#000000] text-[16px] font-bold">{p.Name}</span>
                                <div className="flex flex-col items-start pb-[1px] shrink-0">
                                    <span className="text-[#00742B] text-[10px] font-bold">Age - {p.Age}</span>
                                </div>
                            </div>
                            <span className="text-[#74736F] text-[12px]">{p.Occupation} from {p.Location}</span>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex flex-col self-stretch gap-4">
                        {/* Needs & Behavior */}
                        <div className="flex flex-col items-start self-stretch pr-0 sm:pr-[15px]">
                            <span className="text-[#000000] text-[12px] font-bold">🔍 Needs & Behavior</span>
                            <span className="text-[#6D6F71] text-[12px]">{p.UserNeedsBehavior}</span>
                        </div>

                        {/* Pain Points */}
                        <div className="flex flex-col items-start self-stretch">
                            <span className="text-[#000000] text-[12px] font-bold">🎯 Pain Points & Opportunities</span>
                            <span className="text-[#6D6F71] text-[12px]">{p.PainPointOpportunity}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function StrategyAuditDisplay({ audit }: { audit: StrategyAudit }) {
    const { DomainAnalysis, PurposeAnalysis, TargetAudience, UserPersonas } = audit || {};

    // Shared typography class
    const bodyTextStyle = "text-[#6C6B67] text-[12px] font-medium leading-[150%]";

    return (
        <div className="flex flex-col self-stretch mb-5 gap-4 font-['DM_Sans']">
            <div className="force-page-break-before">
                <h3 className="text-black text-base font-bold break-inside-avoid pdf-item pdf-section-title">Context Capture</h3>
                <div className="flex flex-col self-stretch gap-3">

                    {/* Domain Analysis */}
                    {DomainAnalysis && (
                        <div className="flex flex-col bg-[#F7FAFF] rounded-xl p-4 mt-4 mb-3 gap-2 break-inside-avoid pdf-item pdf-card">
                            {/* Header Row */}
                            <div className="flex items-start gap-6 self-stretch">
                                <div className="flex-1 flex flex-col items-start gap-[6px] pb-2 order-2 sm:order-1">
                                    <div className="flex flex-col items-start pb-[1px] self-stretch">
                                        <span className="text-[#00742B] text-[10px] font-bold">
                                            {DomainAnalysis.Confidence?.charAt(0).toUpperCase() + DomainAnalysis.Confidence?.slice(1) || "High"} Confidence
                                        </span>
                                    </div>
                                    <span className="text-black text-[14px] font-bold">Domain Analysis</span>
                                </div>
                                <img src={ASSETS.strategyIcons.domain} className="w-12 h-12 object-fill order-1 sm:order-2" alt="Domain Icon" />
                            </div>
                            {/* Content */}
                            <div className="flex flex-col items-start self-stretch pt-1">
                                {DomainAnalysis.Items?.map((item, i) => (
                                    <span key={i} className={`${bodyTextStyle} mb-2`}>{item}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Purpose Analysis */}
                    {PurposeAnalysis && (
                        <div className="flex flex-col items-start bg-[#F7FAFF] rounded-xl p-4 mb-3 break-inside-avoid pdf-item pdf-card">
                            {/* Header Row */}
                            <div className="flex items-start gap-6 self-stretch mb-4 sm:mb-[21px]">
                                <div className="flex flex-1 flex-col items-start gap-[6px] pb-2 order-2 sm:order-1">
                                    <div className="flex flex-col items-start pb-[1px] self-stretch">
                                        <span className="text-[#00742B] text-[10px] font-bold">
                                            {PurposeAnalysis.Confidence?.charAt(0).toUpperCase() + PurposeAnalysis.Confidence?.slice(1) || "High"} Confidence
                                        </span>
                                    </div>
                                    <span className="text-black text-[14px] font-bold">Purpose Analysis</span>
                                </div>
                                <img src={ASSETS.strategyIcons.purpose} className="w-12 h-12 object-fill order-1 sm:order-2" alt="Purpose Icon" />
                            </div>

                            {/* Primary Purpose */}
                            <span className="text-black text-[12px] font-bold mb-1">💡Primary Purpose</span>
                            <span className={`${bodyTextStyle} whitespace-pre-line mb-4 w-full max-w-full sm:max-w-[400px]`}>
                                {PurposeAnalysis.PrimaryPurpose?.join('\n')}
                            </span>

                            {/* Key Objectives */}
                            <div className="flex flex-col items-start self-stretch">
                                <span className="text-black text-[12px] font-bold mb-1">👁️ Key Objectives</span>
                                <span className={`${bodyTextStyle} w-full`}>
                                    {PurposeAnalysis.KeyObjectives}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Target Audience */}
                    {TargetAudience && (
                        <div className="flex flex-col bg-[#F7FAFF] rounded-xl p-4 gap-3 break-inside-avoid pdf-item pdf-card">
                            {/* Header Row */}
                            <div className="flex items-start gap-6 self-stretch">
                                <div className="flex flex-1 flex-col items-start gap-[6px] pb-2 order-2 sm:order-1">
                                    <div className="flex flex-col items-start pb-[1px] self-stretch">
                                        <span className="text-[#00742B] text-[10px] font-bold">
                                            {TargetAudience.Confidence?.charAt(0).toUpperCase() + TargetAudience.Confidence?.slice(1) || "High"} Confidence
                                        </span>
                                    </div>
                                    <span className="text-black text-[14px] font-bold">Target Audience</span>
                                </div>
                                <img src={ASSETS.strategyIcons.target} className="w-12 h-12 object-fill order-1 sm:order-2" alt="Target Icon" />
                            </div>

                            {/* Content Grid */}
                            <div className="flex flex-col self-stretch gap-4">
                                {/* Website Type */}
                                <div className="flex flex-col items-start self-stretch">
                                    <span className="text-black text-[12px] font-bold mb-1">🌐 Website Type</span>
                                    <span className={bodyTextStyle}>{TargetAudience.WebsiteType}</span>
                                </div>

                                {/* Primary Audience */}
                                <div className="flex flex-col items-start self-stretch gap-[6px]">
                                    <span className="text-black text-[12px] font-bold">👥 Primary Audience</span>
                                    <div className="flex flex-col items-start self-stretch gap-[6px]">
                                        {TargetAudience.Primary.map((p, i) => (
                                            <span key={i} className={bodyTextStyle}>{p}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Demographics & Psychographics */}
                                <div className="flex flex-col self-stretch pt-4 gap-[6px]">
                                    <div className="flex flex-col items-start pb-[1px] self-stretch">
                                        <span className="text-black text-[12px] font-bold">📊 Demographics & Psychographics</span>
                                    </div>
                                    <div className="flex flex-col gap-2 self-stretch">
                                        <span className={bodyTextStyle}>{TargetAudience.DemographicsPsychographics}</span>
                                    </div>
                                </div>

                                {/* Market Segmentation */}
                                <div className="flex flex-col items-start self-stretch pr-0 sm:pr-3 gap-[6px]">
                                    <span className="text-black text-[12px] font-bold">🏪 Market Segmentation</span>
                                    <span className={bodyTextStyle}>{TargetAudience.MarketSegmentation}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {UserPersonas?.length > 0 && (
                <div className="flex flex-col self-stretch gap-4 mt-5 force-page-break-before">
                    <h3 className="text-black text-base font-bold break-inside-avoid pdf-item pdf-section-title">User Personas</h3>
                    <UserPersonasDisplay personas={UserPersonas} />
                </div>
            )}
        </div>
    );
}

function mapAuditToSections(audit: any, type: DetailedAuditType) {
    if (!audit) return [];
    switch (type) {
        case 'UX Audit': return [
            { title: 'Usability Heuristics', data: audit.UsabilityHeuristics },
            { title: 'Usability Metrics', data: audit.UsabilityMetrics },
            { title: 'Accessibility Compliance', data: audit.AccessibilityCompliance },
        ];
        case 'Product Audit': return [
            { title: 'Market Fit & Business Alignment', data: audit.MarketFitAndBusinessAlignment },
            { title: 'User Retention & Engagement', data: audit.UserRetentionAndEngagement },
            { title: 'Conversion Optimization', data: audit.ConversionOptimization },
        ];
        case 'Visual Design': return [
            { title: 'UI Consistency & Branding', data: audit.UIConsistencyAndBranding },
            { title: 'Aesthetic & Emotional Appeal', data: audit.AestheticAndEmotionalAppeal },
            { title: 'Responsiveness & Adaptability', data: audit.ResponsivenessAndAdaptability },
        ];
        default: return [];
    }
}

function DetailedAuditView({ auditData, auditType }: { auditData: UXAudit | ProductAudit | VisualAudit | StrategyAudit | undefined, auditType: DetailedAuditType }) {
    if (!auditData) {
        return <SkeletonLoader className="h-96 w-full" />;
    }

    if (auditType === 'Strategic Foundation') {
        return (
            <div className="self-stretch">
                <StrategyAuditDisplay audit={auditData as StrategyAudit} />
            </div>
        );
    }

    // Cast to generic type that has the common fields for UX, Product, Visual
    const audit = auditData as (UXAudit | ProductAudit | VisualAudit);
    const sections = mapAuditToSections(audit, auditType);

    const isFirstSection = (index: number) => index === 0;

    return (
        <div className="flex flex-col self-stretch gap-6 font-['DM_Sans']">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 break-inside-avoid pdf-item pdf-section-title">{/* Page break is handled by wrapper in ReportBody */}Detailed {auditType}</h2>
            {/* Detailed Sections */}
            {sections.map((section, index) => (
                section.data && section.data.Parameters && (
                    <div key={section.title} className="mb-5">
                        <AuditSubSectionHeader title={section.title} score={section.data.SectionScore * 10} forceBreak={!isFirstSection(index)} />
                        <div className="flex flex-col self-stretch gap-3">
                            {section.data.Parameters.map((p: ScoredParameter, i: number) => <ScoredParameterCard key={i} param={p} />)}
                        </div>
                    </div>
                )
            ))}
        </div>
    );
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 break-inside-avoid">
                    <ScoreDisplayCard score={overallScore} label="Overall Score" />
                    {product ? <ScoreDisplayCard score={product.CategoryScore} label="Product Audit" /> : <SkeletonLoader className="h-32 flex-1 rounded-lg" />}
                    {ux ? <ScoreDisplayCard score={ux.CategoryScore} label="UX Audit" /> : <SkeletonLoader className="h-32 flex-1 rounded-lg" />}
                    {visual ? <ScoreDisplayCard score={visual.CategoryScore} label="Visual Design" /> : <SkeletonLoader className="h-32 flex-1 rounded-lg" />}
                </div>
            </div>

            {/* Executive Summary Issues */}
            <div className="self-stretch force-page-break-before">
                <h2 className="text-black text-base font-bold mt-8 mb-4 break-inside-avoid pdf-item pdf-section-title force-page-break-before">Executive Summary: Top 5 Most Impactful Issues</h2>
                <div className="flex flex-col self-stretch gap-3">
                    {allIssues.length > 0 ? (
                        allIssues.map((issue, index) => <CriticalIssueCard key={index} issue={issue} />)
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

    // Auth Blocking State
    const [isLocked, setIsLocked] = useState(!isSharedView);

    // Check session on mount REMOVED to enforce blocker every time
    // React.useEffect(() => {
    //     getCurrentSession().then(session => {
    //         if (session) {
    //             setIsLocked(false);
    //         }
    //     });
    // }, []);

    const TABS = ['Executive Summary', 'UX Audit', 'Product Audit', 'Visual Design'];

    const { "UX Audit expert": ux, "Product Audit expert": product, "Visual Audit expert": visual, "Strategy Audit expert": strategy, Top5ContextualIssues } = report || {};

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

    const auditDataMap = {
        'UX Audit': ux,
        'Product Audit': product,
        'Visual Design': visual,
        'Strategic Foundation': strategy,
    };

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
                {/* Report Header in UI - Always show Default Logo */}
                <div className="flex flex-col items-center justify-center pt-8 pb-6 bg-slate-50">
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
                            {isLocked && (
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

                                                {/* Context Capture */}
                                                <DetailedAuditView auditData={strategy} auditType={'Strategic Foundation'} />

                                                <div className="my-8"></div>

                                                {/* Top 5 Issues */}
                                                <div className="force-page-break-before">
                                                    <h2 className="text-black text-base font-bold mb-4">Executive Summary: Top 5 Most Impactful Issues</h2>
                                                    <div className="flex flex-col self-stretch gap-3">
                                                        {Top5ContextualIssues.map((issue, index) => <CriticalIssueCard key={index} issue={issue} />)}
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
