'use client';

import { UserInfo } from '@/lib/types';

interface UserInfoFormProps {
  userInfo: UserInfo;
  onChange: (userInfo: UserInfo) => void;
}

export default function UserInfoForm({ userInfo, onChange }: UserInfoFormProps) {
  const handleChange = (field: keyof UserInfo, value: string) => {
    onChange({ ...userInfo, [field]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Your Information
      </h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        This information will be included in your request letters for verification purposes.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            value={userInfo.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="Your full legal name"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Street Address *
          </label>
          <input
            type="text"
            id="address"
            value={userInfo.address}
            onChange={(e) => handleChange('address', e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="123 Main Street"
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            City *
          </label>
          <input
            type="text"
            id="city"
            value={userInfo.city}
            onChange={(e) => handleChange('city', e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="Minneapolis"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              State *
            </label>
            <input
              type="text"
              id="state"
              value={userInfo.state}
              onChange={(e) => handleChange('state', e.target.value)}
              required
              maxLength={2}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder="MN"
            />
          </div>

          <div>
            <label htmlFor="zip" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              ZIP Code *
            </label>
            <input
              type="text"
              id="zip"
              value={userInfo.zip}
              onChange={(e) => handleChange('zip', e.target.value)}
              required
              maxLength={10}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder="55401"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={userInfo.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        * Required fields. Your information is only stored locally if you enable "Remember my info."
      </p>
    </div>
  );
}
