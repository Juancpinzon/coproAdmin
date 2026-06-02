import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const serviceRoleMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

if (!urlMatch || (!keyMatch && !serviceRoleMatch)) throw new Error('Missing env vars');

const key = serviceRoleMatch ? serviceRoleMatch[1].trim() : keyMatch![1].trim();

const supabase = createClient(urlMatch[1].trim(), key);

async function check() {
  const { data: miembros, error: mError } = await supabase.from('miembros').select('id, nombre_completo, rol, tenant_id').limit(10);
  console.log("Miembros:", JSON.stringify(miembros, null, 2));
  if (mError) console.error("Error miembros:", mError);

  const { data: tenants, error: tError } = await supabase.from('tenants').select('id, nombre, tenant_type, num_unidades').limit(10);
  console.log("Tenants:", JSON.stringify(tenants, null, 2));
  if (tError) console.error("Error tenants:", tError);
}

check();
