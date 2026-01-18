# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Staff-MOA is a job posting platform for temporary/part-time staffing built with Next.js 15, Supabase, and Drizzle ORM. The platform supports three user roles with distinct capabilities:

- **Admin**: Platform management, user/manager approval, reporting oversight
- **Manager**: Job posting creation, worker management, schedule coordination (requires admin approval)
- **Member**: Job application, schedule viewing, profile management

## Development Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Production build with Turbopack
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run typegen          # Generate Supabase types from remote schema
npm run db:generate      # Generate Drizzle migrations from schema files
npm run db:migrate       # Apply Drizzle migrations to database
```

## Architecture Overview

### Routing Structure

The app uses Next.js App Router with route groups for organization:

```
app/(features)/
├── auth/                    # Authentication (public)
│   ├── action.ts           # signIn, signUp, signOut server actions
│   ├── login/page.tsx
│   ├── join/page.tsx       # General member signup
│   ├── join/manager-join/  # Manager signup (requires approval)
│   └── callback/page.tsx   # OAuth/email verification handler
│
├── (public)/               # No authentication required
│   └── post/page.tsx       # Job listings (public view)
│
└── (protected)/            # Authentication required
    ├── admin/page.tsx      # Admin dashboard with tabs for user/manager management
    ├── manager/            # Manager-only features
    │   ├── schedule/page.tsx
    │   └── worker/page.tsx
    ├── my-post/            # Manager's job postings CRUD
    │   ├── page.tsx
    │   ├── create/page.tsx
    │   └── edit/[id]/page.tsx
    ├── profile/page.tsx    # User profile management
    └── worker/             # Member-only features
        ├── schedule/page.tsx
        └── favorit/page.tsx
```

### Authentication & Authorization

**User Roles:**
- `admin`: Full platform access
- `manager`: Approved job poster (can create posts, manage workers)
- `pending_manager`: Manager awaiting admin approval (limited access)
- `member`: Job seeker/worker

**Auth Flow:**
1. User signs up via `/auth/join` (member) or `/auth/join/manager-join` (manager)
2. Managers start as `pending_manager` with `company_verify_status='pending'`
3. Admin reviews and approves/rejects via `/admin` dashboard
4. Approved managers become `manager` role with full access
5. Session managed via Supabase Auth with JWT in cookies

**Access Control:**
- `middleware.ts`: Route-level protection before page render
- `useUserStore` (Zustand): Client-side role state with hydration
- Server actions validate role from `profiles` table (source of truth)

### Database Architecture

**Dual ORM Strategy:**
- **Supabase Client**: Auth operations, RLS-protected queries
- **Drizzle ORM**: Type-safe database operations, migrations

**Key Tables:**

`profiles` (single source of truth for user data):
- Links to `auth.users.id` as `profile_id`
- Stores: role, company verification status, personal info, work attributes
- JSONB fields: `experiences`, `documents`, `recent_photos`
- Includes: attendance score, ban status, follower counts

`posts` (job postings):
- JSONB `work_slots`: Array of `{date, start_time, end_time, pay_amount}`
- `pay_type`: 'hourly' | 'daily' | 'weekly' | 'monthly'
- `status`: 'recruiting' | 'completed' | 'urgent'
- Foreign key to `profiles.profile_id` as `author_id`

**Schema Location:**
- Schemas: `app/(features)/**/schema.ts`
- Migrations: `app/sql/migrations/`

### Server Actions Pattern

All data mutations use server actions (no API routes). Standard pattern:

```typescript
'use server'

export async function someAction(formData: FormData): Promise<ActionResult<DataType>> {
  // 1. Validate with Zod
  const result = schema.safeParse(formData);
  if (!result.success) {
    return { ok: false, message: '...' , fieldErrors: {...} };
  }

  // 2. Check authentication/authorization
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 3. Verify role from profiles table (source of truth)
  const profile = await supabase.from('profiles').select('role').eq('profile_id', user.id).single();

  // 4. Perform operation
  const { data, error } = await supabase.from('table').insert(...);

  // 5. Return result
  return { ok: true, message: '성공', data };
}
```

**ActionResult Type:**
```typescript
type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
};
```

### State Management

**Minimal Client State** - Only use Zustand for truly global state:
- `useUserStore`: Manages user role with hydration to prevent flicker
- Server state lives in Supabase; client syncs via `supabase.auth.getUser()`

**Zustand Pattern:**
```typescript
// store/useUserStore.ts
{
  role: null,           // User's current role
  roleHydrated: false,  // Has role been loaded?
  hydrateRole(role)     // Set role after auth check
}
```

### Component Organization

**Shared Components:** `app/components/`
- `HeaderNav.tsx`: Role-aware navigation
- `PostForm.tsx`: Job posting creation/edit form
- `ScheduleCalendar.tsx`: Calendar with date-fns integration
- `ui/`: Radix UI primitives (button, dialog, card, etc.)

**Feature Components:** Co-located with routes
- `app/(features)/profile/components/*Section.tsx`: Profile sections
- `app/(features)/auth/components/`: Auth UI components

**Styling:**
- Tailwind CSS with Tailwind v4 (@tailwindcss/postcss)
- shadcn/ui component patterns
- CVA (class-variance-authority) for component variants

## Important Implementation Details

### Manager Approval Flow

1. User signs up with "매니저" option → `role='pending_manager'`, `company_verify_status='pending'`
2. Manager fills required profile fields: phone, kakao_id, company_name, business_number, company_certificate
3. Admin views pending managers in `/admin` dashboard → "매니저 승인 관리" tab
4. Admin approves → `role='manager'`, `company_verify_status='approved'`
5. Admin rejects → `company_verify_status='rejected'`, role stays `pending_manager`
6. Rejected managers can resubmit from `/profile` page

### Work Slots System

Job postings support multiple work periods via `work_slots` JSONB array:
```typescript
work_slots: Array<{
  date: string;        // ISO date
  start_time: string;  // HH:mm
  end_time: string;    // HH:mm
  pay_amount: number;  // Per this slot
}>
```

This replaces legacy single `work_date`, `work_time_start`, `work_time_end` columns.

### Profile Data Source

**CRITICAL**: Always query `profiles` table for role/status, not `auth.users` metadata:
- `profiles` table is single source of truth
- `auth.users` metadata sync is best-effort (may fail silently)
- Middleware uses JWT claims but pages should verify with profiles table

### Supabase Client Usage

**Server-side:**
```typescript
import { createClient } from '@/utils/supabase/server';
const supabase = await createClient();  // Uses cookies() for session
```

**Client-side:**
```typescript
import { createClient } from '@/utils/supabase/client';
const supabase = createClient();  // Browser client, auto-syncs cookies
```

**RLS Bypass (Admin Actions):**
- Use service role key for operations like manager approval that bypass RLS
- Pattern: `app/(features)/(protected)/admin/manager-actions.ts`

### Form Validation

- **Zod schemas** for all server actions
- **Korean error messages** via custom Zod error maps
- **Field-level errors** returned in ActionResult.fieldErrors
- **Client feedback** via toast notifications (Sonner)

### Image Uploads

Storage bucket: `profiles`
- Avatar images: `profiles/{userId}/avatar-{timestamp}.{ext}`
- Profile covers: `profiles/{userId}/cover-{timestamp}.{ext}`
- Documents: `profiles/{userId}/documents/{filename}`

Pattern:
1. Upload to Supabase Storage
2. Get public URL
3. Store URL in profiles table
4. Delete old file if replacing

## Performance Best Practices

This project follows Vercel React Best Practices (see `.cursor/skills/vercel-react-best-practices/`):

**Critical Patterns:**
- **Eliminate waterfalls**: Use `Promise.all()` for parallel fetches
- **Bundle optimization**: Direct imports, avoid barrel files (import from `@/components/ui/button` not `@/components/ui`)
- **Server caching**: Use `React.cache()` for per-request deduplication
- **Minimize client JS**: Prefer Server Components, use `'use client'` only when necessary

**Common Pitfalls:**
- Don't block server components with sequential awaits - parallelize independent fetches
- Don't use barrel imports from lucide-react - import icons directly
- Don't put heavy logic in client components - move to server actions

## Testing Workflows

### Test Manager Approval

1. Sign up as manager: `/auth/join` → check "매니저로 가입"
2. Verify status: Check `profiles` table → `role='pending_manager'`, `company_verify_status='pending'`
3. Admin approves: Login as admin → `/admin` → "매니저 승인 관리" → Approve
4. Verify promotion: Refresh → `role='manager'`, `company_verify_status='approved'`
5. Test access: Manager can now access `/my-post/create`

### Test Job Posting

1. Login as approved manager
2. Navigate to `/my-post/create`
3. Fill form with work_slots (supports multiple date/time pairs)
4. Submit → Server action validates manager role from profiles
5. Verify post appears in `/post` (public) and `/my-post` (manager's list)

## Common Gotchas

1. **Cookie Async**: Always `await cookies()` before using with Supabase client (Next.js 15+ requirement)
2. **Role Hydration**: Check `roleHydrated` before rendering role-dependent UI to prevent flicker
3. **Service Role Key**: Required for admin actions that bypass RLS (manager approval, user bans)
4. **Work Slots Migration**: Old posts may still have `work_date`, `work_time_start`, `work_time_end` - backfill completed
5. **Profile ID**: Uses `auth.users.id` as foreign key, not separate auto-increment
6. **Middleware Matcher**: Only runs on specific routes - update config when adding new protected routes

## Environment Variables

Required in `.env.local`:

```bash
# Supabase (from dashboard)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # For admin operations

# Database (from Supabase connection string)
DATABASE_URL=                       # Pooler connection for Drizzle
```

## Migration Strategy

When adding new database columns:

1. Add to Drizzle schema: `app/(features)/*/schema.ts`
2. Generate migration: `npm run db:generate`
3. Review migration SQL in `app/sql/migrations/`
4. Apply locally: `npm run db:migrate`
5. Apply to prod via Supabase dashboard or Drizzle
6. Regenerate types: `npm run typegen`

## Next.js 15 Specifics

- **Turbopack**: Default dev/build for faster iteration
- **Async Request APIs**: All cookies(), headers() must be awaited
- **React 19**: Uses useFormState, useActionState for server actions
- **App Router**: Full adoption, no Pages Router code

## Key Dependencies

- **@supabase/ssr**: Server-side Supabase client with cookie handling
- **drizzle-orm**: Type-safe DB queries and migrations
- **zod**: Runtime validation for forms and server actions
- **zustand**: Minimal client state (role management)
- **date-fns**: Date manipulation for schedules
- **lucide-react**: Icons (import directly, not from barrel)
- **sonner**: Toast notifications
- **@radix-ui/***: Accessible UI primitives
