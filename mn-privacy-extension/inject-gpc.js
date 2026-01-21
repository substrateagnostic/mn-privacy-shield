/**
 * MN Privacy Shield - GPC DOM Property Injection
 * Runs in MAIN world to set navigator.globalPrivacyControl
 *
 * This script defines the navigator.globalPrivacyControl property
 * per the GPC specification: https://privacycg.github.io/gpc-spec/
 *
 * Websites can check this property to honor user privacy preferences
 * before the Sec-GPC header is even processed.
 */

(function() {
  'use strict';

  // Don't re-define if already set (e.g., by browser native support)
  if (navigator.globalPrivacyControl !== undefined) {
    return;
  }

  try {
    // Define as non-configurable, non-writable property on Navigator.prototype
    Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', {
      get: function() {
        return true;
      },
      configurable: false,
      enumerable: true
    });

    // Also define on the navigator instance for compatibility
    Object.defineProperty(navigator, 'globalPrivacyControl', {
      get: function() {
        return true;
      },
      configurable: false,
      enumerable: true
    });

    // Log for debugging (remove in production if desired)
    // console.log('[MN Privacy Shield] navigator.globalPrivacyControl = true');

  } catch (error) {
    // Silently fail if we can't define the property
    // This can happen if another extension already defined it
    console.warn('[MN Privacy Shield] Could not set globalPrivacyControl:', error.message);
  }
})();
