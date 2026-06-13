import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const MANIFEST_PATH = './scratch/testimonials-import/google-reviews/testimonials-google-reviews.json';

async function main() {
  console.log('=== Starting Sweet Fork Testimonials Import ===');

  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Manifest not found at ${MANIFEST_PATH}`);
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  console.log(`Loaded manifest with ${manifest.length} entries.`);

  const envPath = './.env.local';
  if (!fs.existsSync(envPath)) {
    throw new Error('Missing .env.local file');
  }
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      env[match[1]] = value.trim();
    }
  });

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('Supabase credentials url/secret_key not found in .env.local');
  }
  console.log(`Configured Supabase URL: ${supabaseUrl}`);

  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('\n--- Importing Testimonials into Supabase ---');

  let imported = 0;
  let skipped = 0;

  for (const item of manifest) {
    // Skip template rows or empty rows
    if (!item.reviewer_name && !item.review_text) {
      console.log(`Skipping empty/template row`);
      skipped++;
      continue;
    }

    const payload = {
      attribution_name: item.reviewer_name || item.reviewer_display_name,
      attribution_role: item.product_context || item.event_context || item.location_context || null,
      source_label: item.source === 'google_business_profile' ? 'Google' : null,
      quote: item.review_text,
      display_order: item.feature_priority || 0,
      is_featured: !!item.featured,
      is_published: item.status === 'published'
    };

    // Check for existing by exact quote or attribution_name
    const { data: existing, error: searchError } = await supabase
      .from('testimonials')
      .select('id, quote, attribution_name')
      .or(`quote.eq."${payload.quote}",attribution_name.eq."${payload.attribution_name}"`);

    if (searchError) {
      throw new Error(`Failed to search existing testimonials: ${searchError.message}`);
    }

    if (existing && existing.length > 0) {
      console.log(`Found existing testimonial for ${payload.attribution_name}, updating...`);
      const { error: updateError } = await supabase
        .from('testimonials')
        .update(payload)
        .eq('id', existing[0].id);

      if (updateError) {
        throw new Error(`Failed to update testimonial: ${updateError.message}`);
      }
    } else {
      console.log(`Creating new testimonial for ${payload.attribution_name}...`);
      const { error: insertError } = await supabase
        .from('testimonials')
        .insert(payload);

      if (insertError) {
        throw new Error(`Failed to insert testimonial: ${insertError.message}`);
      }
    }
    imported++;
  }

  console.log(`\nImport complete! Imported/Updated: ${imported}, Skipped: ${skipped}`);
}

main().catch(err => {
  console.error('\n*** ERROR RUNNING IMPORT SCRIPT ***');
  console.error(err.message || err);
  process.exit(1);
});
