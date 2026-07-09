'use client';

import { motion } from 'framer-motion';
import type { CourseWithDetails } from '@aizen/types';

interface CourseSkillsProps {
  skills?: CourseWithDetails['skills'];
}

const DEFAULT_SKILLS = [
  {
    id: 'cowork',
    icon: 'groups',
    label: 'Claude Cowork',
    description:
      'Cowork là cả một phòng ban AI trong lòng bàn tay – mỗi agent đảm nhận một vai trò, tự vận hành, tự phối hợp với nhau, và giao cho bạn kết quả cuối cùng như một đội ngũ thực thụ.',
    featured: true,
    badge: 'ĐẶC BIỆT',
  },
  {
    id: 'skills',
    icon: 'psychology',
    label: 'Claude Skills',
    description:
      'Biến mỗi nhân sự hoặc quy trình công ty thành Skill cố định – gọi một lúc nhiều Skills, Claude tự xử lý đa nhiệm mà không cần ra lệnh lại.',
  },
  {
    id: 'projects',
    icon: 'folder_open',
    label: 'Claude Projects',
    description:
      'Giao việc cho đúng người, giúp bạn tạo ra những "chuyên gia ảo" theo từng lĩnh vực, luôn hiểu đúng context và làm việc theo chuẩn của bạn.',
  },
  {
    id: 'connectors',
    icon: 'hub',
    label: 'Claude Connectors',
    description:
      'Chìa khóa để Claude kết nối với hệ thống công việc như Gmail, Google Drive, Calendar... để xây dựng các trợ lý tự động.',
  },
  {
    id: 'artifacts',
    icon: 'layers',
    label: 'Claude Artifacts',
    description:
      'Xây luôn cho bạn một app, website, landing page hay công cụ tương tác ngay trong khung chat, không cần code.',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: 'easeOut' as const },
  }),
};

export function CourseSkills({ skills }: CourseSkillsProps) {
  const items =
    skills && skills.length > 0
      ? skills.map((s, i) => ({
          id: `skill-${i}`,
          icon: ['groups', 'psychology', 'folder_open', 'hub', 'layers'][i % 5],
          label: s.title,
          description: s.description,
          featured: i === 0,
          badge: s.badge,
        }))
      : DEFAULT_SKILLS;

  const [featured, ...rest] = items;

  return (
    <section className="mb-16">
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
          KỸ NĂNG BẠN SẼ CÓ
          <span className="w-6 h-px bg-[#38bdf8]/60" />
        </p>
        <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
          Kết thúc khóa học,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] to-[#3b82f6]">
            bạn sở hữu ngay
          </span>
        </h2>
      </motion.div>

      {/* Row 1: featured (span 2) + 2 cards = 4 cols */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Featured */}
        <motion.div
          custom={0}
          variants={cardVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="lg:col-span-2 relative rounded-2xl p-7 overflow-hidden flex flex-col items-center justify-center min-h-[250px] text-center cursor-default"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.22) 0%, rgba(14,165,233,0.12) 100%)',
            border: '1px solid rgba(59,130,246,0.35)',
            boxShadow: '0 8px 32px rgba(14,165,233,0.12)',
          }}
        >
          {/* Background orb */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#3b82f6]/15 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-[#0EA5E9]/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1a4cd2] to-[#38bdf8] flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
              <span className="material-symbols-outlined text-white text-2xl">{featured.icon}</span>
            </div>
            {featured.badge && (
              <span className="px-3 py-1 bg-red-500 text-white text-[10px] font-black uppercase rounded-full tracking-[0.15em] mb-3 shadow-sm">
                {featured.badge}
              </span>
            )}
            <h3 className="text-xl font-black mb-3 text-white">{featured.label}</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{featured.description}</p>
          </div>
        </motion.div>

        {/* Cards 2 + 3 */}
        {rest.slice(0, 2).map((skill, idx) => (
          <motion.div
            key={skill.id}
            custom={idx + 1}
            variants={cardVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="rounded-2xl p-6 flex flex-col items-center justify-center min-h-[250px] text-center group"
            style={{
              background: 'rgba(15,33,51,0.75)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(8px)',
              transition: 'border-color 0.25s, box-shadow 0.25s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.4)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(14,165,233,0.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#1a4cd2] to-[#38bdf8] flex items-center justify-center mb-4 shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/35 transition-shadow">
              <span className="material-symbols-outlined text-white text-2xl">{skill.icon}</span>
            </div>
            <h3 className="text-base font-black text-white mb-2.5 tracking-tight">{skill.label}</h3>
            <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">{skill.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Row 2: 2 cards */}
      {rest.length > 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rest.slice(2).map((skill, idx) => (
            <motion.div
              key={skill.id}
              custom={idx + 3}
              variants={cardVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="rounded-2xl p-6 flex flex-col items-center justify-center min-h-[180px] text-center group"
              style={{
                background: 'rgba(15,33,51,0.75)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(8px)',
                transition: 'border-color 0.25s, box-shadow 0.25s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.4)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(14,165,233,0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#1a4cd2] to-[#38bdf8] flex items-center justify-center mb-4 shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/35 transition-shadow">
                <span className="material-symbols-outlined text-white text-2xl">{skill.icon}</span>
              </div>
              <h3 className="text-base font-black text-white mb-2.5 tracking-tight">{skill.label}</h3>
              <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">{skill.description}</p>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
