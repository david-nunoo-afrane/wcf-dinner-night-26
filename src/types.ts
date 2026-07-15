/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ViewPath = 'home' | 'register' | 'contact' | 'attendees';

export type TicketType = 'Single' | 'Double' | 'Table of 4';

export interface RegistrationData {
  fullName: string;
  email: string;
  phone: string;
  ticketType: TicketType;
  quantity: number;
  guestName?: string;
}

export interface TicketConfig {
  type: TicketType;
  price: number;
  description: string;
}

export interface BookingConfirmation {
  id: string;
  registration: RegistrationData;
  amountPaid: number;
  date: string;
  status: 'Confirmed' | 'Pending';
  paymentRef?: string;
  paymentMethod?: string;
}
