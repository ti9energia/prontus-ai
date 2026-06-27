/**
 * Data-layer seam (Block 8). Today everything resolves to the in-memory +
 * localStorage repository (`./store`), which is the ACTIVE store and stays local
 * until a database is provisioned. When `DATABASE_URL` is set and Prisma is wired
 * (see `PERSISTENCE.md` + `prisma/schema.prisma`), this file is the ONE switch
 * point: route reads/writes to a `./postgres` adapter that implements the same
 * repository functions. Import from `@/lib/data` to stay adapter-agnostic.
 */
export * from './store';
