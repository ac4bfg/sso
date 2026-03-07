"use client"

import { useState } from "react"
import { ResponsiveContainer, ComposedChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts"

// Cost To Go starts from the last actual point and projects forward as dashed line
const DATA = [
    { month: 'May', plan: 0, actual: 0, costToGo: null },
    { month: 'Jun', plan: 15, actual: 10, costToGo: null },
    { month: 'Jul', plan: 35, actual: 25, costToGo: null },
    { month: 'Aug', plan: 55, actual: 45, costToGo: null },
    { month: 'Sep', plan: 75, actual: 60, costToGo: 60 },  // Bridge point: same as last actual
    { month: 'Oct', plan: 85, actual: null, costToGo: 72 },
    { month: 'Nov', plan: 95, actual: null, costToGo: 88 },
    { month: 'Dec', plan: 100, actual: null, costToGo: 100 },
]

export function SCurveChart() {
    const [hiddenSeries, setHiddenSeries] = useState<string[]>([])
    const [exitingSeries, setExitingSeries] = useState<string[]>([])

    const toggleSeries = (dataKey: string) => {
        // If hidden, show it
        if (hiddenSeries.includes(dataKey)) {
            setHiddenSeries((prev) => prev.filter((key) => key !== dataKey))
            return
        }

        // If exiting, cancel exit (show it)
        if (exitingSeries.includes(dataKey)) {
            setExitingSeries((prev) => prev.filter((key) => key !== dataKey))
            return
        }

        // Otherwise, start exit sequence
        setExitingSeries((prev) => [...prev, dataKey])
        setTimeout(() => {
            setExitingSeries((prevExiting) => {
                if (prevExiting.includes(dataKey)) {
                    setHiddenSeries((prev) => [...prev, dataKey])
                    return prevExiting.filter((key) => key !== dataKey)
                }
                return prevExiting
            })
        }, 1100)
    }

    const CustomDot = (props: any) => {
        const { cx, cy, stroke, dataKey } = props
        const isExiting = exitingSeries.includes(dataKey)

        if (!cx || !cy) return null

        return (
            <circle
                cx={cx}
                cy={cy}
                r={4}
                fill={stroke}
                className={isExiting ? "animate-dot-exit" : ""}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
        )
    }

    return (
        <div className="h-full w-full min-h-[300px] min-w-0">
            <style jsx global>{`
                @keyframes wipeLeft {
                    from { clip-path: inset(0 0 0 0); }
                    to { clip-path: inset(0 100% 0 0); }
                }
                @keyframes fadeOut {
                    from { opacity: 1; transform: scale(1); }
                    to { opacity: 0; transform: scale(0); }
                }
                .animate-line-exit {
                    animation: wipeLeft 1s ease-in-out forwards !important;
                    transform-box: fill-box;
                }
                .animate-dot-exit {
                    animation: fadeOut 0.3s ease-in forwards !important;
                }
            `}</style>
            <ResponsiveContainer width="100%" height="100%" debounce={300}>
                <ComposedChart data={DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} dy={10} />
                    <YAxis yAxisId="left" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} tick={{ fill: '#64748b' }} width={40} />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                        cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                        formatter={(value: any) => [`${value}%`, undefined]}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px', cursor: 'pointer' }}
                        iconType="circle"
                        onClick={(e) => toggleSeries(e.dataKey as string)}
                        // @ts-ignore
                        payload={[
                            { value: 'RAP (Budget)', type: 'circle', id: 'plan', color: hiddenSeries.includes('plan') || exitingSeries.includes('plan') ? '#94a3b8' : '#d4af37' },
                            { value: 'Realization', type: 'circle', id: 'actual', color: hiddenSeries.includes('actual') || exitingSeries.includes('actual') ? '#94a3b8' : '#334155' },
                            { value: 'Cost To Go', type: 'circle', id: 'costToGo', color: hiddenSeries.includes('costToGo') || exitingSeries.includes('costToGo') ? '#94a3b8' : '#10b981' }
                        ]}
                    />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="plan"
                        name="RAP (Budget)"
                        stroke="#d4af37"
                        strokeWidth={3}
                        dot={<CustomDot dataKey="plan" />}
                        activeDot={{ r: 6 }}
                        hide={hiddenSeries.includes('plan')}
                        className={exitingSeries.includes('plan') ? "animate-line-exit" : ""}
                        isAnimationActive={!exitingSeries.includes('plan')}
                    />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="actual"
                        name="Realization"
                        stroke="#334155"
                        strokeWidth={3}
                        dot={<CustomDot dataKey="actual" />}
                        activeDot={{ r: 6 }}
                        hide={hiddenSeries.includes('actual')}
                        className={exitingSeries.includes('actual') ? "animate-line-exit" : ""}
                        isAnimationActive={!exitingSeries.includes('actual')}
                    />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="costToGo"
                        name="Cost To Go"
                        stroke="#10b981"
                        strokeWidth={3}
                        strokeDasharray="8 4"
                        dot={<CustomDot dataKey="costToGo" />}
                        activeDot={{ r: 6 }}
                        connectNulls={false}
                        hide={hiddenSeries.includes('costToGo')}
                        className={exitingSeries.includes('costToGo') ? "animate-line-exit" : ""}
                        isAnimationActive={!exitingSeries.includes('costToGo')}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    )
}
