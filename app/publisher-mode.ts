// Build-time switch; the standard engine/test runtime keeps its original storage.
declare const __PUBLISHER_SAFE__: boolean;
export const PUBLISHER_SAFE = typeof __PUBLISHER_SAFE__ !== 'undefined' && __PUBLISHER_SAFE__;
