import React, { useState } from 'react';

interface FacultyAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const FacultyAvatar: React.FC<FacultyAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  const initials = name
    .replace(/^(Dr\.|Prof\.)\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  const sizeClasses =
    size === 'sm'
      ? 'h-10 w-10 text-xs'
      : size === 'lg'
        ? 'h-20 w-20 text-xl'
        : 'h-12 w-12 text-sm';

  if (avatarUrl && !imageFailed) {
    return (
      <img
        src={avatarUrl}
        alt={`Portrait of ${name}`}
        referrerPolicy="no-referrer"
        onError={() => setImageFailed(true)}
        className={`${sizeClasses} shrink-0 rounded-lg border border-slate-200 object-cover bg-slate-100`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`${sizeClasses} flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 font-display font-semibold text-slate-700`}
    >
      {initials}
    </div>
  );
};
