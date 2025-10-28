# Security Fixes - Supabase Database Linter Issues

This document explains the security issues detected by Supabase's database linter and how to fix them.

## Issues Detected

### 1. Function Search Path Mutable (WARN)
**Function:** `update_updated_at_column`
**Severity:** WARN
**Risk:** Search path manipulation attacks

#### Problem
Functions without a fixed `search_path` can be vulnerable to search path manipulation attacks where malicious users could inject objects into the search path.

#### Solution
Set an explicit `search_path` on all functions, especially those marked as `SECURITY DEFINER`.

### 2. Security Definer View (ERROR)
**View:** `vw_estatisticas_estabelecimentos`
**Severity:** ERROR
**Risk:** Bypasses RLS policies

#### Problem
Views with `SECURITY DEFINER` run with the permissions of the view creator, potentially bypassing Row Level Security (RLS) policies. This can expose data that should be restricted.

#### Solution
Use `SECURITY INVOKER` (or `security_invoker = true`) so the view respects the querying user's permissions and RLS policies.

### 3. Leaked Password Protection Disabled (WARN)
**Component:** Supabase Auth
**Severity:** WARN
**Risk:** Users can use compromised passwords

#### Problem
Password leak protection via HaveIBeenPwned.org integration is disabled, allowing users to set passwords that have been exposed in data breaches.

#### Solution
Enable this feature in the Supabase Dashboard (configuration steps below).

### 4. Auth RLS Initialization Plan (WARN)
**Tables:** All tables with RLS policies (27 warnings)
**Severity:** WARN
**Risk:** Severe performance degradation at scale

#### Problem
RLS policies call `auth.uid()` directly instead of wrapping it in a subquery. This causes PostgreSQL to re-evaluate the function for **every single row** in the result set, leading to massive performance issues on large datasets.

**Example:**
```sql
-- BAD (re-evaluated per row):
USING (unidade_id IN (SELECT unidade_id FROM perfis WHERE id = auth.uid()))

-- GOOD (evaluated once):
USING (unidade_id IN (SELECT unidade_id FROM perfis WHERE id = (select auth.uid())))
```

#### Solution
Wrap all `auth.uid()` calls in subqueries: `(select auth.uid())`

**Performance Impact:** 10-100x faster on large datasets

### 5. Multiple Permissive Policies (WARN)
**Tables:** `contatos`, `estabelecimentos` (28 warnings)
**Severity:** WARN
**Risk:** Performance degradation and maintenance complexity

#### Problem
Multiple RLS policies exist for the same table, role, and action. For example, `contatos` has both:
- "Usuários veem contatos da sua unidade" (SELECT)
- "Usuários podem ver contatos da sua unidade" (SELECT)

These duplicate policies force PostgreSQL to evaluate both policies for every query, doubling the overhead.

#### Solution
Remove duplicate policies and keep only one set with clear, consistent naming.

---

## How to Apply the Fixes

### Step 1: Run Security Fixes Migration

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Run the migration file: `supabase/fix_security_issues.sql`

This will:
- Fix the `update_updated_at_column` function with secure `search_path`
- Fix the `handle_new_user` function with secure `search_path`
- Fix the `update_estabelecimento_ultima_visita` function with secure `search_path`
- Recreate `vw_estatisticas_estabelecimentos` view with `SECURITY INVOKER`

### Step 2: Run RLS Performance Fixes Migration

1. Go to **SQL Editor**
2. Run the migration file: `supabase/fix_rls_performance.sql`

This will:
- Drop all duplicate RLS policies
- Recreate optimized policies with `(select auth.uid())` for performance
- Use consistent English naming for clarity
- Eliminate all `auth_rls_initplan` and `multiple_permissive_policies` warnings

**⚠️ IMPORTANT:** This migration will briefly drop all RLS policies. If you have active users, schedule this during a maintenance window or low-traffic period.

### Step 3: Enable Leaked Password Protection

1. Open your Supabase project dashboard
2. Go to **Authentication** → **Policies**
3. Find **Password Security** settings
4. Enable **"Check for breached passwords"** or **"Leaked Password Protection"**
5. Save changes

This will integrate with HaveIBeenPwned.org to prevent users from using compromised passwords.

---

## Verification

After applying the fixes, run the database linter again to verify all issues are resolved:

1. Go to **Database** → **Linter** in Supabase Dashboard
2. Click **Run Linter**
3. Verify that the following issues are gone:
   - ✅ `function_search_path_mutable` (3 functions fixed)
   - ✅ `security_definer_view` (1 view fixed)
   - ✅ `auth_leaked_password_protection` (enable in dashboard)
   - ✅ `auth_rls_initplan` (27 policy warnings eliminated)
   - ✅ `multiple_permissive_policies` (28 duplicate policies removed)

**Expected result:** Zero linter warnings

---

## Technical Details

### What is a Search Path Attack?

PostgreSQL uses a search path to resolve unqualified object names. If a function doesn't have a fixed search path, an attacker could:
1. Create a malicious schema
2. Add it to the user's search path
3. Create malicious objects (tables, functions) with the same names
4. Trick the function into using the malicious objects

**Fix:** Always set `SET search_path = public, pg_temp` on functions.

### Why SECURITY INVOKER for Views?

- **SECURITY DEFINER**: View runs with creator's permissions → Bypasses RLS
- **SECURITY INVOKER**: View runs with querying user's permissions → Respects RLS

For multi-tenant applications with RLS policies, always use `SECURITY INVOKER` to maintain proper data isolation.

### Why Wrap auth.uid() in a Subquery?

PostgreSQL's query planner treats function calls differently based on their volatility:

**Without subquery:**
```sql
WHERE id = auth.uid()  -- Evaluated for EVERY row
```
PostgreSQL sees this as a potentially volatile function and re-evaluates it for each row.

**With subquery:**
```sql
WHERE id = (select auth.uid())  -- Evaluated ONCE
```
PostgreSQL recognizes this as a subquery that can be evaluated once and cached (constant folding optimization).

**Real-world impact:**
- Query returning 1,000 rows: 1,000 function calls → 1 function call
- Query returning 10,000 rows: 10,000 function calls → 1 function call
- **Result:** 10-100x performance improvement on large datasets

### Why Remove Duplicate Policies?

When multiple permissive policies exist for the same role and action, PostgreSQL must evaluate ALL of them using OR logic. This means:

- **2 duplicate SELECT policies = 2x overhead on every read**
- **Maintenance confusion:** Which policy is active? Are they identical?
- **Harder debugging:** Policy evaluation order matters

**Best practice:** One clear, well-named policy per operation.

---

## References

### Security Issues
- [Supabase Database Linter - Function Search Path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [Supabase Database Linter - Security Definer View](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)
- [Supabase Auth - Password Security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/sql-security.html)

### Performance Issues
- [Supabase Database Linter - Auth RLS Initplan](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan)
- [Supabase Database Linter - Multiple Permissive Policies](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies)
- [Supabase RLS Performance Guide](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
