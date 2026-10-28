import React from 'react';

export interface GroupAvatarProps {
  avatar?: string | null;
  name?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallbackEmoji?: string;
}

export const GroupAvatar: React.FC<GroupAvatarProps> = ({
  avatar,
  name = 'Gruppo',
  className = '',
  size = 'md',
  fallbackEmoji = '👥',
}) => {
  const isImage = Boolean(
    avatar &&
      (avatar.startsWith('data:image/') ||
        avatar.startsWith('http://') ||
        avatar.startsWith('https://') ||
        avatar.startsWith('blob:'))
  );

  const sizeStyles = {
    xs: 'w-6 h-6 text-xs rounded-lg',
    sm: 'w-8 h-8 text-sm rounded-xl',
    md: 'w-10 h-10 text-lg rounded-2xl',
    lg: 'w-12 h-12 text-2xl rounded-2xl',
    xl: 'w-16 h-16 text-3xl rounded-3xl',
  }[size];

  if (isImage) {
    return (
      <div
        className={`overflow-hidden shrink-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs ${sizeStyles} ${className}`}
      >
        <img
          src={avatar!}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`shrink-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs select-none ${sizeStyles} ${className}`}
    >
      <span>{avatar || fallbackEmoji}</span>
    </div>
  );
};
