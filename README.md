This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Accounts (optional)

Identity is anonymous by default (a signed `quorum_uid` cookie). Users can
optionally link an email + password on `/account` to keep their name, plans
and groups across devices; credentials are handled by
[Supabase Auth](https://supabase.com/docs/guides/auth) — the app only stores
the Supabase user id (`User.authId`) and email.

Required environment variables (in addition to `DATABASE_URL` / `DIRECT_URL`
and `AUTH_SECRET`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon or publishable key>
```

(`SUPABASE_URL` / `SUPABASE_ANON_KEY` work too; the client is only created
server-side.)

After pulling this change, apply the schema to the database:

```bash
npx prisma db push
```

Participant names on an event are revealed only when the organizer's privacy
setting allows it **and** the viewer is signed in with an account; the
organizer always sees them.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
