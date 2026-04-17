/// <reference types="vite/client" />

import * as React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'iconify-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        icon?: string;
        class?: string;
        className?: string;
        'stroke-width'?: string | number;
        inline?: boolean;
        width?: string | number;
        height?: string | number;
        rotate?: string | number;
        flip?: string;
      }, HTMLElement>;
    }
  }
}
