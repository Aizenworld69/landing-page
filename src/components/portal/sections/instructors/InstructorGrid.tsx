import Image from 'next/image';
import { FadeIn, StaggerChildren } from '@/components/portal/ui/AnimationWrapper';
import type { Instructor } from '@aizen/types';

interface InstructorGridProps {
  instructors: Instructor[];
}

export function InstructorGrid({ instructors }: InstructorGridProps) {
  return (
    <section className="py-16 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn direction="up" className="text-center mb-12">
          <p className="text-amber-400 text-xs font-extrabold uppercase tracking-widest mb-2">
            Đội Ngũ Chuyên Gia
          </p>
          <h2 className="text-2xl md:text-4xl font-black text-white drop-shadow-md">
            Giảng Viên Của AIZEN
          </h2>
        </FadeIn>

        <StaggerChildren className="flex flex-col items-center gap-6" stagger={130}>
          {instructors.map((instructor) => (
            <div
              key={instructor.id}
              className="card-hover bg-slate-900/85 backdrop-blur-xl border border-amber-400/40 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left group w-full max-w-2xl shadow-2xl hover:border-amber-400 transition-all duration-300 gap-6 sm:gap-7"
            >
              {/* Avatar */}
              <div className="relative size-36 sm:size-40 shrink-0">
                <div className="absolute inset-0 rounded-full bg-amber-400/30 scale-0 group-hover:scale-110 transition-transform duration-500 blur-md" />
                {instructor.avatar_url ? (
                  <Image
                    src={instructor.avatar_url}
                    alt={instructor.name}
                    width={160}
                    height={160}
                    className="relative rounded-full object-cover border-4 border-amber-400/80 shadow-xl group-hover:scale-105 transition-transform duration-300 size-36 sm:size-40"
                  />
                ) : (
                  <div className="relative w-full h-full rounded-full bg-slate-800 flex items-center justify-center border-4 border-amber-400/80 shadow-xl group-hover:scale-105 transition-transform duration-300">
                    <span className="text-5xl">👤</span>
                  </div>
                )}
              </div>

              {/* Content Body */}
              <div className="flex-1 flex flex-col justify-between h-full w-full">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="font-black text-white text-xl sm:text-2xl group-hover:text-amber-300 transition-colors">
                      {instructor.name}
                    </h3>
                    <span className="self-center sm:self-auto inline-block px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-black rounded-full border border-amber-400/40 uppercase tracking-wide whitespace-nowrap">
                      {instructor.title}
                    </span>
                  </div>

                  {instructor.bio && (
                    <p className="mt-3 text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                      {instructor.bio}
                    </p>
                  )}
                </div>

                {/* Social links */}
                {Object.keys(instructor.social_links ?? {}).length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-3 justify-center sm:justify-start">
                    {instructor.social_links.linkedin && (
                      <a
                        href={instructor.social_links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-400/60 transition-all hover:scale-110 transform duration-200"
                        aria-label="LinkedIn"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </a>
                    )}
                    {instructor.social_links.email && (
                      <a
                        href={`mailto:${instructor.social_links.email}`}
                        className="p-2 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-400/60 transition-all hover:scale-110 transform duration-200"
                        aria-label="Email"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}