'use client';

import { useState } from 'react';

type GroupMember = {
  id: number;
  member_index: number;
  fullname: string;
  phone?: string;
  email?: string;
  company?: string;
};

type RowExpanderProps = {
  registrationId: number;
  members: number;
  primaryName: string;
  primaryPhone: string;
  packageType: string;
  allGroupMembers?: GroupMember[]; // Pre-fetched from server
};

export default function RowExpander({
  registrationId,
  members,
  primaryName,
  primaryPhone,
  packageType,
  allGroupMembers = [],
}: RowExpanderProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get members for this registration
  const registrationMembers = allGroupMembers.filter(
    (m) => m.member_index > 0 // Skip primary (index 0)
  );

  // Không có members hoặc chỉ 1 người
  if (members <= 1) {
    return (
      <div className="flex items-center gap-2">
        <p className="font-bold text-slate-900">{primaryName}</p>
      </div>
    );
  }

  // Có nhiều thành viên
  return (
    <div className="space-y-2">
      {/* Primary member (always visible) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
      >
        <button
          type="button"
          className="flex items-center justify-center w-5 h-5 shrink-0"
        >
          <span className="material-symbols-outlined text-[18px] text-slate-600">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
        <div>
          <p className="font-bold text-slate-900">{primaryName}</p>
          <p className="text-xs text-slate-500">{primaryPhone}</p>
        </div>
        <span className="ml-auto text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
          {packageType} (x{members})
        </span>
      </div>

      {/* Additional members (when expanded) */}
      {isExpanded && (
        <div className="ml-6 space-y-2 border-l-2 border-slate-200 pl-3">
          {registrationMembers.length > 0 ? (
            registrationMembers.map((member) => (
              <div key={member.id} className="text-sm">
                <p className="font-medium text-slate-700">
                  Người {member.member_index + 1}: {member.fullname}
                </p>
                {member.phone && (
                  <p className="text-xs text-slate-500">SĐT: {member.phone}</p>
                )}
                {member.email && (
                  <p className="text-xs text-slate-500">Email: {member.email}</p>
                )}
                {member.company && (
                  <p className="text-xs text-slate-500">Công ty: {member.company}</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">Không có thông tin thêm</p>
          )}
        </div>
      )}
    </div>
  );
}
