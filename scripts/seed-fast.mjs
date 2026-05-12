/**
 * CHUPETE CLICKER — Fast Item Seeder
 * Inserts all 750 items from generate-chupete.mjs WITHOUT image generation.
 * Items get image_url='' and show the 🎁 fallback in the UI.
 * Run: node seed-fast.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import ws from 'ws'

const SUPABASE_URL = 'https://wudlmpexpazsvuxfdkcl.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1ZGxtcGV4cGF6c3Z1eGZka2NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE0Nzg0MywiZXhwIjoyMDkzNzIzODQzfQ.igLwZ2Z59JmiWvVyADKAaG8RL3ZguEZ2Y-n5n3pSUvs'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  realtime: { transport: ws }
})

const BASE_PRICES = {
  comun:          50,
  poco_comun:     200,
  medio_raro:     800,
  raro:           3_500,
  ultra_raro:     12_000,
  legendario:     50_000,
  extraterrestre: 200_000,
  en_el_ort:      999_999,
}

// Extract CHUPETES array from the generator script
const src = readFileSync('./generate-chupete.mjs', 'utf8').replace(/\r\n/g, '\n')
const start = src.indexOf('const CHUPETES = [')
const asyncIdx = src.indexOf('async function generarImagen')
if (start === -1 || asyncIdx === -1) {
  console.error('❌ No se pudo extraer el array CHUPETES de generate-chupete.mjs')
  process.exit(1)
}
// Find the last ] before 'async function generarImagen'
const between = src.slice(start, asyncIdx)
const relEnd = between.lastIndexOf(']')
const arrayStr = between.slice('const CHUPETES = '.length, relEnd + 1)
const CHUPETES = new Function('return ' + arrayStr)()
console.log(`🍬 Fast Seeder — ${CHUPETES.length} items sin imágenes\n`)

const BATCH = 50

async function main() {
  let inserted = 0
  let errors = 0

  for (let i = 0; i < CHUPETES.length; i += BATCH) {
    const chunk = CHUPETES.slice(i, i + BATCH)
    const rows = chunk.map(([nombre, rareza, descripcion]) => ({
      name: nombre,
      rarity: rareza,
      description: descripcion,
      image_url: '',
      base_price_ars: BASE_PRICES[rareza] ?? 50,
    }))

    const { error } = await supabase.from('items').insert(rows)

    if (error) {
      console.log(`⚠️  Lote ${Math.floor(i / BATCH) + 1}: ${error.message}`)
      errors += chunk.length
    } else {
      inserted += chunk.length
      process.stdout.write(`✅ ${i + chunk.length}/${CHUPETES.length}\r`)
    }
  }

  console.log(`\n\n✨ Listo! ${inserted} items insertados, ${errors} con error`)
}

main().catch(console.error)
