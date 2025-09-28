"use client";
import React from 'react';

export default function Loader({ visible }: { visible: boolean }) {
  return (
    <div aria-hidden={!visible} className={`main global-loader ${visible ? 'visible' : ''}`}>
      <div className="loader-backdrop" />
      <div className="loader-wrap" role="status" aria-live="polite">
        <svg className="spinner" width="48" height="48" viewBox="0 0 50 50" aria-hidden>
          <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
        </svg>
        <span className="loader-text">Loading…</span>
      </div>
    </div>
  );
}
