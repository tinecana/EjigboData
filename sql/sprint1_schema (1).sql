-- =====================================================================
-- PWMS ENTERPRISE REFACTOR — SPRINT 1: DATABASE REDESIGN
-- =====================================================================
-- Purely additive. Creates new normalized tables alongside the existing
-- ward-JSON storage. Nothing existing is modified, dropped, or renamed.
-- Safe to run on production: these tables are unused by the live app
-- until Sprint 3 (frontend migration) is implemented and approved.
-- =====================================================================

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ---------------------------------------------------------------------
-- Shared enterprise metadata, applied to every table below:
--   id, created_at, updated_at, updated_by, created_by, device_id,
--   version, deleted, deleted_at, last_synced_at
-- Soft deletes are used throughout (deleted boolean) rather than hard
-- deletes, so audit history and conflict resolution (Sprint 5) have
-- something to work with. created_by/device_id are populated where the
-- source data has them and left NULL otherwise (see migration script).
-- ---------------------------------------------------------------------

-- =====================================================================
-- WARDS
-- =====================================================================
create table if not exists wards (
    id               uuid primary key default gen_random_uuid(),
    name             text not null unique,
    settings         jsonb not null default '{}'::jsonb,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),
    updated_by       text,
    created_by       text,
    device_id        text,
    version          integer not null default 1,
    deleted          boolean not null default false,
    deleted_at       timestamptz,
    last_synced_at   timestamptz
);

create index if not exists idx_wards_deleted on wards (deleted);

-- =====================================================================
-- POLLING UNITS
-- =====================================================================
create table if not exists polling_units (
    id               uuid primary key default gen_random_uuid(),
    ward_id          uuid not null references wards(id) on delete cascade,
    unit_num         text not null,
    name             text,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),
    updated_by       text,
    created_by       text,
    device_id        text,
    version          integer not null default 1,
    deleted          boolean not null default false,
    deleted_at       timestamptz,
    last_synced_at   timestamptz,
    unique (ward_id, unit_num)
);

create index if not exists idx_polling_units_ward on polling_units (ward_id) where not deleted;

-- =====================================================================
-- STREETS
-- =====================================================================
create table if not exists streets (
    id               uuid primary key default gen_random_uuid(),
    ward_id          uuid not null references wards(id) on delete cascade,
    name             text not null,
    leader           text,
    notes            text,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),
    updated_by       text,
    created_by       text,
    device_id        text,
    version          integer not null default 1,
    deleted          boolean not null default false,
    deleted_at       timestamptz,
    last_synced_at   timestamptz,
    unique (ward_id, name)
);

create index if not exists idx_streets_ward on streets (ward_id) where not deleted;

-- =====================================================================
-- EXECUTIVES
-- =====================================================================
create table if not exists executives (
    id               uuid primary key default gen_random_uuid(),
    ward_id          uuid not null references wards(id) on delete cascade,
    position         text not null,
    name             text,
    phone            text,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),
    updated_by       text,
    created_by       text,
    device_id        text,
    version          integer not null default 1,
    deleted          boolean not null default false,
    deleted_at       timestamptz,
    last_synced_at   timestamptz,
    unique (ward_id, position)
);

create index if not exists idx_executives_ward on executives (ward_id) where not deleted;

-- =====================================================================
-- MEMBERS
-- =====================================================================
create table if not exists members (
    id                 uuid primary key default gen_random_uuid(),
    ward_id            uuid not null references wards(id) on delete cascade,
    polling_unit_id    uuid references polling_units(id) on delete set null,
    street_id          uuid references streets(id) on delete set null,
    name               text not null,
    gender             text,
    date_of_birth      date,
    phone              text,
    alt_phone          text,
    email              text,
    occupation         text,
    support_level      text,
    address            text,
    notes              text,
    nin                text,
    vin                text,
    apc_caucus         text not null default 'Not Specified',
    passport_url       text,
    membership_number  text,
    qr_id              text,
    status             text not null default 'active',
    registration_date  timestamptz,
    created_at         timestamptz not null default now(),
    updated_at         timestamptz not null default now(),
    updated_by         text,
    created_by       text,
    device_id        text,
    version             integer not null default 1,
    deleted            boolean not null default false,
    deleted_at         timestamptz,
    last_synced_at     timestamptz
);

create index if not exists idx_members_ward on members (ward_id) where not deleted;
create index if not exists idx_members_polling_unit on members (polling_unit_id) where not deleted;
create index if not exists idx_members_phone on members (phone) where not deleted;
create index if not exists idx_members_nin on members (nin) where nin is not null and nin <> '';
create index if not exists idx_members_vin on members (vin) where vin is not null and vin <> '';
create index if not exists idx_members_qr_id on members (qr_id) where qr_id is not null;
create index if not exists idx_members_updated_at on members (updated_at); -- for incremental sync (Sprint 4)

-- =====================================================================
-- ATTENDANCE SESSIONS
-- =====================================================================
create table if not exists attendance_sessions (
    id               uuid primary key default gen_random_uuid(),
    ward_id          uuid not null references wards(id) on delete cascade,
    title            text not null,
    venue            text,
    session_date     date,
    status           text not null default 'active', -- 'active' | 'closed'
    closed_at        timestamptz,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),
    updated_by       text,
    created_by       text,
    device_id        text,
    version          integer not null default 1,
    deleted          boolean not null default false,
    deleted_at       timestamptz,
    last_synced_at   timestamptz
);

create index if not exists idx_attendance_sessions_ward on attendance_sessions (ward_id) where not deleted;
create index if not exists idx_attendance_sessions_status on attendance_sessions (ward_id, status) where not deleted;

-- =====================================================================
-- ATTENDANCE RECORDS
-- =====================================================================
-- One row per person marked present in a session. member_id is nullable
-- because the existing app allows marking a walk-in attendee ("new
-- member") who isn't yet a formal member record.
create table if not exists attendance_records (
    id               uuid primary key default gen_random_uuid(),
    session_id       uuid not null references attendance_sessions(id) on delete cascade,
    member_id        uuid references members(id) on delete set null,
    attendee_type    text not null default 'returning', -- 'returning' | 'new'
    name             text,
    phone            text,
    approved         boolean not null default true,
    correction_notes text,
    marked_at        timestamptz not null default now(),
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),
    updated_by       text,
    created_by       text,
    device_id        text,
    version          integer not null default 1,
    deleted          boolean not null default false,
    deleted_at       timestamptz,
    last_synced_at   timestamptz
);

create index if not exists idx_attendance_records_session on attendance_records (session_id) where not deleted;
create index if not exists idx_attendance_records_member on attendance_records (member_id) where not deleted;

-- =====================================================================
-- MEETINGS
-- =====================================================================
create table if not exists meetings (
    id               uuid primary key default gen_random_uuid(),
    ward_id          uuid not null references wards(id) on delete cascade,
    title            text not null,
    meeting_date     date,
    venue            text,
    agenda           text,
    status           text not null default 'Scheduled',
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),
    updated_by       text,
    created_by       text,
    device_id        text,
    version          integer not null default 1,
    deleted          boolean not null default false,
    deleted_at       timestamptz,
    last_synced_at   timestamptz
);

create index if not exists idx_meetings_ward on meetings (ward_id) where not deleted;

-- =====================================================================
-- MEETING MINUTES
-- =====================================================================
-- Modeled as a child table (not a single column on meetings) so a
-- meeting can have amended/versioned minutes over time — the current
-- app only ever writes one entry per meeting, so a straight 1:1
-- migration is expected, but the schema doesn't hard-code that limit.
create table if not exists meeting_minutes (
    id               uuid primary key default gen_random_uuid(),
    meeting_id       uuid not null references meetings(id) on delete cascade,
    content          text,
    action_points    text,
    recorded_by      text,
    recorded_at      timestamptz not null default now(),
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),
    updated_by       text,
    created_by       text,
    device_id        text,
    version          integer not null default 1,
    deleted          boolean not null default false,
    deleted_at       timestamptz,
    last_synced_at   timestamptz
);

create index if not exists idx_meeting_minutes_meeting on meeting_minutes (meeting_id) where not deleted;

-- =====================================================================
-- CAMPAIGNS
-- =====================================================================
create table if not exists campaigns (
    id               uuid primary key default gen_random_uuid(),
    ward_id          uuid not null references wards(id) on delete cascade,
    name             text not null,
    coordinator      text,
    start_date       date,
    end_date         date,
    notes            text,
    performance      text default 'Pending',
    status           text not null default 'Active',
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),
    updated_by       text,
    created_by       text,
    device_id        text,
    version          integer not null default 1,
    deleted          boolean not null default false,
    deleted_at       timestamptz,
    last_synced_at   timestamptz
);

create index if not exists idx_campaigns_ward on campaigns (ward_id) where not deleted;

-- Join table: a campaign has many assigned members (matches the existing
-- `campaign.members` array in the JSON model).
create table if not exists campaign_members (
    id               uuid primary key default gen_random_uuid(),
    campaign_id      uuid not null references campaigns(id) on delete cascade,
    member_id        uuid not null references members(id) on delete cascade,
    created_at       timestamptz not null default now(),
    unique (campaign_id, member_id)
);

create index if not exists idx_campaign_members_campaign on campaign_members (campaign_id);
create index if not exists idx_campaign_members_member on campaign_members (member_id);

-- =====================================================================
-- NOTIFICATIONS  (SMS / WhatsApp / communications history)
-- =====================================================================
create table if not exists notifications (
    id               uuid primary key default gen_random_uuid(),
    ward_id          uuid not null references wards(id) on delete cascade,
    channel          text not null default 'sms', -- 'sms' | 'whatsapp' | 'email'
    recipient_member_id uuid references members(id) on delete set null,
    recipient_phone  text,
    message          text not null,
    status           text not null default 'pending', -- 'pending' | 'sent' | 'failed'
    sent_at          timestamptz,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),
    updated_by       text,
    created_by       text,
    device_id        text,
    version          integer not null default 1,
    deleted          boolean not null default false,
    deleted_at       timestamptz,
    last_synced_at   timestamptz
);

create index if not exists idx_notifications_ward on notifications (ward_id) where not deleted;
create index if not exists idx_notifications_status on notifications (ward_id, status) where not deleted;

-- =====================================================================
-- AUDIT LOGS
-- =====================================================================
-- Append-only by convention (the app never edits a past audit entry),
-- but the standard metadata columns are kept for schema consistency
-- and because Sprint 5 (conflict resolution) writes its own conflict
-- log entries here too.
create table if not exists audit_logs (
    id               uuid primary key default gen_random_uuid(),
    ward_id          uuid references wards(id) on delete set null,
    action           text not null,
    role             text,
    actor_user       text,
    meta             jsonb not null default '{}'::jsonb,
    occurred_at      timestamptz not null default now(),
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),
    updated_by       text,
    created_by       text,
    device_id        text,
    version          integer not null default 1,
    deleted          boolean not null default false,
    deleted_at       timestamptz,
    last_synced_at   timestamptz
);

create index if not exists idx_audit_logs_ward on audit_logs (ward_id);
create index if not exists idx_audit_logs_occurred_at on audit_logs (occurred_at desc);

-- =====================================================================
-- END OF SPRINT 1 SCHEMA
-- =====================================================================
