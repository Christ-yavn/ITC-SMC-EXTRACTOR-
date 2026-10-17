import React, { useState, useEffect, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import {
  parseFixturesFromContent,
  type OhlcFixture,
  type OhlcFixtureBar,
  type OhlcFixtureExpectedEvent,
} from '../utils/pipeline.ts';

export {
  parseFixturesFromContent,
  type OhlcFixture,
  type OhlcFixtureBar,
  type OhlcFixtureExpectedEvent,
};


interface IctCandleChartSvgProps {
  concept?: string;
  content?: string;
  className?: string;
}

export const IctCandleChartSvg: React.FC<IctCandleChartSvgProps> = ({
  concept = 'BPR / FVG',
  content,
  className = '',
}) => {
  const fixtures = useMemo(() => parseFixturesFromContent(content), [content]);
  const [selectedFixtureIdx, setSelectedFixtureIdx] = useState(0);
  const activeFixture = fixtures[selectedFixtureIdx] || fixtures[0];

  const [activeBarIdx, setActiveBarIdx] = useState<number>(activeFixture.bars.length - 1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    setActiveBarIdx(activeFixture.bars.length - 1);
    setIsPlaying(false);
  }, [selectedFixtureIdx, activeFixture.bars.length]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveBarIdx((prev) => {
        if (prev >= activeFixture.bars.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 850);
    return () => clearInterval(timer);
  }, [isPlaying, activeFixture.bars.length]);

  const currentBar = activeFixture.bars[activeBarIdx] || activeFixture.bars[0];
  const activeEvents = activeFixture.expected.filter((e) => e.t <= currentBar.t);
  const currentEvent = [...activeFixture.expected].reverse().find((e) => e.t === currentBar.t);

  // Compute price scale across all bars in activeFixture
  const { minPrice, maxPrice, zoneEvent } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const b of activeFixture.bars) {
      if (b.l < min) min = b.l;
      if (b.h > max) max = b.h;
    }
    for (const e of activeFixture.expected) {
      if (typeof e.zone_low === 'number' && e.zone_low < min) min = e.zone_low;
      if (typeof e.zone_high === 'number' && e.zone_high > max) max = e.zone_high;
    }
    const zEvt =
      activeFixture.expected.find(
        (e) =>
          typeof e.zone_low === 'number' &&
          typeof e.zone_high === 'number' &&
          (typeof e.ce_50 === 'number' || e.event.includes('BPR') || e.event.includes('ZONE'))
      ) ||
      activeFixture.expected.find(
        (e) => typeof e.zone_low === 'number' && typeof e.zone_high === 'number'
      );
    const pad = (max - min) * 0.15 || 0.001;
    return { minPrice: min - pad, maxPrice: max + pad, zoneEvent: zEvt };
  }, [activeFixture]);

  const priceToY = (p: number) => {
    const ratio = (p - minPrice) / (maxPrice - minPrice || 1);
    return Math.round(210 - ratio * 175);
  };

  // Derive FSM states at current bar
  const zoneState = useMemo(() => {
    if (activeEvents.some((e) => e.event.includes('INVALID'))) return 'INVALIDATED';
    if (
      activeEvents.some(
        (e) =>
          e.event.includes('ENTRY') ||
          e.event.includes('RETEST') ||
          e.event.includes('MITIGAT') ||
          e.event.includes('TOUCHED')
      )
    ) {
      return 'MITIGATED_PARTIAL';
    }
    if (activeEvents.some((e) => e.event.includes('ZONE_FORMED') || e.event.includes('ACTIVE'))) return 'ACTIVE';
    if (currentBar.t >= 2) return 'CANDIDATE';
    return 'NONE';
  }, [activeEvents, currentBar.t]);

  const tradeState = useMemo(() => {
    if (activeEvents.some((e) => e.event.includes('ABORT') || e.event.includes('INVALID'))) return 'ABORTED';
    if (activeEvents.some((e) => e.event.includes('TARGET') || e.event.includes('TP'))) return 'CLOSED_TP';
    if (activeEvents.some((e) => e.event.includes('ENTRY') || e.event.includes('TOUCHED_VALID'))) return 'ENTERED';
    if (activeEvents.some((e) => e.event.includes('ZONE_FORMED') || e.event.includes('ACTIVE'))) return 'ARMED';
    return 'IDLE';
  }, [activeEvents]);


  return (
    <div className={`relative rounded-xl overflow-hidden border border-white/10 bg-[#090D17] ${className}`}>
      {/* Chart Top Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-white/[0.04] border-b border-white/10 text-[10px] font-mono text-slate-400 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-white">{activeFixture.fixture_id}</span>
          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
            {concept}
          </span>
          {fixtures.length > 1 && (
            <div className="flex items-center gap-1 ml-1">
              {fixtures.map((fx, idx) => (
                <button
                  key={fx.fixture_id}
                  type="button"
                  onClick={() => setSelectedFixtureIdx(idx)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                    selectedFixtureIdx === idx
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {fx.fixture_id}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active Bar OHLC & FSM Telemetry */}
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="text-cyan-400 font-bold">Bougie t={currentBar.t}</span>
          <span>O: {currentBar.o.toFixed(4)}</span>
          <span>H: {currentBar.h.toFixed(4)}</span>
          <span>L: {currentBar.l.toFixed(4)}</span>
          <span className={currentBar.c >= currentBar.o ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            C: {currentBar.c.toFixed(4)}
          </span>
        </div>
      </div>

      {/* FSM Status & Replay Controls Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#060911] border-b border-white/10 gap-2 text-[10px] font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
            ZONE_FSM: <strong className="text-cyan-400">{zoneState}</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
            TRADE_FSM: <strong className="text-emerald-400">{tradeState}</strong>
          </span>
          {currentEvent && (
            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
              ⚡ {currentEvent.event}
            </span>
          )}
        </div>

        {/* Interactive Replay Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setActiveBarIdx(0);
            }}
            title="Réinitialiser à t=1"
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setActiveBarIdx((prev) => Math.max(0, prev - 1));
            }}
            disabled={activeBarIdx <= 0}
            title="Bougie précédente"
            className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 text-slate-300 hover:text-white cursor-pointer"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (activeBarIdx >= activeFixture.bars.length - 1) {
                setActiveBarIdx(0);
                setIsPlaying(true);
              } else {
                setIsPlaying((prev) => !prev);
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-white" />}
            <span>{isPlaying ? 'Pause' : 'Replay B6'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setActiveBarIdx((prev) => Math.min(activeFixture.bars.length - 1, prev + 1));
            }}
            disabled={activeBarIdx >= activeFixture.bars.length - 1}
            title="Bougie suivante"
            className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 text-slate-300 hover:text-white cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        viewBox="0 0 540 240"
        className="w-full h-auto select-none font-mono"
        style={{ background: 'linear-gradient(180deg, #090D17 0%, #060810 100%)' }}
      >
        <defs>
          <linearGradient id="bprZoneGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        {/* Technical Grid lines */}
        <line x1="0" y1="50" x2="540" y2="50" stroke="#ffffff" strokeOpacity="0.04" strokeDasharray="3,3" />
        <line x1="0" y1="100" x2="540" y2="100" stroke="#ffffff" strokeOpacity="0.04" strokeDasharray="3,3" />
        <line x1="0" y1="150" x2="540" y2="150" stroke="#ffffff" strokeOpacity="0.04" strokeDasharray="3,3" />
        <line x1="0" y1="200" x2="540" y2="200" stroke="#ffffff" strokeOpacity="0.04" strokeDasharray="3,3" />

        {/* Dynamic Zone Overlay (appears once zoneEvent.t <= currentBar.t) */}
        {zoneEvent && currentBar.t >= zoneEvent.t && zoneEvent.zone_high !== undefined && zoneEvent.zone_low !== undefined && (
          <g>
            {(() => {
              const yTop = priceToY(zoneEvent.zone_high);
              const yBottom = priceToY(zoneEvent.zone_low);
              const rectY = Math.min(yTop, yBottom);
              const rectH = Math.max(8, Math.abs(yBottom - yTop));
              const cePrice = zoneEvent.ce_50 ?? (zoneEvent.zone_high + zoneEvent.zone_low) / 2;
              const yCe = priceToY(cePrice);
              return (
                <>
                  <rect
                    x="130"
                    y={rectY}
                    width="370"
                    height={rectH}
                    fill="url(#bprZoneGrad)"
                    stroke="#6366f1"
                    strokeWidth="1.5"
                    strokeDasharray="4,2"
                    rx="4"
                  />
                  <line x1="130" y1={yCe} x2="500" y2={yCe} stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="370" y={ Math.max(14, yCe - 4) } fill="#38bdf8" fontSize="8" fontWeight="bold">
                    50% CE ({cePrice.toFixed(4)})
                  </text>
                </>
              );
            })()}
          </g>
        )}

        {/* Render OHLC Bars */}
        {activeFixture.bars.map((bar, idx) => {
          const stepWidth = Math.min(68, Math.floor(420 / Math.max(1, activeFixture.bars.length)));
          const xCenter = 70 + idx * stepWidth;
          const yHigh = priceToY(bar.h);
          const yLow = priceToY(bar.l);
          const yOpen = priceToY(bar.o);
          const yClose = priceToY(bar.c);
          const isBull = bar.c >= bar.o;
          const color = isBull ? '#10b981' : '#f43f5e';
          const bodyTop = Math.min(yOpen, yClose);
          const bodyHeight = Math.max(4, Math.abs(yClose - yOpen));
          const isFuture = idx > activeBarIdx;
          const isCurrent = idx === activeBarIdx;
          const barEvent = [...activeFixture.expected].reverse().find((e) => e.t === bar.t);


          return (
            <g
              key={bar.t}
              style={{ opacity: isFuture ? 0.22 : 1, cursor: 'pointer' }}
              onClick={() => {
                setIsPlaying(false);
                setActiveBarIdx(idx);
              }}
            >
              {isCurrent && (
                <rect
                  x={xCenter - 16}
                  y="14"
                  width="32"
                  height="205"
                  rx="4"
                  fill="#3b82f6"
                  fillOpacity="0.08"
                  stroke="#3b82f6"
                  strokeOpacity="0.3"
                />
              )}
              <line x1={xCenter} y1={yHigh} x2={xCenter} y2={yLow} stroke={color} strokeWidth="1.5" />
              <rect x={xCenter - 8} y={bodyTop} width="16" height={bodyHeight} fill={color} rx="1.5" />
              <text x={xCenter - 8} y="232" fill={isCurrent ? '#38bdf8' : '#64748b'} fontSize="8" fontWeight="bold">
                t={bar.t}
              </text>
              {barEvent && !isFuture && (
                <g>
                  <circle cx={xCenter} cy={Math.max(16, yHigh - 8)} r="3.5" fill="#38bdf8" />
                  <text
                    x={Math.max(10, Math.min(440, xCenter - 24))}
                    y={Math.max(12, yHigh - 14)}
                    fill="#38bdf8"
                    fontSize="8"
                    fontWeight="bold"
                  >
                    {barEvent.event}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Active Event Explanation Footer */}
      <div className="px-3 py-2 bg-white/[0.02] border-t border-white/5 flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-mono gap-2">
        <div className="truncate">
          {currentEvent?.reason ? (
            <span className="text-cyan-300 font-semibold">
              [t={currentBar.t}] {currentEvent.event} : {currentEvent.reason}
            </span>
          ) : (
            <span>{activeFixture.description}</span>
          )}
        </div>
        <span className="text-emerald-400 font-semibold shrink-0">Anti-Lookahead: Clôture confirmée</span>
      </div>
    </div>
  );
};

