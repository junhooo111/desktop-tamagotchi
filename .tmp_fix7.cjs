const fs = require('fs')
function rd(f) { return fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n') }
let s = rd('supabase/migrations/0014_friends.sql')
function rep(a, b) { if (!s.includes(a)) throw new Error('missing ' + a.slice(0, 60)); s = s.replace(a, () => b) }
rep("  v_mutual := v_theirs = v_today;", "  v_mutual := coalesce(v_theirs = v_today, false);")
rep("           (case when v_uid = f.user_lo then f.last_wave_lo else f.last_wave_hi end) = v_today,\n           (case when v_uid = f.user_lo then f.last_wave_hi else f.last_wave_lo end) = v_today,", "           coalesce((case when v_uid = f.user_lo then f.last_wave_lo else f.last_wave_hi end) = v_today, false),\n           coalesce((case when v_uid = f.user_lo then f.last_wave_hi else f.last_wave_lo end) = v_today, false),")
fs.writeFileSync('supabase/migrations/0014_friends.sql', s)

let t = rd('supabase/tests/friends.test.ts')
function rept(a, b) { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 60)); t = t.replace(a, () => b) }
rept("const newDay = (id: string) => admin(db, \"update public.friend_events set created_at = created_at - interval '1 day' where friendship_id = $1; update public.friendships set last_wave_lo = null, last_wave_hi = null where id = $1\", [id]);", "const newDay = async (id: string) => {\n  await admin(db, \"update public.friend_events set created_at = created_at - interval '1 day' where friendship_id = $1\", [id]);\n  await admin(db, 'update public.friendships set last_wave_lo = null, last_wave_hi = null where id = $1', [id]);\n};")
rept("    await admin(db, 'update public.profiles set tickets = 0 where user_id = $1; delete from public.ledger where user_id = $1 and currency = \'ticket\'', [poor]);", "    await admin(db, 'update public.profiles set tickets = 0 where user_id = $1', [poor]);\n    await admin(db, \"delete from public.ledger where user_id = $1 and currency = 'ticket'\", [poor]);")
rept("    await admin(db, \"insert into public.ledger (user_id, delta, reason, currency) values ($1, 98, 'friend_reward', 'ticket'); update public.profiles set tickets = tickets + 98 where user_id = $1\", [ua]);", "    await admin(db, \"insert into public.ledger (user_id, delta, reason, currency) values ($1, 98, 'friend_reward', 'ticket')\", [ua]);\n    await admin(db, 'update public.profiles set tickets = tickets + 98 where user_id = $1', [ua]);")
fs.writeFileSync('supabase/tests/friends.test.ts', t)
