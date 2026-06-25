#!/usr/bin/env node
/**
 * Generate a scrypt password hash for OWNER_PASSWORD_HASH.
 *
 *   node scripts/hash-password.mjs "my-strong-password"
 *
 * Copy the printed `scrypt$...$...` value into OWNER_PASSWORD_HASH (Vercel env
 * + .env.local). The plaintext password is never stored anywhere.
 */
import { scryptSync, randomBytes } from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "<password>"');
  process.exit(1);
}
if (password.length < 10) {
  console.error('Refusing: choose a password of at least 10 characters.');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 32);
process.stdout.write(`scrypt$${salt.toString('hex')}$${hash.toString('hex')}\n`);
