'use client';

import { motion } from 'framer-motion';
import type { CourseModule } from '@aizen/types';

interface CourseCurriculumProps {
  modules: CourseModule[];
  headline?: string | null;
}

function formatDuration(minutes: number): string {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}p` : `${h} giờ`;
}

function resolveStartTimes(modules: CourseModule[]): string[] {
  let totalMinutes = 8 * 60;
  return modules.map((mod) => {
    if (mod.start_time) {
      const [h, m] = mod.start_time.split(':').map(Number);
      totalMinutes = (h ?? 8) * 60 + (m ?? 0) + mod.duration_minutes;
      return mod.start_time;
    }
    const h = Math.floor(totalMinutes / 60) % 24;
    const mm = totalMinutes % 60;
    const label = `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    totalMinutes += mod.duration_minutes;
    return label;
  });
}

export function CourseCurriculum({ modules, headline }: CourseCurriculumProps) {
  if (!modules.length) return null;

  const startTimes = resolveStartTimes(modules);
  const moduleCount = modules.filter((m) => m.item_type === 'module').length;
  const displayHeadline = headline ?? `1 ngày – ${moduleCount} module thực chiến`;

  return (
    <section className="mb-14">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <p className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.2em] text-[#38bdf8] uppercase mb-3">
          <span className="w-6 h-px bg-[#38bdf8]/60" />
          NỘI DUNG CHƯƠNG TRÌNH
          <span className="w-6 h-px bg-[#38bdf8]/60" />
        </p>
        <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
          {displayHeadline}
        </h2>
      </motion.div>

      <div className="relative">
        {/* Vertical timeline line */}
        <div
          className="absolute left-[68px] top-5 bottom-5 w-px"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(14,165,233,0.4) 15%, rgba(14,165,233,0.25) 85%, transparent)' }}
        />

        <ol className="space-y-2">
          {modules.map((mod, idx) => {
            const timeLabel = startTimes[idx] ?? '';
            const isBreak = mod.item_type === 'break';
            const isEvent = mod.item_type === 'event';
            const isModule = mod.item_type === 'module';

            return (
              <motion.li
                key={mod.id}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: idx * 0.04, ease: 'easeOut' }}
                className="flex items-start gap-0"
              >
                {/* Time label */}
                <div className="w-[68px] flex-shrink-0 pt-3.5">
                  <span
                    className={`text-[11px] font-mono leading-none tabular-nums ${
                      isModule ? 'text-white font-bold' : isEvent ? 'text-sky-400 font-semibold' : 'text-slate-500'
                    }`}
                  >
                    {timeLabel}
                  </span>
                </div>

                {/* Dot */}
                <div className="flex flex-col items-center relative w-0">
                  <div
                    className={`rounded-full border-2 border-slate-900 flex-shrink-0 mt-3.5 z-10 relative left-[-5px] ${
                      isEvent
                        ? 'w-4 h-4 ring-2 ring-sky-500/40 bg-sky-500'
                        : isBreak
                        ? 'w-2.5 h-2.5 ring-1 ring-white/10 bg-slate-600'
                        : 'w-3 h-3 ring-2 ring-sky-400/35 bg-sky-400'
                    }`}
                  />
                </div>

                {/* Card */}
                <div className="flex-1 ml-5 mb-2">
                  {isBreak ? (
                    <div
                      className="px-4 py-2.5 rounded-xl"
                      style={{
                        background: 'rgba(30,41,59,0.5)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        backdropFilter: 'blur(6px)',
                      }}
                    >
                      <p className="text-slate-400 text-sm font-medium">{mod.title}</p>
                      {mod.subtitle && (
                        <p className="text-slate-500 text-xs mt-0.5">{mod.subtitle}</p>
                      )}
                    </div>
                  ) : isEvent ? (
                    <div
                      className="px-4 py-2.5 rounded-xl"
                      style={{
                        background: 'rgba(14,165,233,0.08)',
                        border: '1px solid rgba(14,165,233,0.25)',
                        backdropFilter: 'blur(6px)',
                      }}
                    >
                      <p className="text-sky-300 text-sm font-semibold">{mod.title}</p>
                      {mod.subtitle && (
                        <p className="text-slate-400 text-xs mt-0.5">{mod.subtitle}</p>
                      )}
                    </div>
                  ) : (
                    <div
                      className="px-4 py-3.5 rounded-xl group cursor-default"
                      style={{
                        background: 'rgba(15,30,50,0.7)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        backdropFilter: 'blur(8px)',
                        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = 'rgba(14,165,233,0.06)';
                        el.style.borderColor = 'rgba(14,165,233,0.3)';
                        el.style.boxShadow = '0 4px 16px rgba(14,165,233,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = 'rgba(15,30,50,0.7)';
                        el.style.borderColor = 'rgba(255,255,255,0.09)';
                        el.style.boxShadow = 'none';
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm leading-snug">{mod.title}</p>
                          {mod.subtitle && (
                            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{mod.subtitle}</p>
                          )}
                          {mod.description && (
                            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{mod.description}</p>
                          )}
                        </div>
                        {mod.duration_minutes > 0 && (
                          <span className="text-[11px] font-bold text-sky-400/80 flex-shrink-0 tracking-wide mt-0.5 bg-sky-500/10 px-2 py-0.5 rounded-md">
                            {formatDuration(mod.duration_minutes)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
