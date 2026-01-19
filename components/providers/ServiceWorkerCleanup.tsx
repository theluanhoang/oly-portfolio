'use client';

import { useEffect } from 'react';

/**
 * Service Worker Cleanup Component
 * 
 * This component removes old service workers from previous website (web A)
 * that may still be intercepting requests after domain migration to new website (web B).
 * 
 * The cleanup runs once per browser using localStorage flag to prevent unnecessary operations.
 */
export default function ServiceWorkerCleanup() {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) return;

    // Check if cleanup has already been done
    const done = localStorage.getItem('sw-cleaned-v1');
    if (done) return;

    // Cleanup all service worker registrations
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => {
        if (regs.length === 0) {
          // No service workers found, mark as done
          localStorage.setItem('sw-cleaned-v1', 'true');
          return;
        }

        // Unregister all service workers
        const unregisterPromises = regs.map((reg) => reg.unregister());
        
        return Promise.all(unregisterPromises).then(() => {
          // Mark cleanup as done
          localStorage.setItem('sw-cleaned-v1', 'true');
          
          // Optional: Force reload to ensure clean state
          // Uncomment the line below if you want to reload immediately after cleanup
          // window.location.reload();
        });
      })
      .catch((error) => {
        // Log error but don't block the app
        console.warn('Service Worker cleanup failed:', error);
      });
  }, []);

  // This component doesn't render anything
  return null;
}
