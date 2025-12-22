import React from 'react';
import { UXAudit, ProductAudit, VisualAudit, StrategyAudit, ScoredParameter } from '../../types';
import { SkeletonLoader } from '../SkeletonLoader';
import { AuditSubSectionHeader, ScoredParameterCard } from './AuditCards';
import { StrategyAuditDisplay } from './StrategyComponents';

export type DetailedAuditType = 'UX Audit' | 'Product Audit' | 'Visual Design' | 'Strategic Foundation';

function mapAuditToSections(audit: UXAudit | ProductAudit | VisualAudit, type: DetailedAuditType) {
    if (!audit) return [];
    switch (type) {
        case 'UX Audit': return [
            { title: 'Usability Heuristics', data: (audit as UXAudit).UsabilityHeuristics },
            { title: 'Usability Metrics', data: (audit as UXAudit).UsabilityMetrics },
            { title: 'Accessibility Compliance', data: (audit as UXAudit).AccessibilityCompliance },
        ];
        case 'Product Audit': return [
            { title: 'Market Fit & Business Alignment', data: (audit as ProductAudit).MarketFitAndBusinessAlignment },
            { title: 'User Retention & Engagement', data: (audit as ProductAudit).UserRetentionAndEngagement },
            { title: 'Conversion Optimization', data: (audit as ProductAudit).ConversionOptimization },
        ];
        case 'Visual Design': return [
            { title: 'UI Consistency & Branding', data: (audit as VisualAudit).UIConsistencyAndBranding },
            { title: 'Aesthetic & Emotional Appeal', data: (audit as VisualAudit).AestheticAndEmotionalAppeal },
            { title: 'Responsiveness & Adaptability', data: (audit as VisualAudit).ResponsivenessAndAdaptability },
        ];
        default: return [];
    }
}

export function DetailedAuditView({ auditData, auditType }: { auditData: UXAudit | ProductAudit | VisualAudit | StrategyAudit | undefined, auditType: DetailedAuditType }) {
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
