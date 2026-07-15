/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// @ts-ignore
import wcfLogoImg from '../assets/images/wcf_logo.png';

interface WcfLogoProps {
  className?: string;
  size?: number | string;
}

export default function WcfLogo({ className = '', size = 44 }: WcfLogoProps) {
  return (
    <img
      src={wcfLogoImg}
      alt="WCF KNUST Logo"
      width={size}
      height={size}
      className={`select-none pointer-events-none object-contain ${className}`}
      referrerPolicy="no-referrer"
    />
  );
}
