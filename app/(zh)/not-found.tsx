import Link from 'next/link';
import { CircleIcon } from 'lucide-react';

import { chineseNotFoundPageCopy } from '@/lib/i18n/not-found-page-copy';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh]">
      <div className="max-w-md space-y-8 p-4 text-center">
        <div className="flex justify-center">
          <CircleIcon className="size-12 text-orange-500" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          {chineseNotFoundPageCopy.title}
        </h1>
        <p className="text-base text-gray-500">
          {chineseNotFoundPageCopy.message}
        </p>
        <Link
          href={chineseNotFoundPageCopy.homeHref}
          className="max-w-48 mx-auto flex justify-center py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          {chineseNotFoundPageCopy.homeLabel}
        </Link>
      </div>
    </div>
  );
}
