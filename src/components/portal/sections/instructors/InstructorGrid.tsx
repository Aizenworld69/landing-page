import Image from 'next/image';
import { FadeIn, StaggerChildren } from '@/components/portal/ui/AnimationWrapper';
import type { Instructor } from '@aizen/types';

interface InstructorGridProps {
  instructors: Instructor[];
}

export function InstructorGrid({ instructors }: InstructorGridProps) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn direction="up" className="text-center mb-12">
          <p className="text-sky-500 text-sm font-semibold uppercase tracking-widest mb-2">
            Đội Ngủ Chuyên Gia
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Giảng Viên Của AIZEN
          </h2>
        </FadeIn>

        <StaggerChildren className="flex flex-wrap justify-center gap-8" stagger={130}>
          {instructors.map((instructor) => (
            <div
              key={instructor.id}
              className="card-hover bg-[#F8FAFC] border border-gray-100 rounded-2xl p-8 flex flex-col items-center text-center group w-full max-w-[380px]"
            >
              {/* Avatar */}
              <div className="mb-6 relative size-44 md:size-48">
                <div className="absolute inset-0 rounded-full bg-sky-200/50 scale-0 group-hover:scale-110 transition-transform duration-500 blur-md" />
                {instructor.avatar_url ? (
                  <Image
                    src={instructor.avatar_url}
                    alt={instructor.name}
                    width={192}
                    height={192}
                    className="relative rounded-full object-cover border-4 border-white shadow-md group-hover:scale-105 transition-transform duration-300 size-44 md:size-48"
                  />
                ) : (
                  <div className="relative w-full h-full rounded-full bg-sky-100 flex items-center justify-center border-4 border-white shadow-md group-hover:scale-105 transition-transform duration-300">
                    <span className="text-6xl">👤</span>
                  </div>
                )}
              </div>

              <h3 className="font-bold text-gray-900 text-lg group-hover:text-sky-500 transition-colors">{instructor.name}</h3>
              <span className="mt-1.5 inline-block px-3 py-1 bg-sky-50 text-sky-600 text-xs font-semibold rounded-full border border-sky-100">
                {instructor.title}
              </span>

              {instructor.bio && (
                <p className="mt-3 text-sm text-gray-500 leading-relaxed line-clamp-4">
                  {instructor.bio}
                </p>
              )}

              {/* Social links */}
              {Object.keys(instructor.social_links ?? {}).length > 0 && (
                <div className="mt-4 flex items-center gap-3">
                  {instructor.social_links.linkedin && (
                    <a
                      href={instructor.social_links.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-sky-500 transition-colors hover:scale-110 transform duration-200"
                      aria-label="LinkedIn"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  )}
                  {instructor.social_links.email && (
                    <a
                      href={`mailto:${instructor.social_links.email}`}
                      className="text-gray-400 hover:text-sky-500 transition-colors hover:scale-110 transform duration-200"
                      aria-label="Email"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}