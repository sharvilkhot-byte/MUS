import React from 'react';
import { StrategyAudit } from '../../types';
import { ASSETS } from './constants';

export function UserPersonasDisplay({ personas }: { personas?: StrategyAudit['UserPersonas'] }) {
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

export function StrategyAuditDisplay({ audit }: { audit: StrategyAudit }) {
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
