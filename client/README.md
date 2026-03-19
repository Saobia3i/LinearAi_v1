# React Frontend (`client`)

## Run

```bash
cd client
npm install
npm run dev
```

## Notes

- Backend API base: `/api/*`
- Cookie auth is enabled with `withCredentials: true`.
- If your ASP.NET app runs on another port, set:

```bash
set VITE_API_PROXY_TARGET=https://localhost:7xxx
```

or configure `VITE_API_BASE_URL`.
