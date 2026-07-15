/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// @ts-ignore
import winnersLogoImg from '../assets/images/winners_logo.png';

interface WinnersLogoProps {
  className?: string;
  size?: number | string;
}

export default function WinnersLogo({ className = '', size = 44 }: WinnersLogoProps) {
  return (
    <img
      src={winnersLogoImg}
      alt="Winners Logo"
      width={size}
      height={size}
      className={`select-none pointer-events-none object-contain ${className}`}
      referrerPolicy="no-referrer"
    />
  );
}
