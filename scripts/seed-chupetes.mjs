/**
 * CHUPETE CLICKER — Seed script v3.0
 * ⚠️  ELIMINA TODOS LOS ITEMS EXISTENTES y los reemplaza con los 160 de la lista oficial.
 *
 * Uso:
 *   cd scripts && node seed-chupetes.mjs
 *
 * Imágenes (opcional):
 *   - Por defecto inserta sin imágenes (image_url: '')
 *   - Descomentá el bloque POLLINATIONS al final para generar imágenes
 *   - Para mejor calidad: Stable Horde (ver instrucciones abajo)
 *
 * STABLE HORDE (gratis, mejor calidad):
 *   1. Registrarse gratis en https://stablehorde.net
 *   2. Obtener API key en https://stablehorde.net/register
 *   3. Reemplazar STABLE_HORDE_KEY abajo y activar el bloque correspondiente
 */

import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const SUPABASE_URL = 'https://wudlmpexpazsvuxfdkcl.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1ZGxtcGV4cGF6c3Z1eGZka2NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE0Nzg0MywiZXhwIjoyMDkzNzIzODQzfQ.igLwZ2Z59JmiWvVyADKAaG8RL3ZguEZ2Y-n5n3pSUvs'
// const STABLE_HORDE_KEY = 'TU_KEY_ACA' // opcional

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  realtime: { transport: ws }
})

// ─── PRECIOS BASE POR RAREZA ──────────────────────────────────────────────────
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

// ─── 160 CHUPETES OFICIALES ───────────────────────────────────────────────────
// [nombre, rareza, descripcion]
const CHUPETES = [
  // COMUN (20)
  ['Chupete Blanco',     'comun', 'Blanco puro, sin complicaciones. El original.'],
  ['Chupete Negro',      'comun', 'Oscuro y directo al grano.'],
  ['Chupete Gris',       'comun', 'Ni blanco ni negro. El equilibrio perfecto.'],
  ['Chupete Azul',       'comun', 'Azul clásico como el cielo despejado.'],
  ['Chupete Rojo',       'comun', 'Rojo intenso. No pasa desapercibido.'],
  ['Chupete Verde',      'comun', 'Verde como la esperanza y el mate.'],
  ['Chupete Amarillo',   'comun', 'Amarillo brillante, imposible de ignorar.'],
  ['Chupete Rosa',       'comun', 'Rosa suave. El favorito de las abuelas.'],
  ['Chupete Celeste',    'comun', 'Celeste albiceleste. Pura patria.'],
  ['Chupete Marron',     'comun', 'Marrón tierra. Sólido y confiable.'],
  ['Chupete Mate',       'comun', 'Acabado mate sin reflejos. Simple y efectivo.'],
  ['Chupete Brillante',  'comun', 'Brilla con ganas bajo cualquier luz.'],
  ['Chupete Opaco',      'comun', 'Sin brillo, sin show. Cumple su función.'],
  ['Chupete Liso',       'comun', 'Sin adornos. Puro y simple.'],
  ['Chupete Rayado',     'comun', 'Rayas sutiles que le dan carácter.'],
  ['Chupete Punteado',   'comun', 'Puntitos en todo el cuerpo. Retro y simpático.'],
  ['Chupete Desgastado', 'comun', 'Ya vivió sus historias. Mucho uso encima.'],
  ['Chupete Claro',      'comun', 'Color claro, casi transparente.'],
  ['Chupete Oscuro',     'comun', 'Variante oscura del clásico.'],
  ['Chupete Default',    'comun', 'El punto de partida. De acá arranca todo.'],

  // POCO COMÚN (20)
  ['Chupete Aqua',         'poco_comun', 'Verde-azul suave con acabado satinado.'],
  ['Chupete Coral',        'poco_comun', 'Naranja-rosado vibrante como el mar tropical.'],
  ['Chupete Lima',         'poco_comun', 'Verde lima intenso. Fresco y lleno de energía.'],
  ['Chupete Lavanda',      'poco_comun', 'Lila suave con tono perlado.'],
  ['Chupete Turquesa',     'poco_comun', 'Turquesa brillante como una piedra preciosa asequible.'],
  ['Chupete Indigo',       'poco_comun', 'Azul índigo profundo con brillo suave.'],
  ['Chupete Magenta',      'poco_comun', 'Rosa-rojo vibrante. Imposible de ignorar.'],
  ['Chupete Ambar',        'poco_comun', 'Dorado suave como miel. Cálido y elegante.'],
  ['Chupete Jade',         'poco_comun', 'Verde jade oscuro con acabado suave.'],
  ['Chupete Perla',        'poco_comun', 'Blanco perlado con iridiscencia delicada.'],
  ['Chupete Satinado',     'poco_comun', 'Acabado sedoso que atrapa la luz.'],
  ['Chupete Pulido',       'poco_comun', 'Superficie pulida al espejo.'],
  ['Chupete Cromado',      'poco_comun', 'Cromo satinado con reflejos metálicos.'],
  ['Chupete Barnizado',    'poco_comun', 'Barniz brillante como laca de piano.'],
  ['Chupete Esmaltado',    'poco_comun', 'Esmalte vidrioso que resiste rayones.'],
  ['Chupete Translucido',  'poco_comun', 'Transparente con color interno suave.'],
  ['Chupete Glow',         'poco_comun', 'Brilla suavemente en la oscuridad.'],
  ['Chupete Fade',         'poco_comun', 'Degradado de un color a otro sin cortes.'],
  ['Chupete Gradient',     'poco_comun', 'Gradiente de colores que se funden.'],
  ['Chupete Marble',       'poco_comun', 'Veteado de mármol en plástico premium.'],

  // RARO (20)
  ['Chupete Neon',         'raro', 'Colores neón que gritan en la oscuridad.'],
  ['Chupete Holo',         'raro', 'Holográfico. Cambia de color según el ángulo.'],
  ['Chupete RGB',          'raro', 'Todos los colores del arco iris, juntos y vivos.'],
  ['Chupete Iridiscente',  'raro', 'Superficie iridiscente que hipnotiza.'],
  ['Chupete Prism',        'raro', 'Descompone la luz en todos sus colores.'],
  ['Chupete Crystal',      'raro', 'Cristal transparente con destellos internos.'],
  ['Chupete Glass',        'raro', 'Vidrio soplado con burbujas perfectas.'],
  ['Chupete Emerald',      'raro', 'Esmeralda facetada. Verde imposible.'],
  ['Chupete Sapphire',     'raro', 'Zafiro azul profundo con interior brillante.'],
  ['Chupete Ruby',         'raro', 'Rubí rojo sangre con destellos internos.'],
  ['Chupete Amethyst',     'raro', 'Amatista violeta con cristalización visible.'],
  ['Chupete Topaz',        'raro', 'Topacio dorado con transparencia perfecta.'],
  ['Chupete Quartz',       'raro', 'Cuarzo rosa translúcido con venas sutiles.'],
  ['Chupete Obsidian',     'raro', 'Obsidiana negra volcánica con filo vítreo.'],
  ['Chupete Steel',        'raro', 'Acero inoxidable pulido. Frío al tacto.'],
  ['Chupete Titanium',     'raro', 'Titanio ligero con acabado aeroespacial.'],
  ['Chupete Carbon',       'raro', 'Fibra de carbono tejida a mano.'],
  ['Chupete Chrome',       'raro', 'Cromo espejo que duplica todo lo que lo rodea.'],
  ['Chupete Gold Plated',  'raro', 'Baño de oro de 18k. Lujo accesible.'],
  ['Chupete Silver',       'raro', 'Plata 925 con grabado artesanal.'],

  // MEDIO RARO (20)
  ['Chupete Neon X',        'medio_raro', 'Neón amplificado. La versión X de algo ya extremo.'],
  ['Chupete Holo Shift',    'medio_raro', 'Holográfico que cambia de patrón al moverse.'],
  ['Chupete RGB Flow',      'medio_raro', 'RGB fluido, los colores se mueven solos.'],
  ['Chupete Prism Fade',    'medio_raro', 'Prisma con gradiente que desaparece en los bordes.'],
  ['Chupete Crystal Clear', 'medio_raro', 'Transparencia total. Se ve todo el interior.'],
  ['Chupete Diamond Cut',   'medio_raro', 'Facetado como un diamante. Corte perfecto.'],
  ['Chupete Black Ice',     'medio_raro', 'Hielo negro. Oscuro, frío, letal.'],
  ['Chupete Blue Flame',    'medio_raro', 'Llama azul, más caliente que cualquier llama naranja.'],
  ['Chupete Redline',       'medio_raro', 'Línea roja que lo atraviesa como un filo de navaja.'],
  ['Chupete Purple Haze',   'medio_raro', 'Neblina violeta que todo lo envuelve.'],
  ['Chupete Cyber',         'medio_raro', 'Estética cyberpunk con luces de circuito.'],
  ['Chupete Digital',       'medio_raro', 'Pixelado con estética 8-bit moderna.'],
  ['Chupete Matrix',        'medio_raro', 'Verde código cayendo por toda la superficie.'],
  ['Chupete Glitch',        'medio_raro', 'Artefactos digitales y distorsiones en su superficie.'],
  ['Chupete Circuit',       'medio_raro', 'Placas de circuito impresas en la superficie.'],
  ['Chupete Voltage',       'medio_raro', 'Electricidad recorriendo cada contorno.'],
  ['Chupete Reactor',       'medio_raro', 'Núcleo de reactor que pulsa con energía.'],
  ['Chupete Fusion',        'medio_raro', 'Dos materiales que se fusionaron en uno.'],
  ['Chupete Plasma Core',   'medio_raro', 'Núcleo de plasma contenido dentro de cristal.'],
  ['Chupete Ion Storm',     'medio_raro', 'Tormenta iónica atrapada en miniatura.'],

  // ULTRA RARO (20)
  ['Chupete Diamond',       'ultra_raro', 'Diamante real. 5 quilates de pureza VVS1.'],
  ['Chupete Black Diamond', 'ultra_raro', 'Diamante negro. Más raro que el diamante común.'],
  ['Chupete Red Diamond',   'ultra_raro', 'Diamante rojo. El más raro del planeta.'],
  ['Chupete Liquid Gold',   'ultra_raro', 'Oro líquido suspendido dentro de cuarzo.'],
  ['Chupete Pure Platinum', 'ultra_raro', 'Platino puro. 950 partes por mil.'],
  ['Chupete Infinity Blue', 'ultra_raro', 'Azul que no termina. Se pierde en su propio centro.'],
  ['Chupete Royal Blue',    'ultra_raro', 'Azul real. El color de los reyes.'],
  ['Chupete Imperial Red',  'ultra_raro', 'Rojo imperial. Usado por emperadores.'],
  ['Chupete Emerald King',  'ultra_raro', 'La esmeralda más grande y perfecta.'],
  ['Chupete Sapphire Crown','ultra_raro', 'Zafiro coronado con engastes de platino.'],
  ['Chupete Ruby Core',     'ultra_raro', 'Núcleo de rubí que irradia calor.'],
  ['Chupete Obsidian King', 'ultra_raro', 'Obsidiana del rey. Negro absoluto.'],
  ['Chupete Neon Overdrive','ultra_raro', 'Neón llevado al límite. Sobre-estimulación visual.'],
  ['Chupete Holo Master',   'ultra_raro', 'El holográfico definitivo. Master grade.'],
  ['Chupete RGB Ultra',     'ultra_raro', 'RGB a máxima saturación y brillo.'],
  ['Chupete Plasma King',   'ultra_raro', 'El plasma en su forma más pura.'],
  ['Chupete Ion Master',    'ultra_raro', 'Maestría iónica. Control total del átomo.'],
  ['Chupete Dark Core',     'ultra_raro', 'Núcleo de oscuridad. Absorbe toda luz cercana.'],
  ['Chupete Lightborn',     'ultra_raro', 'Nacido de la luz misma. Inmaculado.'],
  ['Chupete Voidwalker',    'ultra_raro', 'Caminante del vacío. Entre dimensiones.'],

  // LEGENDARIO (20)
  ['Chupete Diamond Prime', 'legendario', 'El primero de todos los diamantes. El original.'],
  ['Chupete Royal Gold',    'legendario', 'Oro real. De la cámara del tesoro.'],
  ['Chupete Eternal Blue',  'legendario', 'Azul que no se desvanece. Existe desde siempre.'],
  ['Chupete Infinite Red',  'legendario', 'Rojo infinito. Sin fondo, sin límite.'],
  ['Chupete Emerald Prime', 'legendario', 'La esmeralda primordial. Anterior a todo.'],
  ['Chupete Sapphire Prime','legendario', 'Zafiro primigenio. Antes que el océano.'],
  ['Chupete Ruby Prime',    'legendario', 'El rubí del que nacieron todos los rubíes.'],
  ['Chupete Obsidian Prime','legendario', 'Obsidiana original. Del primer volcán.'],
  ['Chupete Neon Prime',    'legendario', 'El neón original. La primera descarga eléctrica.'],
  ['Chupete Holo Prime',    'legendario', 'Holográfico primario. El primer espectro.'],
  ['Chupete Plasma Prime',  'legendario', 'Plasma en estado primordial. El cuarto estado.'],
  ['Chupete Ion Prime',     'legendario', 'El ión original. La primer partícula cargada.'],
  ['Chupete Dark Prime',    'legendario', 'La primera oscuridad. Anterior a la luz.'],
  ['Chupete Light Prime',   'legendario', 'La primera luz. Del Big Bang mismo.'],
  ['Chupete Void Prime',    'legendario', 'El vacío primigenio. Antes de la existencia.'],
  ['Chupete Apex Legend',   'legendario', 'El pico de todo. Nada puede superarlo.'],
  ['Chupete Zenith Legend', 'legendario', 'El zénit. El punto más alto alcanzado.'],
  ['Chupete Omega Prime',   'legendario', 'El último de los primeros. El principio del fin.'],
  ['Chupete Alpha Prime',   'legendario', 'El primero de todos. El inicio absoluto.'],
  ['Chupete Final Form',    'legendario', 'La forma final. Ya no hay más allá.'],

  // EXTRATERRESTRE (20)
  ['Chupete Alien Core',    'extraterrestre', 'Núcleo alienígena de origen desconocido.'],
  ['Chupete Bio Glow',      'extraterrestre', 'Bioluminiscencia orgánica de otro mundo.'],
  ['Chupete Neural',        'extraterrestre', 'Conectado a redes neurales interestelares.'],
  ['Chupete Hive',          'extraterrestre', 'Mente colmena concentrada en un objeto.'],
  ['Chupete Mutant',        'extraterrestre', 'Mutación de varias razas extraterrestres.'],
  ['Chupete Xeno',          'extraterrestre', 'Xenomorfo de origen indeterminable.'],
  ['Chupete Parasite',      'extraterrestre', 'Parásito benigno que potencia al portador.'],
  ['Chupete Organic Metal', 'extraterrestre', 'Metal vivo que crece y se adapta.'],
  ['Chupete Living Core',   'extraterrestre', 'Núcleo vivo que respira y pulsa.'],
  ['Chupete Symbiote',      'extraterrestre', 'Simbionte que mejora con el tiempo.'],
  ['Chupete Alien Plasma',  'extraterrestre', 'Plasma de otra galaxia, diferente composición.'],
  ['Chupete Cosmic Flesh',  'extraterrestre', 'Carne cósmica de textura indescriptible.'],
  ['Chupete Unknown',       'extraterrestre', 'Clasificación: desconocida. Origen: desconocido.'],
  ['Chupete Origin X',      'extraterrestre', 'El origen de la categoría X. El primero de su clase.'],
  ['Chupete Beyond',        'extraterrestre', 'Más allá de lo que conocemos.'],
  ['Chupete Void Entity',   'extraterrestre', 'Entidad del vacío manifestada en objeto.'],
  ['Chupete Bio Core',      'extraterrestre', 'Núcleo biológico autosustentable.'],
  ['Chupete Alien Flux',    'extraterrestre', 'Flujo alienígena que cambia sin parar.'],
  ['Chupete Neural Link',   'extraterrestre', 'Enlace neural con inteligencias no humanas.'],
  ['Chupete Xeno Prime',    'extraterrestre', 'El xenomorfo original. El primero de todos.'],

  // EN EL ORTO (20)
  ['Chupete Infinity',        'en_el_ort', 'Infinito. Literalmente. Sin fin posible.'],
  ['Chupete Absolute',        'en_el_ort', 'Absoluto. Sin condiciones, sin límites.'],
  ['Chupete God Tier',        'en_el_ort', 'Nivel dios. No se discute.'],
  ['Chupete Reality',         'en_el_ort', 'La realidad misma, condensada.'],
  ['Chupete Paradox',         'en_el_ort', 'Existe y no existe al mismo tiempo.'],
  ['Chupete Eternal',         'en_el_ort', 'Eterno. Ha existido siempre y siempre existirá.'],
  ['Chupete Omniverse',       'en_el_ort', 'Todo el omniverso en miniatura.'],
  ['Chupete Limitless',       'en_el_ort', 'Sin límites. Punto.'],
  ['Chupete Transcendent',    'en_el_ort', 'Trascendió toda categoría posible.'],
  ['Chupete Ascended',        'en_el_ort', 'Ascendió. Ya no pertenece a este plano.'],
  ['Chupete Final Boss',      'en_el_ort', 'El jefe final. Nadie llega hasta acá.'],
  ['Chupete True Form',       'en_el_ort', 'La forma verdadera. Lo que realmente es.'],
  ['Chupete Unbound',         'en_el_ort', 'Sin ataduras. Libre de toda ley física.'],
  ['Chupete Beyond Infinity', 'en_el_ort', 'Más allá del infinito. No debería existir.'],
  ['Chupete Endgame',         'en_el_ort', 'El fin del juego. Acá termina todo.'],
  ['Chupete Divine',          'en_el_ort', 'Divino. Punto de contacto con lo sagrado.'],
  ['Chupete Supreme',         'en_el_ort', 'Supremo. Por encima de todo.'],
  ['Chupete Omega',           'en_el_ort', 'El omega. El último símbolo.'],
  ['Chupete Genesis',         'en_el_ort', 'El génesis. El primer acto de creación.'],
  ['Chupete Last Core',       'en_el_ort', 'El último núcleo. Cuando este se acabe, no queda nada.'],
]

// ─── PROMPTS PARA GENERACIÓN DE IMÁGENES (mejor calidad) ─────────────────────
const RARITY_VISUAL_PROMPT = {
  comun:          'simple colorful matte plastic pacifier, clean product shot, minimal, white studio',
  poco_comun:     'shiny polished colorful pacifier, soft gradient, elegant product photography, dark background',
  medio_raro:     'iridescent metallic pacifier, chrome reflections, glowing edges, dark background, digital product art',
  raro:           'crystal gemstone pacifier, translucent glass, light refractions, sparkle effects, dark background',
  ultra_raro:     'neon glowing pacifier, vibrant intense colors, light aura, dark background, ultra detailed digital art',
  legendario:     'legendary golden glowing pacifier, magical particles, epic divine lighting, dark background, stunning digital art',
  extraterrestre: 'alien bioluminescent pacifier, organic xenomorph texture, green glow, biomechanical design, dark space background, sci-fi digital art',
  en_el_ort:      'cosmic void pacifier, impossible matter, reality warping effects, dark matter, multiverse energy, ultra detailed hyper realistic digital art',
}

function makePollinationsPrompt(name, rarity) {
  const visual = RARITY_VISUAL_PROMPT[rarity] || 'baby pacifier, product photography'
  return `${name}, baby pacifier collectible, ${visual}, centered composition, no text, no watermark`
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function deleteAllItems() {
  console.log('🗑️  Eliminando datos relacionados...')

  // Delete in FK dependency order
  const steps = [
    { table: 'auction_bids' },
    { table: 'auctions' },
    { table: 'listings' },
    { table: 'drops' },
    { table: 'inventory' },
  ]

  for (const step of steps) {
    const { error } = await supabase.from(step.table).delete().not('id', 'is', null)
    if (error) {
      console.log(`  ⚠️  ${step.table}: ${error.message}`)
    } else {
      console.log(`  ✅ ${step.table} vaciada`)
    }
  }

  const { error: itemsError } = await supabase.from('items').delete().not('id', 'is', null)
  if (itemsError) {
    console.error('  ❌ items:', itemsError.message)
    process.exit(1)
  }
  console.log('  ✅ items vaciada')
}

async function insertItems() {
  console.log(`\n📦 Insertando ${CHUPETES.length} chupetes...`)

  const rows = CHUPETES.map(([name, rarity, description]) => ({
    name,
    rarity,
    description,
    image_url: '',
    base_price_ars: BASE_PRICES[rarity] ?? 50,
    case_drop: true,
  }))

  const BATCH = 50
  let inserted = 0

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    const { error } = await supabase.from('items').insert(chunk)
    if (error) {
      console.error(`  ❌ Lote ${Math.floor(i / BATCH) + 1}: ${error.message}`)
    } else {
      inserted += chunk.length
      process.stdout.write(`  ✅ ${inserted}/${rows.length}\r`)
    }
  }

  console.log(`\n  ✨ ${inserted} chupetes insertados\n`)
}

// ─── GENERACIÓN DE IMÁGENES (Pollinations) ────────────────────────────────────
// Descomentá esta función y llamala desde main() si querés imágenes.
// Pollinations es gratis, sin API key, pero lenta y resultados variables.
//
// async function generateImagesWithPollinations() {
//   console.log('🎨 Generando imágenes con Pollinations...')
//   const { data: items } = await supabase.from('items').select('id, name, rarity').eq('image_url', '')
//   if (!items?.length) { console.log('No hay items sin imagen.'); return }
//
//   for (const item of items) {
//     const prompt = makePollinationsPrompt(item.name, item.rarity)
//     const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&model=flux&nologo=true&seed=${Math.floor(Math.random()*9999)}`
//     try {
//       const res = await fetch(url)
//       if (res.ok) {
//         await supabase.from('items').update({ image_url: url }).eq('id', item.id)
//         process.stdout.write(`  ✅ ${item.name}\r`)
//       }
//     } catch (e) {
//       console.log(`  ⚠️  ${item.name}: ${e.message}`)
//     }
//     await new Promise(r => setTimeout(r, 3500)) // rate limit
//   }
//   console.log('\n  ✨ Imágenes generadas\n')
// }

// ─── GENERACIÓN DE IMÁGENES (Stable Horde — mejor calidad) ───────────────────
// Registrarse gratis en https://stablehorde.net para obtener API key.
// Luego reemplazar STABLE_HORDE_KEY arriba y descomentar este bloque.
//
// async function generateImagesWithStableHorde() {
//   const STABLE_HORDE_KEY = 'TU_KEY_ACA'
//   console.log('🎨 Generando imágenes con Stable Horde...')
//   const { data: items } = await supabase.from('items').select('id, name, rarity').eq('image_url', '')
//   if (!items?.length) { console.log('No hay items sin imagen.'); return }
//
//   for (const item of items) {
//     const prompt = `baby pacifier collectible item, ${item.name}, ${RARITY_VISUAL_PROMPT[item.rarity]}, isolated black background, centered, no text`
//     try {
//       const res = await fetch('https://stablehorde.net/api/v2/generate/async', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', 'apikey': STABLE_HORDE_KEY },
//         body: JSON.stringify({
//           prompt,
//           params: { width: 512, height: 512, steps: 20, n: 1 },
//           models: ['Deliberate'],
//         })
//       })
//       const { id } = await res.json()
//       // Poll for result
//       let imageUrl = null
//       for (let attempt = 0; attempt < 30; attempt++) {
//         await new Promise(r => setTimeout(r, 5000))
//         const check = await fetch(`https://stablehorde.net/api/v2/generate/check/${id}`, { headers: { 'apikey': STABLE_HORDE_KEY } })
//         const status = await check.json()
//         if (status.done) {
//           const result = await fetch(`https://stablehorde.net/api/v2/generate/status/${id}`, { headers: { 'apikey': STABLE_HORDE_KEY } })
//           const { generations } = await result.json()
//           imageUrl = generations?.[0]?.img
//           break
//         }
//       }
//       if (imageUrl) {
//         await supabase.from('items').update({ image_url: imageUrl }).eq('id', item.id)
//         console.log(`  ✅ ${item.name}`)
//       }
//     } catch (e) {
//       console.log(`  ⚠️  ${item.name}: ${e.message}`)
//     }
//   }
// }

async function main() {
  console.log('🍬 ChupeteClicker — Seed v3.0')
  console.log('⚠️  ESTO ELIMINA TODOS LOS ITEMS EXISTENTES\n')

  await deleteAllItems()
  await insertItems()

  // Para generar imágenes, descomentá una de estas:
  // await generateImagesWithPollinations()
  // await generateImagesWithStableHorde()

  console.log('✨ Seed completo! Los 160 chupetes están listos.')
  console.log('💡 Para agregar imágenes: descomentá generateImagesWithPollinations() o generateImagesWithStableHorde() en main()')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
