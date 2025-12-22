import React from 'react';
import { CriticalIssue, ScoredParameter } from '../../types';
import { ScoreGauge, getScoreIndicatorData } from './ScoreComponents';

export function CriticalIssueCard({ issue }: { issue: CriticalIssue & { source?: string } }) {
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

export function ScoredParameterCard({ param }: { param: ScoredParameter }) {
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

export function AuditSubSectionHeader({ title, score, forceBreak }: { title: string; score?: number; forceBreak?: boolean }) {
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
