// src/app/instructor/StatsCard.tsx

import React from 'react'

type StatsCardProps = {
    title: string
    value: string | number
    change?: number
    icon: React.ReactNode
}

const StatsCard = ({title, value, change, icon}: StatsCardProps) => (
    <div className="stats-card">
        <div className="stats-icon">{icon}</div>
        <div className="stats-content">
            <h3 className="stats-title">{title}</h3>
            <p className="stats-value">{value}</p>
            {change && (
                <span
                    className={`stats-change ${change > 0 ? 'positive' : 'negative'}`}>
                    {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
                </span>
            )}
        </div>
    </div>
)

export default StatsCard
