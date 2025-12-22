import React from 'react';
import { SkeletonLoader } from '../SkeletonLoader';

// --- HELPERS ---

export const getScoreIndicatorData = (scoreOutOf10: number) => {
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

export function ScoreGauge({ score, size = 74, strokeWidth = 8 }: { score: number; size?: number; strokeWidth?: number }) {
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

export function ScoreIndicator({ score }: { score: number }) {
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

export function ScoreDisplayCard({ score, label }: { score?: number; label: string }) {
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
