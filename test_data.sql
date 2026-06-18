-- =============================================================================
-- SAS RELAY — TEST DATA
-- Run AFTER alembic upgrade head (tables must exist first)
-- Safe to re-run: uses ON CONFLICT DO NOTHING
-- =============================================================================

-- ── 1. Phone Numbers ──────────────────────────────────────────────────────────

INSERT INTO banned_users_sms_gateway
  (phone_number, banned, temp_ban, date_banned, date_ban_expire, ban_reason, banned_by,
   date_unbanned, unbanned_by, unban_reason, msg_attempts, last_msg_attempt, opt_out, auto_temp_ban_count)
VALUES
  -- Permanently banned
  ('+12025550101', TRUE,  FALSE, NOW() - INTERVAL '2 days',  NULL,                          'Repeated spam messages',         'admin',   NULL, NULL, NULL, 47, NOW() - INTERVAL '3 hours', FALSE, 1),
  ('+12025550102', TRUE,  FALSE, NOW() - INTERVAL '5 days',  NULL,                          'Harassment complaint',           'admin',   NULL, NULL, NULL, 12, NOW() - INTERVAL '1 day',   FALSE, 0),
  ('+12025550103', TRUE,  FALSE, NOW() - INTERVAL '1 hour',  NULL,                          'Auto-banned: 3 violations',      'system',  NULL, NULL, NULL, 89, NOW() - INTERVAL '30 mins', FALSE, 3),

  -- Temp banned (expires in future)
  ('+12025550104', TRUE,  TRUE,  NOW() - INTERVAL '1 day',   NOW() + INTERVAL '6 hours',    'Suspicious burst activity',      'admin',   NULL, NULL, NULL, 23, NOW() - INTERVAL '4 hours', FALSE, 2),
  ('+12025550105', TRUE,  TRUE,  NOW() - INTERVAL '3 hours', NOW() + INTERVAL '45 mins',    'Rate limit exceeded',            'admin',   NULL, NULL, NULL, 31, NOW() - INTERVAL '2 hours', FALSE, 1),
  ('+12025550106', TRUE,  TRUE,  NOW() - INTERVAL '6 hours', NOW() + INTERVAL '18 hours',   'Under investigation',            'admin',   NULL, NULL, NULL, 5,  NOW() - INTERVAL '6 hours', FALSE, 0),

  -- Active (not banned)
  ('+12025550107', FALSE, FALSE, NULL,                        NULL,                          NULL,                             NULL,      NULL, NULL, NULL, 102, NOW() - INTERVAL '1 hour',  FALSE, 0),
  ('+12025550108', FALSE, FALSE, NULL,                        NULL,                          NULL,                             NULL,      NULL, NULL, NULL, 7,   NOW() - INTERVAL '2 days',  FALSE, 0),

  -- Opted out
  ('+12025550109', FALSE, FALSE, NULL,                        NULL,                          NULL,                             NULL,      NULL, NULL, NULL, 3,   NOW() - INTERVAL '4 days',  TRUE,  0),
  ('+12025550110', FALSE, FALSE, NULL,                        NULL,                          NULL,                             NULL,      NULL, NULL, NULL, 0,   NULL,                       TRUE,  0),

  -- Previously banned, now unbanned
  ('+12025550111', FALSE, FALSE, NOW() - INTERVAL '10 days', NULL,                          'Spam',                           'admin',   NOW() - INTERVAL '2 days', 'admin', 'Issue resolved', 15, NOW() - INTERVAL '3 days', FALSE, 0),

  -- Repeat offender (triggers incident)
  ('+12025550199', TRUE,  FALSE, NOW() - INTERVAL '30 mins', NULL,                          'Auto-banned multiple times',     'system',  NULL, NULL, NULL, 201, NOW() - INTERVAL '20 mins', FALSE, 4)

ON CONFLICT (phone_number) DO NOTHING;


-- ── 2. App Email Addresses ────────────────────────────────────────────────────

INSERT INTO banned_apps_sms_gateway
  (email_address, banned, temp_ban, date_banned, date_ban_expire, ban_reason, banned_by,
   date_unbanned, unbanned_by, unbanned_reason, msg_attempts, last_msg_attempt)
VALUES
  -- Permanently banned
  ('marketing-blast@corp.com',  TRUE,  FALSE, NOW() - INTERVAL '3 days',  NULL,                       'Exceeded daily cap repeatedly',  'admin', NULL, NULL, NULL, 5420, NOW() - INTERVAL '3 days'),
  ('noreply@legacy-app.com',    TRUE,  FALSE, NOW() - INTERVAL '7 days',  NULL,                       'Decommissioned app',             'admin', NULL, NULL, NULL, 312,  NOW() - INTERVAL '7 days'),

  -- Temp banned
  ('alerts@monitoring.corp',    TRUE,  TRUE,  NOW() - INTERVAL '2 hours', NOW() + INTERVAL '22 hours','Runaway alert loop',             'admin', NULL, NULL, NULL, 2100, NOW() - INTERVAL '1 hour'),

  -- Active
  ('sms-service@corp.com',      FALSE, FALSE, NULL,                        NULL,                       NULL,                             NULL,   NULL, NULL, NULL, 890,  NOW() - INTERVAL '30 mins'),
  ('notifications@webapp.corp', FALSE, FALSE, NULL,                        NULL,                       NULL,                             NULL,   NULL, NULL, NULL, 44,   NOW() - INTERVAL '5 hours')

ON CONFLICT (email_address) DO NOTHING;


-- ── 3. AD Group Roles ─────────────────────────────────────────────────────────

INSERT INTO ad_group_roles (group_name, role, added_by, added_at)
VALUES
  ('CN=SAS-Admins,OU=Groups,DC=corp,DC=com',    'admin',    'admin', NOW() - INTERVAL '30 days'),
  ('CN=SAS-Helpdesk,OU=Groups,DC=corp,DC=com',  'helpdesk', 'admin', NOW() - INTERVAL '30 days'),
  ('CN=IT-Operations,OU=Groups,DC=corp,DC=com', 'helpdesk', 'admin', NOW() - INTERVAL '15 days')
ON CONFLICT (group_name) DO NOTHING;


-- ── 4. Auto-Ban Rules ─────────────────────────────────────────────────────────

INSERT INTO auto_ban_rules (title, condition_text, action_text, enabled, trigger_count, created_by, created_at)
VALUES
  (
    '3-Strike Auto Temp Ban',
    'msg_attempts >= 3 AND all attempts blocked within 1 hour',
    'Apply 24-hour temp ban automatically',
    TRUE, 14, 'admin', NOW() - INTERVAL '20 days'
  ),
  (
    'Burst Detection',
    'More than 50 messages attempted in under 10 minutes',
    'Apply 6-hour temp ban and alert admin',
    TRUE, 3, 'admin', NOW() - INTERVAL '10 days'
  ),
  (
    'Repeat Offender Escalation',
    'auto_temp_ban_count >= 3',
    'Flag for manual review — consider permanent ban',
    TRUE, 2, 'admin', NOW() - INTERVAL '5 days'
  )
ON CONFLICT DO NOTHING;


-- ── 5. Message Log ────────────────────────────────────────────────────────────

INSERT INTO message_log (app_email, phone_number, attempted_at, status, block_reason)
VALUES
  ('sms-service@corp.com',      '+12025550107', NOW() - INTERVAL '1 hour',    'Delivered', NULL),
  ('sms-service@corp.com',      '+12025550108', NOW() - INTERVAL '2 hours',   'Delivered', NULL),
  ('sms-service@corp.com',      '+12025550101', NOW() - INTERVAL '3 hours',   'Blocked',   'phone_banned'),
  ('sms-service@corp.com',      '+12025550101', NOW() - INTERVAL '4 hours',   'Blocked',   'phone_banned'),
  ('notifications@webapp.corp', '+12025550109', NOW() - INTERVAL '5 hours',   'Blocked',   'opt_out'),
  ('alerts@monitoring.corp',    '+12025550107', NOW() - INTERVAL '1 hour',    'Throttled', 'cap_exceeded'),
  ('alerts@monitoring.corp',    '+12025550107', NOW() - INTERVAL '70 mins',   'Throttled', 'cap_exceeded'),
  ('marketing-blast@corp.com',  '+12025550102', NOW() - INTERVAL '3 days',    'Blocked',   'email_banned'),
  ('sms-service@corp.com',      '+12025550199', NOW() - INTERVAL '20 mins',   'Blocked',   'phone_banned'),
  ('sms-service@corp.com',      '+12025550104', NOW() - INTERVAL '90 mins',   'Blocked',   'temp_banned');


-- ── 7. Audit Log ─────────────────────────────────────────────────────────────

INSERT INTO sms_gateway_portal_log (action, entity_type, entity_value, performed_by, performed_at, reason, extra_data)
VALUES
  ('BAN',           'phone', '+12025550101', 'admin',  NOW() - INTERVAL '2 days',   'Repeated spam messages',         '{"is_temporary": false}'),
  ('BAN',           'phone', '+12025550102', 'admin',  NOW() - INTERVAL '5 days',   'Harassment complaint',           '{"is_temporary": false}'),
  ('TEMP_BAN',      'phone', '+12025550103', 'system', NOW() - INTERVAL '1 hour',   'Auto-banned: 3 violations',      '{"is_temporary": true, "hours": 24}'),
  ('TEMP_BAN',      'phone', '+12025550104', 'admin',  NOW() - INTERVAL '1 day',    'Suspicious burst activity',      '{"is_temporary": true, "hours": 24}'),
  ('TEMP_BAN',      'phone', '+12025550105', 'admin',  NOW() - INTERVAL '3 hours',  'Rate limit exceeded',            '{"is_temporary": true, "hours": 3}'),
  ('TEMP_BAN',      'phone', '+12025550106', 'admin',  NOW() - INTERVAL '6 hours',  'Under investigation',            '{"is_temporary": true, "hours": 24}'),
  ('OPT_OUT',       'phone', '+12025550109', 'system', NOW() - INTERVAL '4 days',   NULL,                             NULL),
  ('OPT_OUT',       'phone', '+12025550110', 'system', NOW() - INTERVAL '10 days',  NULL,                             NULL),
  ('BAN',           'phone', '+12025550199', 'system', NOW() - INTERVAL '30 mins',  'Auto-banned multiple times',     '{"is_temporary": false}'),
  ('UNBAN',         'phone', '+12025550111', 'admin',  NOW() - INTERVAL '2 days',   'Issue resolved',                 NULL),
  ('BAN',           'email', 'marketing-blast@corp.com',  'admin', NOW() - INTERVAL '3 days',  'Exceeded daily cap repeatedly', '{"is_temporary": false}'),
  ('BAN',           'email', 'noreply@legacy-app.com',    'admin', NOW() - INTERVAL '7 days',  'Decommissioned app',            '{"is_temporary": false}'),
  ('TEMP_BAN',      'email', 'alerts@monitoring.corp',    'admin', NOW() - INTERVAL '2 hours', 'Runaway alert loop',            '{"is_temporary": true, "hours": 24}'),
  ('GROUP_ADDED',   'group', 'CN=SAS-Admins,OU=Groups,DC=corp,DC=com',   'admin', NOW() - INTERVAL '30 days', NULL, '{"role": "admin"}'),
  ('GROUP_ADDED',   'group', 'CN=SAS-Helpdesk,OU=Groups,DC=corp,DC=com', 'admin', NOW() - INTERVAL '30 days', NULL, '{"role": "helpdesk"}'),
  ('CAP_UPDATED',   'email', 'sms-service@corp.com',      'admin', NOW() - INTERVAL '5 days',  NULL,                            '{"cap_per_hour": 500}'),
  ('RULE_CREATED',  'rule',  '3-Strike Auto Temp Ban',    'admin', NOW() - INTERVAL '20 days', NULL,                            NULL),
  ('ACTIVATE',      'phone', '+12025550111', 'admin',  NOW() - INTERVAL '2 days',   'Issue resolved',                 NULL);
