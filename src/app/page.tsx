/**
 * @module app/root
 * @description Root entry point redirect
 * @safety GREEN
 */

import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/dashboard');
}
