# Contributing

Thanks for contributing to Mini ERP. A few quick notes to get started:

- Clone the repo and install dependencies in both `backend` and `frontend`.
- Copy `.env.example` to `.env` in `backend` and set `DATABASE_URL` and `JWT_SECRET`.
- Use `npm run dev` in `backend` and `npm run dev` in `frontend` to start locally.
- Run database migrations/seeding with `npx prisma db push` and `npm run db:seed` from `backend`.

If you open a PR, make sure tests pass and include a short description of why the change is needed.
