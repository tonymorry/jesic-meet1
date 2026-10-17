import React, { useState } from 'react';

export interface UserAvatarProps {
  user?: {
    name?: string;
    surname?: string;
    avatarUrl?: string;
    role?: string;
  } | null;
  size?: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'squircle';
  className?: string;
  status?: 'present' | 'absent' | 'pending' | 'mandatory' | null;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  shape = 'circle',
  className = '',
  status = null,
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses: Record<string, { box: string; text: string; dot: string }> = {
    '2xs': { box: 'w-4 h-4', text: 'text-[8px]', dot: 'w-1 h-1' },
    xs: { box: 'w-5 h-5', text: 'text-[9px]', dot: 'w-1.5 h-1.5' },
    sm: { box: 'w-6 h-6', text: 'text-xs', dot: 'w-1.5 h-1.5' },
    md: { box: 'w-8 h-8', text: 'text-xs', dot: 'w-2 h-2' },
    lg: { box: 'w-10 h-10 text-sm', text: 'text-sm', dot: 'w-2.5 h-2.5' },
    xl: { box: 'w-14 h-14 text-xl', text: 'text-xl', dot: 'w-3 h-3' },
    '2xl': { box: 'w-20 h-20 text-3xl', text: 'text-3xl', dot: 'w-4 h-4' },
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;
  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  const computeInitials = () => {
    if (!user || !user.name) return '?';
    const firstInitial = user.name.trim().charAt(0).toUpperCase();
    if (size === '2xs' || size === 'xs') {
      return firstInitial;
    }
    const surnameInitial = user.surname ? user.surname.trim().charAt(0).toUpperCase() : '';
    return surnameInitial ? `${firstInitial}${surnameInitial}` : firstInitial;
  };

  const renderStatusDot = () => {
    if (!status) return null;
    let colorClass = 'bg-neutral-400';
    if (status === 'present') colorClass = 'bg-emerald-500 ring-1 ring-white dark:ring-neutral-900';
    if (status === 'absent') colorClass = 'bg-neutral-400 ring-1 ring-white dark:ring-neutral-900';
    if (status === 'pending') colorClass = 'bg-amber-500 animate-pulse ring-1 ring-white dark:ring-neutral-900';
    if (status === 'mandatory') colorClass = 'bg-amber-400 ring-1 ring-white dark:ring-neutral-900';

    return (
      <span
        className={`absolute -bottom-0.5 -right-0.5 ${currentSize.dot} ${colorClass} rounded-full z-10`}
      />
    );
  };

  if (user?.avatarUrl && !imageError) {
    return (
      <div className={`relative inline-flex shrink-0 ${className}`}>
        <img
          src={user.avatarUrl}
          alt={user.name ? `${user.name} avatar` : 'Avatar'}
          onError={() => setImageError(true)}
          className={`${currentSize.box} ${roundedClass} object-cover shrink-0 ring-1 ring-neutral-200/80 dark:ring-neutral-700/80 shadow-2xs`}
        />
        {renderStatusDot()}
      </div>
    );
  }

  const initials = computeInitials();

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <div
        className={`${currentSize.box} ${roundedClass} bg-gradient-to-br from-[#f23e2e] via-red-600 to-red-800 text-white font-black ${currentSize.text} flex items-center justify-center shrink-0 shadow-2xs select-none ring-1 ring-red-400/40`}
      >
        {initials}
      </div>
      {renderStatusDot()}
    </div>
  );
};
