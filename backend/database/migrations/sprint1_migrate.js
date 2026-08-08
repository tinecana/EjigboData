/**
 * PWMS ENTERPRISE REFACTOR — SPRINT 1: MIGRATION SCRIPT
 * =====================================================
 *
 * Reads the existing ward-JSON records (the same shape as db[ward] in
 * index.html — units, excos, wardStreets, voters, attendance,
 * attendanceSessions, meetings, campaigns, settings) and populates the
 * new normalized tables created by sprint1_schema.sql.
 *
 * This script is NON-DESTRUCTIVE:
 *   - It only reads from your existing ward storage.
 *   - It only INSERTs/UPSERTs into the new tables.
 *   - It never writes to, drops, or alters your existing ward-JSON table.
 *   - The live application keeps working on the old storage throughout
 *     and after this migration — nothing depends on the new tables yet.
 *
 * It is SAFE TO RE-RUN: every insert is keyed off a natural identifier
 * (ward name, unit_num, street name, position, phone/NIN/etc. where
 * available) with an ON CONFLICT upsert, so running it twice updates
 * rather than duplicates.
 *
 * -------------------------------------------------------------------
 * CONFIGURATION — set these two things before running:
 * -------------------------------------------------------------------
 * 1. Environment variables:
 *      SUPABASE_URL
 *      SUPABASE_SERVICE_ROLE_KEY   (service role, not the anon key —
 *                                    this script needs to bypass RLS
 *                                    to backfill historical data)
 *
 * 2. SOURCE_TABLE / SOURCE_WARD_COLUMN / SOURCE_DATA_COLUMN below:
 *    I don't have access to your actual api.js, so I can't know the
 *    exact table/column names your current ward-JSON storage uses.
 *    Point these three constants at wherever `API.saveWard(ward, data)`
 *    actually persists to, and the rest of the script needs no changes.
 *
 * Run with:
 *    npm install @supabase/supabase-js
 *    node sprint1_migrate.js
 * -------------------------------------------------------------------
 */
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// ---- CONFIGURATION: point these at your real ward-JSON storage -----
const SOURCE_TABLE = "ward_data";     // <-- set to your actual table name
const SOURCE_WARD_COLUMN = "ward";    // <-- column holding the ward name
const SOURCE_DATA_COLUMN = "data";    // <-- jsonb column holding the ward blob
// ----------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[MIGRATE] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const stats = {
  wards: 0, pollingUnits: 0, streets: 0, executives: 0, members: 0,
  attendanceSessions: 0, attendanceRecords: 0, meetings: 0, meetingMinutes: 0,
  campaigns: 0, campaignMembers: 0, errors: []
};

function log(msg, ...rest) {
  console.log(`[MIGRATE] ${msg}`, ...rest);
}

function toISO(dateLike) {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

async function fetchSourceWards() {
  const { data, error } = await supabase.from(SOURCE_TABLE).select("*");
  if (error) throw new Error(`Failed to read source table "${SOURCE_TABLE}": ${error.message}`);
  return data || [];
}

async function upsertWard(wardName, wardJson) {
  const { data, error } = await supabase
    .from("wards")
    .upsert(
      {
        name: wardName,
        settings: wardJson.settings || {},
        updated_at: new Date().toISOString(),
        created_by: null, // no creator field exists on the source ward object
        device_id: null,  // no device concept in the legacy data
        last_synced_at: new Date().toISOString()
      },
      { onConflict: "name" }
    )
    .select()
    .single();

  if (error) throw new Error(`Ward upsert failed for "${wardName}": ${error.message}`);
  stats.wards++;
  return data.id;
}

async function migratePollingUnits(wardId, units) {
  const unitIdByNum = {};
  for (const u of units || []) {
    if (!u.num) continue;
    const { data, error } = await supabase
      .from("polling_units")
      .upsert(
        { ward_id: wardId, unit_num: String(u.num), name: u.name || u.code || null, created_by: null, device_id: null },
        { onConflict: "ward_id,unit_num" }
      )
      .select()
      .single();

    if (error) {
      stats.errors.push(`polling_unit ${u.num}: ${error.message}`);
      continue;
    }
    unitIdByNum[String(u.num)] = data.id;
    stats.pollingUnits++;
  }
  return unitIdByNum;
}

async function migrateStreets(wardId, wardStreets) {
  const streetIdByName = {};
  for (const s of wardStreets || []) {
    if (!s.name) continue;
    const { data, error } = await supabase
      .from("streets")
      .upsert(
        { ward_id: wardId, name: s.name, leader: s.leader || null, notes: s.notes || null, created_by: null, device_id: null },
        { onConflict: "ward_id,name" }
      )
      .select()
      .single();

    if (error) {
      stats.errors.push(`street ${s.name}: ${error.message}`);
      continue;
    }
    streetIdByName[s.name] = data.id;
    stats.streets++;
  }
  return streetIdByName;
}

async function migrateExecutives(wardId, excos) {
  for (const e of excos || []) {
    if (!e.pos) continue;
    const { error } = await supabase
      .from("executives")
      .upsert(
        { ward_id: wardId, position: e.pos, name: e.name || null, phone: e.phone || null, created_by: null, device_id: null },
        { onConflict: "ward_id,position" }
      );

    if (error) { stats.errors.push(`exco ${e.pos}: ${error.message}`); continue; }
    stats.executives++;
  }
}

async function migrateMembers(wardId, voters, unitIdByNum, streetIdByName) {
  const memberIdByPhoneOrId = {};
  for (const unitNum of Object.keys(voters || {})) {
    for (const m of voters[unitNum] || []) {
      const row = {
        ward_id: wardId,
        polling_unit_id: unitIdByNum[String(unitNum)] || null,
        street_id: m.street ? (streetIdByName[m.street] || null) : null,
        name: m.name || "Unknown",
        gender: m.gender || null,
        date_of_birth: m.dob ? toISO(m.dob) : null,
        phone: m.phone || null,
        alt_phone: m.altPhone || null,
        email: m.email || null,
        occupation: m.occupation || null,
        support_level: m.supportLevel || null,
        address: m.address || null,
        notes: m.notes || null,
        nin: m.nin || null,
        vin: m.vin || null,
        apc_caucus: m.apcCaucus || "Not Specified",
        passport_url: m.passport || null,
        membership_number: m.membershipNumber || null,
        qr_id: m.qrId || null,
        status: m.status || "active",
        registration_date: toISO(m.registrationDate),
        updated_by: m.updatedBy || m.createdBy || null,
        created_by: m.createdBy || null, // populated where the source record has it
        device_id: null,                 // no device concept in the legacy data
        last_synced_at: new Date().toISOString()
      };

      // Natural key for idempotent re-runs: prefer membership_number, then qr_id,
      // then phone — falls back to a fresh insert if none are present.
      let query = supabase.from("members");
      let matchKey = null, matchVal = null;
      if (row.membership_number) { matchKey = "membership_number"; matchVal = row.membership_number; }
      else if (row.qr_id) { matchKey = "qr_id"; matchVal = row.qr_id; }
      else if (row.phone) { matchKey = "phone"; matchVal = row.phone; }

      let result;
      if (matchKey) {
        const { data: existing } = await supabase
          .from("members")
          .select("id")
          .eq("ward_id", wardId)
          .eq(matchKey, matchVal)
          .maybeSingle();

        if (existing) {
          result = await supabase.from("members").update(row).eq("id", existing.id).select().single();
        } else {
          result = await supabase.from("members").insert(row).select().single();
        }
      } else {
        result = await supabase.from("members").insert(row).select().single();
      }

      if (result.error) {
        stats.errors.push(`member ${m.name}: ${result.error.message}`);
        continue;
      }
      stats.members++;
      const key = m.id || m.qrId || row.phone;
      if (key) memberIdByPhoneOrId[key] = result.data.id;
      if (row.phone) memberIdByPhoneOrId[row.phone] = result.data.id;
    }
  }
  return memberIdByPhoneOrId;
}

async function migrateAttendance(wardId, sessions, memberIdByPhoneOrId) {
  for (const s of sessions || []) {
    const { data: sessionRow, error: sessionErr } = await supabase
      .from("attendance_sessions")
      .insert({
        ward_id: wardId,
        title: s.title || "Session",
        venue: s.venue || null,
        session_date: s.date ? toISO(s.date) : null,
        status: s.status || "closed",
        closed_at: toISO(s.closedAt),
        created_by: null, // no creator field on the source session object
        device_id: null,
        created_at: toISO(s.createdAt) || new Date().toISOString()
      })
      .select()
      .single();

    if (sessionErr) { stats.errors.push(`session ${s.title}: ${sessionErr.message}`); continue; }
    stats.attendanceSessions++;

    const allAttendees = [
      ...(s.returning || []).map(a => ({ ...a, attendee_type: "returning" })),
      ...(s.newMembers || []).map(a => ({ ...a, attendee_type: "new" }))
    ];

    for (const a of allAttendees) {
      const memberId = memberIdByPhoneOrId[a.phone] || null;
      const { error: recErr } = await supabase.from("attendance_records").insert({
        session_id: sessionRow.id,
        member_id: memberId,
        attendee_type: a.attendee_type,
        name: a.name || null,
        phone: a.phone || null,
        approved: a.approved !== false,
        marked_at: toISO(a.markedAt) || new Date().toISOString(),
        created_by: null, // no creator field on the source attendee entry
        device_id: null
      });

      if (recErr) { stats.errors.push(`attendance record for ${a.phone}: ${recErr.message}`); continue; }
      stats.attendanceRecords++;
    }
  }
}

async function migrateMeetings(wardId, meetings) {
  for (const m of meetings || []) {
    const { data: meetingRow, error } = await supabase
      .from("meetings")
      .insert({
        ward_id: wardId,
        title: m.title,
        meeting_date: m.date ? toISO(m.date) : null,
        venue: m.venue || null,
        agenda: m.agenda || null,
        status: m.status || "Scheduled",
        created_by: null, // no creator field on the source meeting object
        device_id: null,
        created_at: toISO(m.createdAt) || new Date().toISOString(),
        updated_at: toISO(m.updatedAt) || new Date().toISOString()
      })
      .select()
      .single();

    if (error) { stats.errors.push(`meeting ${m.title}: ${error.message}`); continue; }
    stats.meetings++;

    if (m.minutes || m.actions) {
      const { error: minErr } = await supabase.from("meeting_minutes").insert({
        meeting_id: meetingRow.id,
        content: m.minutes || null,
        action_points: m.actions || null,
        recorded_at: toISO(m.updatedAt) || new Date().toISOString(),
        created_by: null, // no distinct creator field on the source meeting object
        device_id: null
      });
      if (minErr) { stats.errors.push(`minutes for ${m.title}: ${minErr.message}`); continue; }
      stats.meetingMinutes++;
    }
  }
}

async function migrateCampaigns(wardId, campaigns, memberIdByPhoneOrId) {
  for (const c of campaigns || []) {
    const { data: campaignRow, error } = await supabase
      .from("campaigns")
      .insert({
        ward_id: wardId,
        name: c.name,
        coordinator: c.coordinator || null,
        start_date: c.start ? toISO(c.start) : null,
        end_date: c.end ? toISO(c.end) : null,
        notes: c.notes || null,
        performance: c.performance || "Pending",
        status: c.status || "Active",
        created_by: null, // no creator field on the source campaign object
        device_id: null,
        created_at: toISO(c.createdAt) || new Date().toISOString()
      })
      .select()
      .single();

    if (error) { stats.errors.push(`campaign ${c.name}: ${error.message}`); continue; }
    stats.campaigns++;

    for (const memberRef of c.members || []) {
      const memberId = memberIdByPhoneOrId[memberRef.phone || memberRef.id || memberRef];
      if (!memberId) continue;
      const { error: cmErr } = await supabase
        .from("campaign_members")
        .upsert({ campaign_id: campaignRow.id, member_id: memberId }, { onConflict: "campaign_id,member_id" });
      if (cmErr) { stats.errors.push(`campaign_member for ${c.name}: ${cmErr.message}`); continue; }
      stats.campaignMembers++;
    }
  }
}

async function migrateWard(wardName, wardJson) {
  log(`Migrating ward "${wardName}"...`);
  const wardId = await upsertWard(wardName, wardJson);

  const unitIdByNum = await migratePollingUnits(wardId, wardJson.units);
  const streetIdByName = await migrateStreets(wardId, wardJson.wardStreets);
  await migrateExecutives(wardId, wardJson.excos);
  const memberIdByPhoneOrId = await migrateMembers(wardId, wardJson.voters, unitIdByNum, streetIdByName);
  await migrateAttendance(wardId, wardJson.attendanceSessions, memberIdByPhoneOrId);
  await migrateMeetings(wardId, wardJson.meetings);
  await migrateCampaigns(wardId, wardJson.campaigns, memberIdByPhoneOrId);

  log(`Finished ward "${wardName}".`);
}

async function main() {
  log("Starting Sprint 1 migration (read-only against existing storage, additive-only writes)...");
  const sourceRows = await fetchSourceWards();
  log(`Found ${sourceRows.length} ward record(s) in "${SOURCE_TABLE}".`);

  for (const row of sourceRows) {
    const wardName = row[SOURCE_WARD_COLUMN];
    const wardJson = row[SOURCE_DATA_COLUMN] || {};
    if (!wardName) {
      stats.errors.push(`Source row missing "${SOURCE_WARD_COLUMN}" column, skipped.`);
      continue;
    }
    try {
      await migrateWard(wardName, wardJson);
    } catch (err) {
      stats.errors.push(`Ward "${wardName}": ${err.message}`);
      log(`ERROR migrating ward "${wardName}":`, err.message);
    }
  }

  log("=== MIGRATION SUMMARY ===");
  log(`Wards:               ${stats.wards}`);
  log(`Polling units:       ${stats.pollingUnits}`);
  log(`Streets:             ${stats.streets}`);
  log(`Executives:          ${stats.executives}`);
  log(`Members:             ${stats.members}`);
  log(`Attendance sessions: ${stats.attendanceSessions}`);
  log(`Attendance records:  ${stats.attendanceRecords}`);
  log(`Meetings:            ${stats.meetings}`);
  log(`Meeting minutes:     ${stats.meetingMinutes}`);
  log(`Campaigns:           ${stats.campaigns}`);
  log(`Campaign members:    ${stats.campaignMembers}`);
  log(`Errors:              ${stats.errors.length}`);
  if (stats.errors.length) {
    log("--- Error detail ---");
    stats.errors.forEach(e => log("  -", e));
  }
}

main().catch(err => {
  console.error("[MIGRATE] Fatal error:", err);
  process.exit(1);
});
