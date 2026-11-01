# quorum

Plans that happen when enough friends are in.

Make a plan, share a link, and see who's in. Friends answer yes, maybe, or no, and a maybe or a no can become "I'll come if at least N others do".

**Live:** [quorumeet.vercel.app](https://quorumeet.vercel.app)

## Features

- **Groups and one-off plans.** Create a group and invite people with a link, or share a single plan.
- **Conditional RSVPs.** After a maybe or a decline, "I'll come if at least…" lets people commit once enough others do.
- **Time polls.** The owner proposes times. Anyone can suggest another time; a guest's suggestion is marked with a "?" until the owner confirms it. Saying a time doesn't work for you suggests a new one and turns it into a vote.
- **Guests welcome.** Join without an account, or sign up with email and password.
- **Share cards.** Generated Open Graph images for every plan, including correct right-to-left Hebrew.
- **Hebrew and English**, with a `?lang=` switch for testing.

## Stack

Next.js (App Router), React, TypeScript, Prisma on Postgres, and Supabase Auth. Deployed on Vercel.

Data model: `User`, `Group`, `Membership`, `Event`, `Rsvp`, `Availability`, `PollOption`, `PollVote`.

## Running locally

Create `.env` with:

```
DATABASE_URL=        # Postgres (pooled)
DIRECT_URL=          # Postgres (direct, for migrations)
SUPABASE_URL=
SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
AUTH_SECRET=
```

Then:

```bash
npm install          # also runs prisma generate
npx prisma db push
npm run dev
```
