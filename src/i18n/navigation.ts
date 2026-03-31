/**
 * Localized navigation helpers from next-intl.
 * Import Link, useRouter, usePathname from HERE, not from 'next/link' or 'next/navigation',
 * to get automatic locale-prefixed navigation.
 */
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
