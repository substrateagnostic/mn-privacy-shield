'use client';

import { useState } from 'react';
import { UserInfo } from '@/lib/types';

interface UserInfoFormProps {
  userInfo: UserInfo;
  onChange: (userInfo: UserInfo) => void;
  showErrors?: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

export function validateUserInfo(userInfo: UserInfo): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!userInfo.name.trim()) errors.name = 'Full name is required';
  if (!userInfo.address.trim()) errors.address = 'Street address is required';
  if (!userInfo.city.trim()) errors.city = 'City is required';
  if (!userInfo.state.trim()) errors.state = 'State is required';
  if (!userInfo.zip.trim()) {
    errors.zip = 'ZIP code is required';
  } else if (!ZIP_REGEX.test(userInfo.zip.trim())) {
    errors.zip = 'Enter a valid ZIP code (e.g., 55401 or 55401-1234)';
  }
  if (!userInfo.email.trim()) {
    errors.email = 'Email address is required';
  } else if (!EMAIL_REGEX.test(userInfo.email.trim())) {
    errors.email = 'Enter a valid email address';
  }
  return errors;
}

export default function UserInfoForm({ userInfo, onChange, showErrors = false }: UserInfoFormProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const errors = validateUserInfo(userInfo);

  const handleChange = (field: keyof UserInfo, value: string) => {
    onChange({ ...userInfo, [field]: value });
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const shouldShowError = (field: string) => {
    return (touched[field] || showErrors) && errors[field];
  };

  const inputClass = (field: string) => {
    const base = 'mt-1 block w-full border-2 bg-[var(--background)] px-3 py-2 text-[var(--foreground)] focus:outline-none';
    if (shouldShowError(field)) {
      return `${base} border-[var(--error)] focus:border-[var(--error)]`;
    }
    return `${base} border-[var(--border)] focus:border-[var(--accent)]`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold uppercase tracking-tight text-[var(--foreground)]">
        Your Information
      </h3>
      <p className="text-sm text-[var(--muted)]">
        This information will be included in your request letters for verification purposes.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="block font-mono text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            value={userInfo.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            required
            className={inputClass('name')}
            placeholder="Your full legal name"
          />
          {shouldShowError('name') && (
            <p className="mt-1 text-xs text-[var(--error)]">{errors.name}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="address" className="block font-mono text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Street Address *
          </label>
          <input
            type="text"
            id="address"
            value={userInfo.address}
            onChange={(e) => handleChange('address', e.target.value)}
            onBlur={() => handleBlur('address')}
            required
            className={inputClass('address')}
            placeholder="123 Main Street"
          />
          {shouldShowError('address') && (
            <p className="mt-1 text-xs text-[var(--error)]">{errors.address}</p>
          )}
        </div>

        <div>
          <label htmlFor="city" className="block font-mono text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            City *
          </label>
          <input
            type="text"
            id="city"
            value={userInfo.city}
            onChange={(e) => handleChange('city', e.target.value)}
            onBlur={() => handleBlur('city')}
            required
            className={inputClass('city')}
            placeholder="Minneapolis"
          />
          {shouldShowError('city') && (
            <p className="mt-1 text-xs text-[var(--error)]">{errors.city}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="state" className="block font-mono text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              State *
            </label>
            <input
              type="text"
              id="state"
              value={userInfo.state}
              onChange={(e) => handleChange('state', e.target.value)}
              onBlur={() => handleBlur('state')}
              required
              maxLength={2}
              className={inputClass('state')}
              placeholder="MN"
            />
            {shouldShowError('state') && (
              <p className="mt-1 text-xs text-[var(--error)]">{errors.state}</p>
            )}
          </div>

          <div>
            <label htmlFor="zip" className="block font-mono text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              ZIP Code *
            </label>
            <input
              type="text"
              id="zip"
              value={userInfo.zip}
              onChange={(e) => handleChange('zip', e.target.value)}
              onBlur={() => handleBlur('zip')}
              required
              maxLength={10}
              className={inputClass('zip')}
              placeholder="55401"
            />
            {shouldShowError('zip') && (
              <p className="mt-1 text-xs text-[var(--error)]">{errors.zip}</p>
            )}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="email" className="block font-mono text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={userInfo.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            required
            className={inputClass('email')}
            placeholder="you@example.com"
          />
          {shouldShowError('email') && (
            <p className="mt-1 text-xs text-[var(--error)]">{errors.email}</p>
          )}
        </div>
      </div>

      <p className="text-xs text-[var(--muted)]">
        * Required fields. Your information is only stored locally if you enable &quot;Remember my info.&quot;
      </p>
    </div>
  );
}
