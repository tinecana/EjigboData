-- =====================================================================
-- PWMS ENTERPRISE REFACTOR — SPRINT 1: ROLLBACK
-- =====================================================================
-- Drops ONLY the tables created by sprint1_schema.sql, in dependency
-- order. Your existing ward-JSON storage and everything the live app
-- depends on are untouched — the application does not read from these
-- tables yet (that's Sprint 3), so this rollback has zero user-facing
-- impact if executed.
-- =====================================================================

drop table if exists campaign_members cascade;
drop table if exists notifications cascade;
drop table if exists audit_logs cascade;
drop table if exists meeting_minutes cascade;
drop table if exists meetings cascade;
drop table if exists campaigns cascade;
drop table if exists attendance_records cascade;
drop table if exists attendance_sessions cascade;
drop table if exists members cascade;
drop table if exists executives cascade;
drop table if exists streets cascade;
drop table if exists polling_units cascade;
drop table if exists wards cascade;

-- Note: "pgcrypto" extension is left in place, since other parts of
-- your Supabase project may already depend on it independently of
-- this migration.
