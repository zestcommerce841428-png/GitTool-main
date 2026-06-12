'use client';

import React from 'react';
import { createPortal } from 'react-dom';

/**
 * Teleports its children to a DOM element with ID 'navbar-left'.
 * Will fail gracefully if the target doesn't exist yet by returning null.
 */
export default function NavbarPortal({ children }: { children: React.ReactNode }) {
    if (typeof document === 'undefined') {
        return null;
    }

    const target = document.getElementById('navbar-left');

    if (!target) {
        return null;
    }

    return createPortal(children, target);
}
