/**
 * CHUPETE CLICKER — Generador Masivo de Items v2.0
 * 15 colecciones × 50 chupetes = 750 chupetes
 *
 * USO:
 *   1. npm install @supabase/supabase-js node-fetch
 *   2. Completar SUPABASE_SERVICE_KEY abajo
 *   3. node generate-chupetes.mjs
 *
 * Genera imágenes con Pollinations.ai (gratis, sin API key)
 * y las sube directo a Supabase Storage + inserta en tabla items.
 */

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import fs from 'fs'
import ws from 'ws'

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://wudlmpexpazsvuxfdkcl.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1ZGxtcGV4cGF6c3Z1eGZka2NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE0Nzg0MywiZXhwIjoyMDkzNzIzODQzfQ.igLwZ2Z59JmiWvVyADKAaG8RL3ZguEZ2Y-n5n3pSUvs'
const BUCKET = 'item-assets'
const DELAY_MS = 3000
// ──────────────────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  realtime: { transport: ws }
})

// ─── RAREZAS ──────────────────────────────────────────────────────────────────
const RAREZAS = {
  comun:          { color: 'gris desgastado, plástico opaco' },
  poco_comun:     { color: 'colores pastel suaves, brillante' },
  medio_raro:     { color: 'metálico iridiscente, reflejos' },
  raro:           { color: 'cristal traslúcido con destellos' },
  ultra_raro:     { color: 'neón vibrante, efectos de luz' },
  legendario:     { color: 'dorado brillante, partículas de luz' },
  extraterrestre: { color: 'biometal alienígena, bioluminiscente' },
  en_el_ort:      { color: 'materia oscura, efectos cósmicos imposibles' },
}

// ─── 15 COLECCIONES × 50 CHUPETES ────────────────────────────────────────────
const CHUPETES = [

  // ══════════════════════════════════════════════════════════════════
  // COLECCIÓN 1 — BEBIDAS & MARCAS (50)
  // ══════════════════════════════════════════════════════════════════
  ['Chupete Coca-Cola', 'comun', 'Rojo icónico. El clásico de toda reunión familiar.'],
  ['Chupete Pepsi', 'comun', 'Azul rebelde. Siempre segundo, siempre presente.'],
  ['Chupete Sprite', 'poco_comun', 'Verde limón. Fresco y efervescente.'],
  ['Chupete Fanta Naranja', 'poco_comun', 'Naranja explosivo. Favorito de los pibes.'],
  ['Chupete Fanta Uva', 'poco_comun', 'Violeta intenso. La Fanta que no todos conocen.'],
  ['Chupete Manaos', 'comun', 'El sabor del almacén. Precio imbatible.'],
  ['Chupete Cunnington', 'comun', 'La cola del interior. Orgullo regional.'],
  ['Chupete Paso de los Toros', 'poco_comun', 'Tónica amarga. Para paladares desarrollados.'],
  ['Chupete Gatorade Azul', 'poco_comun', 'Hidratación deportiva. ¿Jugaste algo? No importa.'],
  ['Chupete Monster Verde', 'medio_raro', 'Energía en lata. Para las noches de Claude.'],
  ['Chupete Red Bull', 'medio_raro', 'Te da alas. Y el chupete también.'],
  ['Chupete Ades Naranja', 'comun', 'Jugo de caja del recreo. Nostalgia pura.'],
  ['Chupete Villavicencio', 'comun', 'Agua mineral. Argentinísima.'],
  ['Chupete Nestea', 'poco_comun', 'Té frío de verano. Playa en invierno.'],
  ['Chupete Powerade', 'poco_comun', 'Azul deportivo. El rival del Gatorade.'],
  ['Chupete Aquarius', 'poco_comun', 'Agua saborizada que no es agua. Ni es saborizada.'],
  ['Chupete Milo', 'medio_raro', 'Verde Nestle. Para los que crecen fuertes.'],
  ['Chupete Quaker', 'comun', 'Avena del desayuno. El abuelo lo toma.'],
  ['Chupete Tang Naranja', 'comun', 'Polvo mágico. Infancia en sobrecito.'],
  ['Chupete Clight Limón', 'comun', 'Sin azúcar. Con culpa cero.'],
  ['Chupete Heineken', 'medio_raro', 'Verde premium. Para los que se la creen.'],
  ['Chupete Quilmes', 'raro', 'La cerveza del país. Patrimonio nacional.'],
  ['Chupete Stella Artois', 'raro', 'Copa especial. Publicidad en el Super Bowl.'],
  ['Chupete Fernet Branca', 'ultra_raro', 'Negro intenso. Con Coca es otra cosa.'],
  ['Chupete Aperol', 'raro', 'Naranja aperitivo. Verano europeo en el Abasto.'],
  ['Chupete Corona', 'medio_raro', 'Con rodaja de limón. Siempre con rodaja.'],
  ['Chupete Brahma', 'poco_comun', 'Brasilera en Argentina. Igual se toma.'],
  ['Chupete Budweiser', 'medio_raro', 'La Bud. King of Beers. Igual ganamos nosotros.'],
  ['Chupete Gancia', 'raro', 'Dorado aperitivo. Los 90 en una botella.'],
  ['Chupete Malbec', 'ultra_raro', 'Vino tinto mendocino. Alta gama. Alta rareza.'],
  ['Chupete Torrontés', 'raro', 'Blanco salteño. El vino que los extranjeros eligen.'],
  ['Chupete Sidra Real', 'poco_comun', 'Fin de año obligatorio. Sin esto no hay brindis.'],
  ['Chupete Hesperidina', 'legendario', 'El aperitivo argentino original. Historia líquida.'],
  ['Chupete Geniol', 'comun', 'No es bebida pero en casa siempre hay uno.'],
  ['Chupete Jugo de Carne', 'medio_raro', 'Caldito de asado. Sabor hogar.'],
  ['Chupete Terma', 'poco_comun', 'Amargo del norte. Con hielo y limón.'],
  ['Chupete Liviana', 'comun', 'Light. Para los que cuidan la figura pero no la dieta.'],
  ['Chupete Agua Tónica', 'poco_comun', 'Con gin o sin gin. La pregunta define.'],
  ['Chupete Guaraná', 'poco_comun', 'El sabor que no sabés explicar pero te gusta.'],
  ['Chupete Tropicana', 'poco_comun', 'Jugo de naranja premium. O eso dice la caja.'],
  ['Chupete Starbucks', 'raro', 'Logo de sirena. El café que vale el sueldo.'],
  ['Chupete Nescafé', 'poco_comun', 'Instantáneo. El café del que trabaja en casa.'],
  ['Chupete Dolca', 'comun', 'Clásico argentino. La abuela lo hace con leche.'],
  ['Chupete Toddy', 'poco_comun', 'Cacao espeso. Para los que el Milo se les fue.'],
  ['Chupete Ovomaltine', 'raro', 'Suizo importado. El Milo con plata.'],
  ['Chupete Tang Frambuesa', 'comun', 'El sabor raro del Tang. El que siempre sobraba.'],
  ['Chupete Baggio', 'poco_comun', 'Jugo en cajita. Recreo de primaria.'],
  ['Chupete Cepita', 'comun', 'Del Super. El jugo familiar de las Pascuas.'],
  ['Chupete Red Tea', 'poco_comun', 'Té rojo embotellado. Para los sofisticados del kiosko.'],
  ['Chupete Burn', 'medio_raro', 'Energizante oscuro. El Monster alternativo.'],

  // ══════════════════════════════════════════════════════════════════
  // COLECCIÓN 2 — PAÍSES DEL MUNDO (50)
  // ══════════════════════════════════════════════════════════════════
  ['Chupete Argentino', 'raro', 'Celeste y blanco. Con estrella. Con actitud.'],
  ['Chupete Brasilero', 'raro', 'Verde amarelo. Ritmo, calor y ginga.'],
  ['Chupete Uruguayo', 'poco_comun', 'Celeste claro. Tranquilo, sin apuros.'],
  ['Chupete Chileno', 'poco_comun', 'Rojo blanco y azul. Largo y angosto como el país.'],
  ['Chupete Paraguayo', 'comun', 'Tricolor. El vecino que siempre está.'],
  ['Chupete Boliviano', 'comun', 'Tricolor con escudo. Desde el altiplano.'],
  ['Chupete Peruano', 'poco_comun', 'Rojo y blanco. Ceviche y maravillas del mundo.'],
  ['Chupete Colombiano', 'poco_comun', 'Amarillo azul rojo. Café y vallenato.'],
  ['Chupete Venezolano', 'comun', 'Tricolor con estrellas. Historia compleja.'],
  ['Chupete Mexicano', 'medio_raro', 'Águila en el centro. Mole y tequila.'],
  ['Chupete Estadounidense', 'medio_raro', 'Barras y estrellas. El chupete que se cree el mejor.'],
  ['Chupete Canadiense', 'poco_comun', 'Hoja de maple roja. Amable y frío.'],
  ['Chupete Español', 'medio_raro', 'Rojo y amarillo. Paella y siesta real.'],
  ['Chupete Italiano', 'raro', 'Verde blanco rojo. Pasta, moda y drama.'],
  ['Chupete Francés', 'raro', 'Azul blanco rojo vertical. Café y baguette.'],
  ['Chupete Alemán', 'raro', 'Tricolor oscuro. Eficiencia y autobahn.'],
  ['Chupete Inglés', 'medio_raro', 'Union Jack. Tea time. Sin comentarios sobre el 86.'],
  ['Chupete Portugués', 'medio_raro', 'Verde rojo con escudo. Saudade embotellada.'],
  ['Chupete Holandés', 'poco_comun', 'Naranja real. Tulipanes y Amsterdam.'],
  ['Chupete Belga', 'poco_comun', 'Negro amarillo rojo. Chocolate y cerveza monástica.'],
  ['Chupete Suizo', 'raro', 'Cruz blanca en rojo. Neutralidad y relojes.'],
  ['Chupete Japonés', 'ultra_raro', 'Sol rojo en blanco. Cultura, tecnología y sushi.'],
  ['Chupete Coreano', 'ultra_raro', 'Taegeukgi. K-pop, kimchi y Samsung.'],
  ['Chupete Chino', 'raro', 'Rojo con estrellas doradas. La fábrica del mundo.'],
  ['Chupete Ruso', 'raro', 'Tricolor eslavo. Vodka, invierno y ajedrez.'],
  ['Chupete Australiano', 'medio_raro', 'Cruz del Sur. Canguros y BBQ en diciembre.'],
  ['Chupete Neozelandés', 'medio_raro', 'Con kiwi de fondo. Señor de los Anillos.'],
  ['Chupete Sudafricano', 'medio_raro', 'Multicolor post-apartheid. Nelson Mandela energy.'],
  ['Chupete Marroquí', 'poco_comun', 'Estrella verde en rojo. Sahara y medinas.'],
  ['Chupete Egipcio', 'raro', 'Águila dorada. Pirámides y Cleopatra.'],
  ['Chupete Turco', 'poco_comun', 'Luna y estrella en rojo. Bósforo y kebab.'],
  ['Chupete Griego', 'poco_comun', 'Cruz azul y blanco. Filosofía y feta.'],
  ['Chupete Israelí', 'medio_raro', 'Estrella de David azul. Historia milenaria.'],
  ['Chupete Indio', 'raro', 'Tricolor con chakra. Mil millones de almas.'],
  ['Chupete Tailandés', 'medio_raro', 'Elefante blanco. Templos y mango sticky rice.'],
  ['Chupete Cubano', 'raro', 'Estrella solitaria. Habanos y revolución.'],
  ['Chupete Irlandés', 'poco_comun', 'Tricolor verde blanco naranja. Cerveza negra y lluvia.'],
  ['Chupete Sueco', 'poco_comun', 'Cruz amarilla en azul. IKEA y ABBA.'],
  ['Chupete Noruego', 'poco_comun', 'Cruz nórdica roja. Fiordos y aurora boreal.'],
  ['Chupete Danés', 'poco_comun', 'Dannebrog rojo. Lego y diseño escandinavo.'],
  ['Chupete Polaco', 'comun', 'Blanco y rojo. Pierogi y Chopin.'],
  ['Chupete Ucraniano', 'medio_raro', 'Azul y amarillo. Trigo y resiliencia.'],
  ['Chupete Keniano', 'poco_comun', 'Escudo masai. Savana y maratón.'],
  ['Chupete Nigeriano', 'poco_comun', 'Verde y blanco. Nollywood y afrobeats.'],
  ['Chupete Jamaiquino', 'raro', 'Cruz diagonal negra verde amarilla. Reggae eterno.'],
  ['Chupete Vietnamita', 'poco_comun', 'Estrella amarilla en rojo. Resistencia histórica.'],
  ['Chupete Pakistaní', 'comun', 'Luna creciente en verde. Al lado de la India.'],
  ['Chupete Iraní', 'medio_raro', 'Verde blanco rojo con sello. Persia antigua.'],
  ['Chupete Saudí', 'raro', 'Verde con espada y árabe. Petróleo y desierto.'],
  ['Chupete Vaticano', 'legendario', 'Cruzado y dorado. El país más pequeño con más historia.'],

  // ══════════════════════════════════════════════════════════════════
  // COLECCIÓN 3 — STREAMERS & CREADORES (50)
  // ══════════════════════════════════════════════════════════════════
  ['Chupete Coscu', 'legendario', 'Azul Coscu Army. El más grande del stream argentino.'],
  ['Chupete El Momo', 'legendario', 'Energía caótica pura. Si lo tenés sos del inner circle.'],
  ['Chupete Spreen', 'ultra_raro', 'Verde y caótico. Fan de Minecraft y el drama.'],
  ['Chupete Quackity', 'ultra_raro', 'Mexicano internacional. LMST energy.'],
  ['Chupete Ibai', 'ultra_raro', 'Vasco global. Boxing, streams y corazón enorme.'],
  ['Chupete TheGrefg', 'raro', 'Skin propia en Fortnite. Pinta de leyenda.'],
  ['Chupete AuronPlay', 'raro', 'El sarcasmo hecho chupete. No apto sensibles.'],
  ['Chupete Rubius', 'raro', 'Pelirrojo digital. Los que crecieron con él saben.'],
  ['Chupete ElRubiosLp', 'medio_raro', 'El otro rubio. Troleo histórico.'],
  ['Chupete xQc', 'ultra_raro', 'Canadiense caótico. El más visto del mundo en su momento.'],
  ['Chupete Ninja', 'raro', 'Azul icónico. El que llevó el streaming al mainstream.'],
  ['Chupete Pokimane', 'raro', 'Marroquí-canadiense. La cara de Twitch por años.'],
  ['Chupete Ludwig', 'medio_raro', 'Subathón legendario. El que durmió en vivo 31 días.'],
  ['Chupete MrBeast', 'legendario', 'Filántropo de YouTube. Dale suscribirse.'],
  ['Chupete PewDiePie', 'legendario', 'El sueco eterno. 100M de subs y contando.'],
  ['Chupete Markiplier', 'raro', 'Reacciones épicas. Dramaturgo del gaming.'],
  ['Chupete Jacksepticeye', 'raro', 'Irlandés a todo volumen. Top of the morning.'],
  ['Chupete Shroud', 'ultra_raro', 'El aimbot humano. Headshots de otro planeta.'],
  ['Chupete TimTheTatman', 'medio_raro', 'El grandote buena onda. No ganó pero todos lo aman.'],
  ['Chupete DrLupo', 'medio_raro', 'Partner de Ninja. Cara de la vieja guardia de Twitch.'],
  ['Chupete Sodapoppin', 'medio_raro', 'WoW player eterno. Chat más caótico de Twitch.'],
  ['Chupete HasanAbi', 'raro', 'El streamer político. Izquierda en vivo.'],
  ['Chupete Moistcr1tikal', 'raro', 'El más tranquilo y más gracioso. Siempre callado, siempre viral.'],
  ['Chupete Valkyrae', 'raro', 'La queen de YouTube Gaming. 100 Thieves energy.'],
  ['Chupete Sykkuno', 'medio_raro', 'El inocente del Among Us. Nadie sospecha de él.'],
  ['Chupete Corpse Husband', 'ultra_raro', 'Voz oscura. Cara sin mostrar. Misterio total.'],
  ['Chupete Dream', 'raro', 'Máscara verde. Speedrun y drama en dosis iguales.'],
  ['Chupete Technoblade', 'legendario', 'Technoblade never dies. En serio.'],
  ['Chupete Tubbo', 'poco_comun', 'Abejas y DSMP. El más tierno del server.'],
  ['Chupete Tommyinnit', 'poco_comun', 'Inglés ruidoso. Caos organizado de 20 años.'],
  ['Chupete Philza', 'medio_raro', 'Hardcore Minecraft. El padre del DSMP.'],
  ['Chupete Wilbur Soot', 'raro', 'Músico y streamer. Poignant vibes.'],
  ['Chupete Karl Jacobs', 'poco_comun', 'MrBeast crew. Energía de Pokémon card.'],
  ['Chupete Ranboo', 'poco_comun', 'Mitad Enderman. Lore confuso pero amado.'],
  ['Chupete Badboyhalo', 'poco_comun', 'Language! El bueno del Dream SMP.'],
  ['Chupete GeorgeNotFound', 'poco_comun', 'Daltónico y famoso. El más buscado de Minecraft.'],
  ['Chupete Sapnap', 'poco_comun', 'Kit todo fuego. Stans intensos.'],
  ['Chupete Fundy', 'poco_comun', 'Fox developer. Modder y llorón del lore.'],
  ['Chupete Eret', 'comun', 'El traidor original. Historia del Dream SMP.'],
  ['Chupete Arigameplays', 'raro', 'Española gaming. De Minecraft a influencer total.'],
  ['Chupete Luzu', 'medio_raro', 'Español tranquilo. Media vida en streams y proyectos.'],
  ['Chupete Vegetta777', 'raro', 'El español clásico de YouTube. Minecraft eterno.'],
  ['Chupete Willyrex', 'medio_raro', 'Mellizo de Vegetta. La dupla histórica.'],
  ['Chupete ElSpreen', 'raro', 'Argentino del caos. Corre solo en el SMP.'],
  ['Chupete Roier', 'poco_comun', 'Catalán con personaje. Stans agresivos.'],
  ['Chupete JuanaGames', 'poco_comun', 'Colombiana del servidor. Pelea y baile.'],
  ['Chupete Foolish', 'comun', 'Constructor épico del Dream SMP. Minervaciones.'],
  ['Chupete Puffy', 'comun', 'Capitán del SMP. Energia caótica de bruja.'],
  ['Chupete Nihachu', 'poco_comun', 'Alemana del Dream SMP. Exnovio de Wilbur en el lore.'],
  ['Chupete Slimecicle', 'poco_comun', 'Personaje de barro. Comedia absurda.'],

  // ══════════════════════════════════════════════════════════════════
  // COLECCIÓN 4 — MEMES & CULTURA INTERNET (50)
  // ══════════════════════════════════════════════════════════════════
  ['Chupete 420', 'raro', 'Hoja verde en el centro. Cultura underground institucionalizada.'],
  ['Chupete Sigma', 'medio_raro', 'Letra griega. El lobo solitario en chupete.'],
  ['Chupete 6-7', 'raro', 'El score eterno. Argentina siempre gana.'],
  ['Chupete NPC', 'comun', 'Ruta predefinida. Sin libre albedrío. Como todos en lunes.'],
  ['Chupete Gigachad', 'ultra_raro', 'Mandíbula perfecta. Confianza infinita. Ironía opcional.'],
  ['Chupete Wojak', 'poco_comun', 'Cara triste. El meme de todos los sentimientos.'],
  ['Chupete Pepe', 'raro', 'Rana verde eterna. Sad, happy, smug, todo.'],
  ['Chupete Doge', 'raro', 'Shiba Inu. Wow. Such chupete. Very rare.'],
  ['Chupete Cheems', 'poco_comun', 'Perro con queso. Haburger en el corazón.'],
  ['Chupete Bonk', 'poco_comun', 'Bate de béisbol. Horny jail en chupete.'],
  ['Chupete Based', 'medio_raro', 'Ni bien ni mal. Simplemente based.'],
  ['Chupete Cringe', 'comun', 'Para dar cringe. Meta-chupete incómodo.'],
  ['Chupete Copium', 'poco_comun', 'Inhalador de excusas. Cuando perdemos el clásico.'],
  ['Chupete Hopium', 'poco_comun', 'Esperanza irreal. El chupete del hincha argentino antes del 22.'],
  ['Chupete Kek', 'comun', 'LOL en otro idioma. Origen del caos.'],
  ['Chupete Trollface', 'medio_raro', 'Problem? El OG del internet troll.'],
  ['Chupete Rickroll', 'raro', 'Never gonna give you up. Caíste. Siempre.'],
  ['Chupete Nyan Cat', 'raro', 'Gatito arcoíris. Pop Tart. Pop-tart Pop-tart.'],
  ['Chupete Keyboard Cat', 'poco_comun', 'Play them off. El gato pianista original.'],
  ['Chupete Harlem Shake', 'comun', 'El segundo 15 explota. Los de 2013 saben.'],
  ['Chupete Gangnam Style', 'medio_raro', 'Psy en chupete. El primer viral global del K-pop.'],
  ['Chupete Ice Bucket', 'comun', 'Desafío viral de 2014. Todos lo hicieron.'],
  ['Chupete This Is Fine', 'raro', 'Perro en incendio. Actualidad en un meme.'],
  ['Chupete Distracted Boyfriend', 'medio_raro', 'Novio mirando a otro lado. Nosotros mirando el chupete.'],
  ['Chupete Drake Approves', 'raro', 'Dedo arriba. El formato de comparaciones eterno.'],
  ['Chupete Two Buttons', 'poco_comun', 'Sudar eligiendo. Decisiones difíciles del día.'],
  ['Chupete Expanding Brain', 'raro', 'Cada nivel más iluminado. El upgrade del pensamiento.'],
  ['Chupete Galaxy Brain', 'ultra_raro', 'El último nivel del expanding brain. Pensamiento cósmico.'],
  ['Chupete Surprised Pikachu', 'poco_comun', 'Boca abierta. Consecuencias de acciones predecibles.'],
  ['Chupete Woman Yelling at Cat', 'medio_raro', 'Smudge en la cena. La dualidad humana.'],
  ['Chupete Stonks', 'raro', 'Meme man con gráfico. Economía argentina explicada.'],
  ['Chupete Notstocks', 'poco_comun', 'El reverso del Stonks. Igual de aplicable acá.'],
  ['Chupete Shrek', 'legendario', 'Ogro verde. Es un pantano. Esto es un chupete ahora.'],
  ['Chupete Gru Plan', 'medio_raro', 'Paso 1 paso 2 paso 3 igual paso 2. Plan perfecto.'],
  ['Chupete Uno Reverse', 'raro', 'Carta +4 roja. La respuesta a cualquier argumento.'],
  ['Chupete Press X to Doubt', 'poco_comun', 'L.A. Noire energy. Escepticismo en un botón.'],
  ['Chupete Big Brain', 'medio_raro', 'Cabeza luminosa. Ideas que nadie más tiene.'],
  ['Chupete Small Brain', 'comun', 'Cerebro reducido. Para las decisiones de lunes.'],
  ['Chupete OK Boomer', 'comun', 'La respuesta universal. Aplica siempre.'],
  ['Chupete No cap', 'poco_comun', 'Sin gorra. Sin mentira. Real talk.'],
  ['Chupete Sussy Baka', 'raro', 'Among Us energy. El impostor en tu inventario.'],
  ['Chupete Sus', 'poco_comun', 'Rojo redondo. Siempre sospechoso.'],
  ['Chupete Ligma', 'medio_raro', 'La trampa. Si preguntás qué es, caíste.'],
  ['Chupete Ratio', 'raro', 'Más likes en la respuesta. El poder de internet.'],
  ['Chupete W', 'poco_comun', 'Victoria. Así de simple. W pura.'],
  ['Chupete L', 'comun', 'Derrota. Igual existe. Hay que tenerlo.'],
  ['Chupete Mid', 'comun', 'Ni bien ni mal. El juicio más despiadado de internet.'],
  ['Chupete Rent Free', 'poco_comun', 'Viviendo en tu cabeza sin pagar alquiler.'],
  ['Chupete Down Bad', 'medio_raro', 'Cuando extrañas y lo sabés. El diagnóstico.'],
  ['Chupete Slay', 'raro', 'Matar con estilo. El chupete que slay.'],

  // ══════════════════════════════════════════════════════════════════
  // COLECCIÓN 5 — MATERIALES & TEXTURAS (50)
  // ══════════════════════════════════════════════════════════════════
  ['Chupete de Cristal', 'raro', 'Transparente y frágil. No lo tires.'],
  ['Chupete de Oro', 'legendario', '24 quilates. Pesado y arrogante.'],
  ['Chupete de Plata', 'ultra_raro', 'Plata pura. Sin platear. Diferencia importante.'],
  ['Chupete de Platino', 'extraterrestre', 'Más raro que el oro. Más caro también.'],
  ['Chupete de Diamante', 'en_el_ort', 'La dureza máxima. Indestructible.'],
  ['Chupete de Madera', 'comun', 'Artesanal. De pino. Ecológico.'],
  ['Chupete de Roble', 'poco_comun', 'Madera noble. Muebles de calidad en chupete.'],
  ['Chupete de Ébano', 'medio_raro', 'Negro veteado. La madera más oscura.'],
  ['Chupete de Bambú', 'poco_comun', 'Asiático y sustentable. Crece rápido.'],
  ['Chupete de Mármol', 'raro', 'Veteado blanco y gris. Baño lujoso en chupete.'],
  ['Chupete de Granito', 'medio_raro', 'Cocina de alta gama. Durísimo.'],
  ['Chupete de Obsidiana', 'ultra_raro', 'Vidrio volcánico negro. Minecraft lo hizo famoso.'],
  ['Chupete de Cuarzo', 'raro', 'Cristal rosa pálido. Energía y reiki.'],
  ['Chupete de Ámbar', 'raro', 'Resina fosilizada. Con insecto adentro si hay suerte.'],
  ['Chupete de Hueso', 'medio_raro', 'Orgánico y perturbador. Arte primitivo.'],
  ['Chupete de Cuero', 'poco_comun', 'Vacuno. Curtido. Olor a talabartería.'],
  ['Chupete de Goma', 'comun', 'Vulcanizado. Rebota. No se rompe fácil.'],
  ['Chupete de Silicona', 'poco_comun', 'El moderno. Hipoalergénico. Certificado.'],
  ['Chupete de Titanio', 'ultra_raro', 'Metal aeroespacial. Liviano e indestructible.'],
  ['Chupete de Acero', 'raro', 'Industrial. Frío. Resistente a todo.'],
  ['Chupete de Cobre', 'medio_raro', 'Rojizo. Antimicrobiano. Eléctrico en esencia.'],
  ['Chupete de Bronce', 'medio_raro', 'Aleación antigua. Estatuas y medallas.'],
  ['Chupete de Aluminio', 'poco_comun', 'Liviano. Reciclable. Abundante.'],
  ['Chupete de Hierro', 'comun', 'Pesado. Oxidable. Clásico.'],
  ['Chupete de Neón', 'ultra_raro', 'Gas noble iluminado. Letrero de bar en chupete.'],
  ['Chupete de Mercurio', 'extraterrestre', 'Líquido metálico. Tóxico pero hipnótico.'],
  ['Chupete de Carbono', 'raro', 'Fibra de carbono. Autos de carrera y chupetes.'],
  ['Chupete de Grafeno', 'extraterrestre', 'Un átomo de grosor. El material del futuro.'],
  ['Chupete de Cerámica', 'poco_comun', 'Cocido en horno. Artesanal y frágil.'],
  ['Chupete de Porcelana', 'raro', 'Fina y traslúcida. Vajilla imperial en chupete.'],
  ['Chupete de Barro', 'comun', 'El original. Primitivo y honesto.'],
  ['Chupete de Vidrio Soplado', 'ultra_raro', 'Artesanía Murano. Cada uno único.'],
  ['Chupete de Lava', 'extraterrestre', 'Magma solidificado. Todavía calienta un poco.'],
  ['Chupete de Hielo', 'raro', 'Se derrite. Existencia efímera. Filosófico.'],
  ['Chupete de Sal', 'comun', 'Blanco granulado. Del Himalaya si te creés.'],
  ['Chupete de Coral', 'ultra_raro', 'Del arrecife. Ecosistema en peligro hecho chupete.'],
  ['Chupete de Nácar', 'raro', 'Interior de ostra. Iridiscente natural.'],
  ['Chupete de Cuarzo Ahumado', 'raro', 'Marrón oscuro transparente. Energía protectora.'],
  ['Chupete de Amatista', 'ultra_raro', 'Violeta profundo. Para la meditación y el flex.'],
  ['Chupete de Turquesa', 'raro', 'Azul verdoso. Joyería del sudoeste americano.'],
  ['Chupete de Malaquita', 'raro', 'Verde veteado. Roca preciosa rusa.'],
  ['Chupete de Lapislázuli', 'ultra_raro', 'Azul profundo con dorado. Arte renacentista.'],
  ['Chupete de Ópalo', 'extraterrestre', 'Cambia de color. El más impredecible de las piedras.'],
  ['Chupete de Rubí', 'extraterrestre', 'Rojo profundo. La piedra del amor y el poder.'],
  ['Chupete de Zafiro', 'extraterrestre', 'Azul real. El anillo de Lady Di.'],
  ['Chupete de Esmeralda', 'extraterrestre', 'Verde puro. Colombia y Egipto lo saben.'],
  ['Chupete de Meteorito', 'en_el_ort', 'Vino del espacio. 4.500 millones de años de viaje.'],
  ['Chupete de Antimateria', 'en_el_ort', 'Si toca algo normal, explota. Manejalo con cuidado.'],
  ['Chupete de Neutronium', 'en_el_ort', 'Material de estrella de neutrones. Pesa 10^17 kg/cm³.'],
  ['Chupete de Unobtanium', 'en_el_ort', 'No existe en la naturaleza. Y sin embargo acá está.'],

  // ══════════════════════════════════════════════════════════════════
  // COLECCIÓN 6 — COMIDAS ARGENTINAS (50)
  // ══════════════════════════════════════════════════════════════════
  ['Chupete de Asado', 'legendario', 'Con chimichurri. El ritual del domingo. Sagrado.'],
  ['Chupete de Empanada', 'raro', 'Repulgue perfecto. Tucumanas, salteñas o porteñas, elige.'],
  ['Chupete de Medialunas', 'poco_comun', 'Con manteca. Del bar de la esquina. Con café.'],
  ['Chupete de Facturas', 'comun', 'La caja del domingo. Napolitana, vigilante, cañoncito.'],
  ['Chupete de Milanesa', 'raro', 'Con papas fritas. La comida del pueblo argentino.'],
  ['Chupete de Choripán', 'raro', 'Con chimichurri en el pan. Estadio, marcha, todo.'],
  ['Chupete de Locro', 'ultra_raro', 'Del 25 de Mayo. Guiso de invierno nacional.'],
  ['Chupete de Carbonada', 'poco_comun', 'Carne y fruta. Historia colonial en el plato.'],
  ['Chupete de Humita', 'poco_comun', 'Choclo noroestino. Envuelto en chala.'],
  ['Chupete de Tamales', 'poco_comun', 'Del norte argentino. Masita de maíz sagrada.'],
  ['Chupete de Mondongo', 'comun', 'Para los valientes. La sopa que divide familias.'],
  ['Chupete de Puchero', 'comun', 'Invierno porteño. La abuela lo hacía mejor.'],
  ['Chupete de Guiso', 'comun', 'Fideos o arroz. El plato del mes del sueldo corto.'],
  ['Chupete de Lentejas', 'comun', 'Fin de mes. Proteína del pueblo. Con todo.'],
  ['Chupete de Dulce de Leche', 'legendario', 'La razón de ser argentina. En todo, para todo.'],
  ['Chupete de Alfajor Havanna', 'ultra_raro', 'Mar del Plata. El regalo que siempre funciona.'],
  ['Chupete de Alfajor Jorgito', 'raro', 'El del kiosko. Con maicena. Sin pretensión.'],
  ['Chupete de Alfajor Capitán del Espacio', 'medio_raro', 'De la infancia. Ya no es lo que era.'],
  ['Chupete de Mantecol', 'raro', 'Maní y miel. El turco de la góndola.'],
  ['Chupete de Garrapiñada', 'poco_comun', 'Maní bañado. Del carrito de la estación.'],
  ['Chupete de Chipa', 'raro', 'Paraguayo-argentino. Bolita de queso del colectivo.'],
  ['Chupete de Pizza Porteña', 'raro', 'Alta, con mucho queso, en molde. La única.'],
  ['Chupete de Fugazza', 'ultra_raro', 'Cebolla y aceitunas. La pizza argentina más argentina.'],
  ['Chupete de Fainá', 'raro', 'Garbanzos genoveses. Encima de la pizza o aparte, debate eterno.'],
  ['Chupete de Revuelto Gramajo', 'poco_comun', 'Papas, huevo y jamón. El plato del día libre.'],
  ['Chupete de Pascualina', 'poco_comun', 'Tarta de espinaca y huevo. Semana Santa obligatoria.'],
  ['Chupete de Matambre a la Pizza', 'raro', 'La fusión definitiva. Italia y campo argentino.'],
  ['Chupete de Cazuela de Mariscos', 'raro', 'Costa atlántica. Con pan y vino blanco.'],
  ['Chupete de Provoleta', 'ultra_raro', 'A la parrilla con orégano. La entrada del asado.'],
  ['Chupete de Morcilla', 'medio_raro', 'Sangre de cerdo. Para los iniciados en el asado.'],
  ['Chupete de Chinchulín', 'medio_raro', 'Tripa de ternera. No lo seas. Ya sabés.'],
  ['Chupete de Mollejas', 'raro', 'Glándula de ternera. La delicia del asador experto.'],
  ['Chupete de Entrañas', 'raro', 'El corte del conocedor. Sin término medio, jugosas.'],
  ['Chupete de Vacío', 'ultra_raro', 'El mejor corte de asado para muchos. Debate eterno.'],
  ['Chupete de Costilla', 'legendario', 'Hueso con carne. El más fotogénico del asado.'],
  ['Chupete de Matecocido', 'comun', 'Para cuando no hay yerba pero sí saquitos.'],
  ['Chupete de Submarino', 'poco_comun', 'Chocolate en leche caliente. Bar porteño.'],
  ['Chupete de Tostado', 'comun', 'Jamón y queso. El almuerzo sin ganas.'],
  ['Chupete de Sanguche de Miga', 'poco_comun', 'Sin corteza. Para el cumpleaños de la nena.'],
  ['Chupete de Pionono', 'poco_comun', 'Enrollado con crema y dulce. Mesa dulce.'],
  ['Chupete de Vigilante', 'poco_comun', 'Queso y batata. La pareja clásica argentina.'],
  ['Chupete de Budín de Pan', 'comun', 'Del pan duro de ayer. Economía circular.'],
  ['Chupete de Arroz con Leche', 'comun', 'Postre del martes. Con canela siempre.'],
  ['Chupete de Tortoni', 'raro', 'El café histórico de Buenos Aires. 1858.'],
  ['Chupete de Criollitas', 'comun', 'Galletitas del campo. Con manteca en el campo.'],
  ['Chupete de Bizcochuelo', 'poco_comun', 'La base de todos los cumpleaños argentinos.'],
  ['Chupete de Rogel', 'raro', 'Mil capas de masa y dulce de leche. Paciencia hecha postre.'],
  ['Chupete de Pasta Frola', 'poco_comun', 'Membrillo o batata. La tarta de la abuela.'],
  ['Chupete de Scones', 'poco_comun', 'Herencia inglesa patagónica. Con té en Bariloche.'],
  ['Chupete de Torta Negra', 'ultra_raro', 'Frutas, alcohol, meses de reposo. Boda o nunca.'],

  // ══════════════════════════════════════════════════════════════════
  // COLECCIÓN 7 — GAMING & VIDEOJUEGOS (50)
  // ══════════════════════════════════════════════════════════════════
  ['Chupete Minecraft', 'raro', 'Pixelado y cuadrado. El juego más vendido de la historia.'],
  ['Chupete Fortnite', 'medio_raro', 'Battle royale colorido. El que todos odiaban pero todos jugaban.'],
  ['Chupete Among Us', 'poco_comun', 'Impostor en tu inventario. Siempre sospechoso.'],
  ['Chupete CS:GO', 'ultra_raro', 'La skin más importante. Sin esto no habría ChupeteClicker.'],
  ['Chupete Valorant', 'raro', 'Tactical shooter. Agents y skins que vacían billeteras.'],
  ['Chupete League of Legends', 'raro', 'El MOBA eterno. Partidas de 40 minutos y gritos.'],
  ['Chupete Dota 2', 'ultra_raro', 'El otro MOBA. Curva de aprendizaje vertical.'],
  ['Chupete GTA V', 'raro', 'Los Santos en chupete. Ya vendió más que algunas películas.'],
  ['Chupete Red Dead Redemption', 'legendario', 'El vaquero más melancólico del gaming.'],
  ['Chupete The Witcher', 'ultra_raro', 'Geralt en chupete. Toss a coin to your chupete.'],
  ['Chupete Cyberpunk 2077', 'raro', 'Night City. El lanzamiento más caótico de la historia.'],
  ['Chupete Elden Ring', 'extraterrestre', 'You died. El chupete que te mata y te engancha.'],
  ['Chupete Dark Souls', 'ultra_raro', 'El original del sufrimiento. Praise the sun.'],
  ['Chupete Zelda', 'legendario', 'Hyrule en chupete. It\'s dangerous to go alone.'],
  ['Chupete Mario', 'legendario', 'El fontanero eterno. Plataformas y dulce de leche.'],
  ['Chupete Pokemon', 'ultra_raro', 'Gotta catch \'em all. El chupete que todos quieren.'],
  ['Chupete Pikachu', 'raro', 'El más famoso. Trueno y popularidad infinita.'],
  ['Chupete Charizard', 'ultra_raro', 'El más codiciado. Carta y chupete de colección.'],
  ['Chupete Mewtwo', 'extraterrestre', 'Clonado y poderoso. El legendario definitivo.'],
  ['Chupete Sonic', 'raro', 'Veloz y azul. Sega contra Nintendo eternamente.'],
  ['Chupete God of War', 'ultra_raro', 'Kratos en chupete. Ira espartana.'],
  ['Chupete Spider-Man PS4', 'raro', 'El mejor Spider-Man del gaming.'],
  ['Chupete Hades', 'raro', 'Roguelike del inframundo. Cada muerte es una historia.'],
  ['Chupete Hollow Knight', 'raro', 'El metroidvania indie más bello.'],
  ['Chupete Undertale', 'raro', 'DETERMINATION. El chupete con alma.'],
  ['Chupete Stardew Valley', 'medio_raro', 'Granja pixelada. La huida del capitalismo.'],
  ['Chupete Terraria', 'medio_raro', '2D Minecraft con más jefes. Para masoquistas.'],
  ['Chupete Celeste', 'raro', 'Plataformas dificiles con historia de ansiedad. Puro.'],
  ['Chupete Disco Elysium', 'extraterrestre', 'El RPG más literario. Fallido detective comunista.'],
  ['Chupete Half-Life', 'legendario', 'Gordon Freeman. La historia que Valve nunca terminó.'],
  ['Chupete Portal', 'ultra_raro', 'The cake is a lie. Ciencia y humor negro.'],
  ['Chupete Team Fortress 2', 'raro', 'Sombreros y clases. El juego que nunca muere.'],
  ['Chupete Overwatch', 'medio_raro', 'Héroes y habilidades. El que fue y ya no es lo mismo.'],
  ['Chupete Apex Legends', 'raro', 'Battle royale con movimiento. El más fluido.'],
  ['Chupete Warzone', 'medio_raro', 'CoD battle royale. Hackers incluidos.'],
  ['Chupete FIFA 24', 'poco_comun', 'Ultimate Team vacía billeteras. Mecánica de casino.'],
  ['Chupete PES', 'poco_comun', 'El rival de FIFA. Ya no existe pero vive en el corazón.'],
  ['Chupete Rocket League', 'raro', 'Autos con pelota. Deporte electrónico imposible de dominar.'],
  ['Chupete Fall Guys', 'poco_comun', 'Frijoles cayendo. El caos más adorable del gaming.'],
  ['Chupete Roblox', 'comun', 'El universo de los pibes. Millones de juegos en uno.'],
  ['Chupete Clash Royale', 'poco_comun', 'Cartas móviles. La torreta que arruinó infancias.'],
  ['Chupete Candy Crush', 'comun', 'El juego de la tía en el subte. Adictivo sin querer.'],
  ['Chupete Angry Birds', 'comun', 'Pájaros contra cerdos. El primer hit móvil masivo.'],
  ['Chupete Subway Surfers', 'comun', 'Correr de la policía en el metro. Infinito y eterno.'],
  ['Chupete Temple Run', 'comun', 'Correr de monos. El predecesor del endless runner.'],
  ['Chupete Flappy Bird', 'raro', 'El más difícil y más simple. Fue y volvió.'],
  ['Chupete Geometry Dash', 'raro', 'Cuadrado saltando. Niveles hechos por masoquistas.'],
  ['Chupete Pacman', 'legendario', 'El arcade original. Waka waka eterno.'],
  ['Chupete Space Invaders', 'legendario', 'El inicio de todo. Marciano pixelado histórico.'],
  ['Chupete Pong', 'en_el_ort', 'El origen. Sin Pong no hay nada de esto.'],

  // ══════════════════════════════════════════════════════════════════
  // COLECCIÓN 8 — ESPACIO & COSMOS (50)
  // ══════════════════════════════════════════════════════════════════
  ['Chupete Solar', 'poco_comun', 'Del sol. Cálido. No acercarse demasiado.'],
  ['Chupete Lunar', 'poco_comun', 'De la luna. Plateado. Cambia de fase.'],
  ['Chupete Marciano', 'medio_raro', 'Rojo polvoriento. ¿Hay vida ahí? El chupete sí.'],
  ['Chupete Venusino', 'medio_raro', 'Nube de ácido. El planeta hermano infierno.'],
  ['Chupete Mercuriano', 'poco_comun', 'El más pequeño y cercano al sol. Extremos térmicos.'],
  ['Chupete Joviano', 'raro', 'Gigante gaseoso rayado. La gran mancha roja en chupete.'],
  ['Chupete Saturnino', 'raro', 'Con anillo incorporado. El más fotogénico del sistema solar.'],
  ['Chupete Uraniano', 'poco_comun', 'Gigante helado azul. Gira de costado. Raro él.'],
  ['Chupete Neptuniano', 'poco_comun', 'El más lejano del sistema solar. Frío extremo.'],
  ['Chupete Plutoniano', 'comun', 'El planeta degradado. Enano pero con orgullo.'],
  ['Chupete Cometa', 'medio_raro', 'Cola de polvo y hielo. Visitante periódico.'],
  ['Chupete Asteroide', 'comun', 'Roca espacial errante. Mata dinosaurios ocasionalmente.'],
  ['Chupete Meteoro', 'poco_comun', 'Entrando a la atmósfera. El destello antes del impacto.'],
  ['Chupete Nebulosa Rosa', 'ultra_raro', 'Nube de gas estelar. Vivero de estrellas.'],
  ['Chupete Nebulosa Azul', 'ultra_raro', 'Hidrógeno ionizado azul. Arte cósmico natural.'],
  ['Chupete Agujero Negro', 'extraterrestre', 'Singularidad infinita. De aquí no sale nada.'],
  ['Chupete Agujero de Gusano', 'extraterrestre', 'Atajo espaciotemporal. Física teórica en chupete.'],
  ['Chupete Pulsar', 'extraterrestre', 'Estrella de neutrones girando. El reloj del cosmos.'],
  ['Chupete Quásar', 'extraterrestre', 'El objeto más brillante del universo. Núcleo galáctico activo.'],
  ['Chupete Materia Oscura', 'en_el_ort', 'No se puede ver. Solo se nota su gravedad. Existe.'],
  ['Chupete Big Bang', 'en_el_ort', 'El origen de todo. 13.800 millones de años atrás.'],
  ['Chupete Voyager', 'ultra_raro', 'La sonda más lejana. Afuera del sistema solar desde 2012.'],
  ['Chupete Hubble', 'ultra_raro', 'Telescopio que cambió todo. Fotos del universo profundo.'],
  ['Chupete James Webb', 'extraterrestre', 'El sucesor del Hubble. Ve el universo primitivo.'],
  ['Chupete Sputnik', 'raro', 'El primer satélite artificial. 1957. La carrera espacial comienza.'],
  ['Chupete Apollo 11', 'legendario', 'La misión que pisó la luna. Julio de 1969.'],
  ['Chupete Estación Espacial', 'ultra_raro', 'ISS en chupete. Laboratorio orbitando a 400km.'],
  ['Chupete SpaceX', 'raro', 'Falcon 9 que aterriza. Elon en el espacio privado.'],
  ['Chupete Starship', 'extraterrestre', 'El cohete más grande. Para Marte. Pronto.'],
  ['Chupete Cassini', 'raro', 'La sonda de Saturno. Se sacrificó en la atmósfera.'],
  ['Chupete New Horizons', 'raro', 'La que fotografió Plutón de cerca. Viaje de 9 años.'],
  ['Chupete Curiosity', 'raro', 'El rover marciano. Selfies en Marte desde 2012.'],
  ['Chupete Perseverance', 'ultra_raro', 'El rover más nuevo. Buscando vida fosilizada.'],
  ['Chupete Ingenuity', 'ultra_raro', 'El helicóptero de Marte. El primero en volar en otro planeta.'],
  ['Chupete Dragon', 'raro', 'Cápsula SpaceX. Lleva astronautas a la ISS.'],
  ['Chupete Orion', 'ultra_raro', 'La cápsula de la NASA para volver a la luna. Artemis.'],
  ['Chupete Energia Oscura', 'en_el_ort', 'La fuerza que expande el universo. El 68% de todo.'],
  ['Chupete Multiverso', 'en_el_ort', 'Si existe, hay chupetes en cada universo. Todos distintos.'],
  ['Chupete Singularidad Tecnológica', 'en_el_ort', 'El punto de no retorno. Más allá la IA sabe más que vos.'],
  ['Chupete Dimensión X', 'extraterrestre', 'Coordenada inexistente en nuestra geometría.'],
  ['Chupete Tiempo', 'extraterrestre', 'No es un lugar pero ocupa lugar. La cuarta dimensión.'],
  ['Chupete Gravedad', 'raro', 'La fuerza que te mantiene en la silla leyendo esto.'],
  ['Chupete Luz', 'raro', '299.792 km/s. El límite universal. En chupete.'],
  ['Chupete Fotón', 'ultra_raro', 'Partícula de luz sin masa. El mensajero del universo.'],
  ['Chupete Neutrino', 'extraterrestre', 'Atraviesa la Tierra sin que nadie lo note. Invisible.'],
  ['Chupete Higgs Boson', 'extraterrestre', 'La partícula de Dios. Encontrada en el CERN en 2012.'],
  ['Chupete Antimateria', 'en_el_ort', 'Si toca materia normal, ambos desaparecen. Cuidado.'],
  ['Chupete Omega Point', 'en_el_ort', 'El fin del universo según Teilhard. Todo converge.'],
  ['Chupete Vacío Cuántico', 'en_el_ort', 'El vacío que no es vacío. Partículas virtuales siempre.'],
  ['Chupete Todo', 'en_el_ort', 'El chupete que contiene a todos los demás. No busques más.'],

  // ══════════════════════════════════════════════════════════════════
  // COLECCIÓN 9 — MÚSICA & ARTISTAS (50)
  // ══════════════════════════════════════════════════════════════════
  ['Chupete Freddie Mercury', 'en_el_ort', 'Bigote legendario. La voz más grande del rock.'],
  ['Chupete David Bowie', 'extraterrestre', 'Ziggy Stardust. Cambió de personaje más veces que de ropa.'],
  ['Chupete Michael Jackson', 'extraterrestre', 'Guante blanco. Moonwalk en chupete.'],
  ['Chupete Elvis', 'legendario', 'El Rey. Patillas y cadera. Rock and roll original.'],
  ['Chupete Beatles', 'legendario', 'Los cuatro de Liverpool. La banda que cambió todo.'],
  ['Chupete Rolling Stones', 'ultra_raro', 'Lengua roja. El logo más reconocido del rock.'],
  ['Chupete Led Zeppelin', 'ultra_raro', 'El dirigible. Stairway y hard rock épico.'],
  ['Chupete Pink Floyd', 'ultra_raro', 'Prisma y arcoíris. La Dark Side of the Moon en chupete.'],
  ['Chupete Kurt Cobain', 'ultra_raro', 'Grunge eterno. Nevermind y la generación X.'],
  ['Chupete Radiohead', 'raro', 'Creep y paranoia. El rock más intelectual.'],
  ['Chupete Taylor Swift', 'legendario', 'Eras Tour. La artista más grande del mundo ahora mismo.'],
  ['Chupete Beyoncé', 'extraterrestre', 'Queen B. Formation y poder en chupete.'],
  ['Chupete Rihanna', 'ultra_raro', 'Fenty y barbados. Icono global.'],
  ['Chupete Adele', 'raro', 'Hello desde el otro lado. Voz de otro planeta.'],
  ['Chupete Lady Gaga', 'ultra_raro', 'Poker face y vestido de carne. Arte y pop extremo.'],
  ['Chupete Eminem', 'ultra_raro', 'Rap God. Palabras por segundo en chupete.'],
  ['Chupete Drake', 'raro', 'El canadiense más famoso del rap. Hotline Bling.'],
  ['Chupete Kendrick Lamar', 'extraterrestre', 'El mejor MC vivo. Pulitzer en rap.'],
  ['Chupete Travis Scott', 'raro', 'Astroworld y autotune. Sicko Mode en chupete.'],
  ['Chupete Bad Bunny', 'ultra_raro', 'El más escuchado del mundo. Puerto Rico global.'],
  ['Chupete J Balvin', 'raro', 'Colores y Medellín. El reggaeton de alta moda.'],
  ['Chupete Maluma', 'medio_raro', 'Hawái y Pretty Boy. El colombiano global.'],
  ['Chupete Rosalía', 'ultra_raro', 'Flamenco y Barcelona. Arte visual y musical.'],
  ['Chupete Karol G', 'raro', 'Bichota. Medellín en voz de mujer.'],
  ['Chupete Daddy Yankee', 'legendario', 'Gasolina y el Big Boss. El padre del reggaeton.'],
  ['Chupete Don Omar', 'raro', 'El Alfa. Danza Kuduro y reggaeton clásico.'],
  ['Chupete Wisin y Yandel', 'medio_raro', 'El dúo histórico. Rakata y nostalgia.'],
  ['Chupete Soda Stereo', 'legendario', 'Gustavo Cerati. El rock argentino en su cima.'],
  ['Chupete Cerati', 'extraterrestre', 'De musica ligera. La voz que Argentina nunca olvidará.'],
  ['Chupete Charly García', 'extraterrestre', 'El genio argentino. Sui Generis, Serú, solista. Todo.'],
  ['Chupete Luis Alberto Spinetta', 'en_el_ort', 'El flaco eterno. La poesía más grande del rock argentino.'],
  ['Chupete Fito Páez', 'ultra_raro', 'El amor después del amor. Rosarino universal.'],
  ['Chupete Andrés Calamaro', 'raro', 'El Salmón. Honestidad brutal en la música argentina.'],
  ['Chupete Divididos', 'raro', 'El rock nacional más rockero. Gato que pesca siempre.'],
  ['Chupete Los Redondos', 'extraterrestre', 'El Indio y Skay. El mito del rock argentino.'],
  ['Chupete Patricio Rey', 'legendario', 'La banda que nunca fue. El personaje que sí fue.'],
  ['Chupete Virus', 'ultra_raro', 'Federico Moura. El new wave más sofisticado de Argentina.'],
  ['Chupete Los Abuelos de la Nada', 'raro', 'Miguel Abuelo. La bohemia argentina.'],
  ['Chupete Babasónicos', 'raro', 'El rock más raro y más brillante. Siempre vigentes.'],
  ['Chupete Los Pericos', 'medio_raro', 'Reggae argentino. Verano y surf en invierno.'],
  ['Chupete La Beriso', 'poco_comun', 'Rock popular. Estadios llenos y corazón grande.'],
  ['Chupete El Cuarteto de Nos', 'raro', 'Los uruguayos filosóficos. Raro y muy especial.'],
  ['Chupete Jarabe de Palo', 'poco_comun', 'La flaca española. Los 90 en español.'],
  ['Chupete Joaquín Sabina', 'raro', 'El poeta del rock español. Cuarenta y pico noches.'],
  ['Chupete Silvio Rodríguez', 'ultra_raro', 'La nueva trova cubana. Unicornio azul eterno.'],
  ['Chupete Mercedes Sosa', 'legendario', 'La negra argentina. La voz del pueblo latinoamericano.'],
  ['Chupete Astor Piazzolla', 'extraterrestre', 'El tango que no era tango. El tango que es todo.'],
  ['Chupete Carlos Gardel', 'en_el_ort', 'El morocho del Abasto. Cada día que pasa canta mejor.'],
  ['Chupete Beethoven', 'extraterrestre', 'Sordo y genio. La quinta sinfonía en chupete.'],
  ['Chupete Mozart', 'extraterrestre', 'Prodigio desde los 5. La música más pura de la historia.'],

  // ══════════════════════════════════════════════════════════════════
  // COLECCIÓN 10 — DEPORTES & ÍDOLOS (50)
  // ══════════════════════════════════════════════════════════════════
  ['Chupete Messi', 'en_el_ort', '10 albiceleste. El mejor de todos los tiempos. Punto.'],
  ['Chupete Maradona', 'en_el_ort', 'La mano de Dios. El gol del siglo. El Diego eterno.'],
  ['Chupete Ronaldo', 'extraterrestre', 'CR7. Siete títulos de liga. La máquina del gol.'],
  ['Chupete Pelé', 'extraterrestre', 'O Rei. Tres Mundiales. El rey del fútbol para siempre.'],
  ['Chupete Zidane', 'legendario', 'Cabezazo incluido. El mejor europeo de su generación.'],
  ['Chupete Ronaldinho', 'legendario', 'La sonrisa del fútbol. El más gambetero de todos.'],
  ['Chupete Batistuta', 'ultra_raro', 'Rey de Roma. El 9 argentino de los 90.'],
  ['Chupete Riquelme', 'ultra_raro', 'El más creativo. Jugo como quiso, cuando quiso.'],
  ['Chupete Di Stéfano', 'legendario', 'La Saeta Rubia. El Real Madrid lo llora siempre.'],
  ['Chupete Fillol', 'raro', 'El arquero del 78. Las manos que detuvieron todo.'],
  ['Chupete Kempes', 'ultra_raro', 'El Matador. El gol del Mundial 78. Sangre y gloria.'],
  ['Chupete Valdano', 'raro', 'Filósofo del fútbol. Gol en el 86 también.'],
  ['Chupete Caniggia', 'raro', 'El hijo del viento. Pelo y velocidad en el 90.'],
  ['Chupete Ortega', 'raro', 'El Burrito. Talento enorme, carrera accidentada.'],
  ['Chupete Tévez', 'ultra_raro', 'El Apache de Fuerte Apache. Garra y goles.'],
  ['Chupete Agüero', 'ultra_raro', 'El Kun. El gol más famoso de la Premier League.'],
  ['Chupete Higuaín', 'raro', 'El pipita. Los que saben saben que hacía goles igual.'],
  ['Chupete Di María', 'ultra_raro', 'El Fideo. La asistencia más importante de la historia argentina.'],
  ['Chupete Lautaro', 'raro', 'El Toro del Inter. La delantera del futuro albiceleste.'],
  ['Chupete Julián Álvarez', 'raro', 'La Araña. El gol en el Mundial 2022. Leyenda.'],
  ['Chupete Wembanyama', 'extraterrestre', 'El alien de la NBA. 2.24m y muñeca de base.'],
  ['Chupete Jordan', 'legendario', 'His Airness. Seis anillos. The Last Dance.'],
  ['Chupete LeBron', 'extraterrestre', 'El Rey. Cuatro anillos con tres franquicias distintas.'],
  ['Chupete Kobe', 'extraterrestre', 'Mamba Mentality. Cinco anillos. Siempre en el corazón.'],
  ['Chupete Magic Johnson', 'legendario', 'Showtime Lakers. El base que llegó a aro de centro.'],
  ['Chupete Larry Bird', 'legendario', 'El hombre blanco más negro del básquet. La rivalidad.'],
  ['Chupete Federer', 'extraterrestre', 'El más elegante. 20 Slams con arte puro.'],
  ['Chupete Nadal', 'extraterrestre', 'El toro de Manacor. 22 Slams y arcilla eterna.'],
  ['Chupete Djokovic', 'extraterrestre', 'El número uno. 24 Slams. La máquina del tenis.'],
  ['Chupete Serena Williams', 'extraterrestre', 'La más grande del tenis femenino. Punto.'],
  ['Chupete Usain Bolt', 'legendario', 'El más rápido. 9.58 en los 100m. El rayo.'],
  ['Chupete Carl Lewis', 'ultra_raro', 'Nueve oros olímpicos. El hombre que voló en los 80.'],
  ['Chupete Ali', 'extraterrestre', 'El más grande. Float like a butterfly en chupete.'],
  ['Chupete Tyson', 'legendario', 'Iron Mike. El más temido del boxeo en su tiempo.'],
  ['Chupete Canelo', 'ultra_raro', 'El mexicano cuatro divisiones. El mejor boxeador actual.'],
  ['Chupete Schumacher', 'legendario', 'Siete títulos de F1. El Barón Rojo de Ferrari.'],
  ['Chupete Senna', 'en_el_ort', 'El más rápido bajo la lluvia. Imola nunca se olvida.'],
  ['Chupete Verstappen', 'ultra_raro', 'El holandés invencible. Tres títulos consecutivos.'],
  ['Chupete Hamilton', 'extraterrestre', 'Siete títulos. El más ganador de la historia de la F1.'],
  ['Chupete Fangio', 'legendario', 'El Chueco. El argentino más grande de la F1. Cinco títulos.'],
  ['Chupete Luciana Aymar', 'ultra_raro', 'La Maga del hockey. La mejor jugadora de la historia.'],
  ['Chupete Las Leonas', 'legendario', 'El equipo de hockey más exitoso de Argentina. Siempre.'],
  ['Chupete Pato Fillol', 'raro', 'El arquero del pueblo. Sangre albiceleste.'],
  ['Chupete Pepe Costa', 'comun', 'El técnico de barrio. El que te preparó en cuarta.'],
  ['Chupete Menotti', 'ultra_raro', 'El Flaco. El técnico del 78. Filosofía de fútbol.'],
  ['Chupete Bilardo', 'ultra_raro', 'El técnico del 86. El que puso a Maradona donde debía estar.'],
  ['Chupete Scaloni', 'extraterrestre', 'El técnico del 2022. El que finalmente ganó el mundo.'],
  ['Chupete El Tata Martino', 'comun', 'El que salió en cuartos con Argentina. El antes de Scaloni.'],
  ['Chupete Passarella', 'raro', 'El Kaiser. Capitán del 78. Defensor total.'],
  ['Chupete Trobbiani', 'poco_comun', 'El levantador eterno. El vóley argentino que se olvida.'],

  // ══════════════════════════════════════════════════════════════════
  // COLECCIÓN 11 — TECNOLOGÍA & MARCAS TECH (50)
  // ══════════════════════════════════════════════════════════════════
  ['Chupete Apple', 'extraterrestre', 'Manzana mordida. El logo más reconocido del mundo tech.'],
  ['Chupete Google', 'extraterrestre', 'Cuatro colores. El motor de todo el conocimiento humano.'],
  ['Chupete Microsoft', 'ultra_raro', 'Windows en chupete. Bill Gates lo aprueba.'],
  ['Chupete Meta', 'raro', 'El Facebook que no quería ser Facebook. Metaverso fallido.'],
  ['Chupete Amazon', 'raro', 'La flecha de A a Z. Todo en un click y en chupete.'],
  ['Chupete Netflix', 'raro', 'N roja. El contenido que consumís sin dormir.'],
  ['Chupete Spotify', 'raro', 'Verde con ondas. La música de toda tu vida.'],
  ['Chupete Twitter/X', 'medio_raro', 'El pájaro que fue. Ahora es X y está raro.'],
  ['Chupete TikTok', 'raro', 'La nota musical. La app que se come el tiempo.'],
  ['Chupete Instagram', 'medio_raro', 'Cámara arcoíris. Filtros y comparaciones.'],
  ['Chupete YouTube', 'raro', 'Play rojo. Infinitas horas de contenido.'],
  ['Chupete Discord', 'medio_raro', 'El joystick azul. El chat de los gamers.'],
  ['Chupete Twitch', 'raro', 'Púrpura y streams. El hogar del live gaming.'],
  ['Chupete Reddit', 'medio_raro', 'El alien naranja. El frente de la internet.'],
  ['Chupete WhatsApp', 'poco_comun', 'El teléfono verde. La app que usa tu tía.'],
  ['Chupete Telegram', 'poco_comun', 'El avión azul. WhatsApp para los que saben.'],
  ['Chupete LinkedIn', 'comun', 'El saco azul. El networking que nadie quiere.'],
  ['Chupete Zoom', 'poco_comun', 'La pandemia en icono. Reuniones infinitas.'],
  ['Chupete Slack', 'poco_comun', 'El trabajo remoto en un canal. Notificaciones eternas.'],
  ['Chupete GitHub', 'medio_raro', 'El pulpo negro. El repositorio del código del mundo.'],
  ['Chupete VS Code', 'medio_raro', 'El editor azul de Microsoft. El favorito de los devs.'],
  ['Chupete Linux', 'raro', 'El pingüino Tux. El sistema operativo libre.'],
  ['Chupete Python', 'raro', 'La serpiente. El lenguaje de la IA y los datos.'],
  ['Chupete JavaScript', 'medio_raro', 'El caos web. Está en todos lados, bien o mal.'],
  ['Chupete TypeScript', 'raro', 'El JavaScript adulto. Con tipos y con dignidad.'],
  ['Chupete Rust', 'ultra_raro', 'El lenguaje del futuro. Sin bugs de memoria.'],
  ['Chupete Go', 'raro', 'El lenguaje de Google. Simple y concurrente.'],
  ['Chupete Supabase', 'ultra_raro', 'El backend de ChupeteClicker. Gracias por existir.'],
  ['Chupete Vercel', 'raro', 'El deploy en segundos. El hogar de Next.js.'],
  ['Chupete Next.js', 'ultra_raro', 'El framework de ChupeteClicker. React con superpoderes.'],
  ['Chupete React', 'raro', 'La UI en componentes. El estándar del frontend.'],
  ['Chupete Claude AI', 'en_el_ort', 'La IA que ayudó a construir ChupeteClicker en 6 horas. Épico.'],
  ['Chupete ChatGPT', 'ultra_raro', 'El que popularizó la IA. El nombre que todos dicen.'],
  ['Chupete Gemini', 'raro', 'El AI de Google. El que quiere ser lo que Claude ya es.'],
  ['Chupete Nvidia', 'extraterrestre', 'La GPU verde. La empresa que hace posible la IA.'],
  ['Chupete Tesla', 'ultra_raro', 'El auto eléctrico. Autopilot y Musk juntos.'],
  ['Chupete SpaceX', 'extraterrestre', 'El cohete privado. El futuro de la exploración.'],
  ['Chupete Neuralink', 'en_el_ort', 'Chip en el cerebro. El futuro perturbador de Musk.'],
  ['Chupete OpenAI', 'extraterrestre', 'La organización que lo cambió todo en 2022.'],
  ['Chupete Anthropic', 'extraterrestre', 'Los que hicieron a Claude. Buenos chicos del AI.'],
  ['Chupete Samsung', 'raro', 'El rival de Apple. El que tiene heladera y teléfono.'],
  ['Chupete Intel', 'medio_raro', 'Inside. El procesador que estuvo en todo.'],
  ['Chupete AMD', 'raro', 'El rival de Intel. Los que ganaron la guerra de la GPU.'],
  ['Chupete PlayStation', 'ultra_raro', 'La consola de Sony. El competidor eterno de Xbox.'],
  ['Chupete Xbox', 'ultra_raro', 'La consola de Microsoft. Game Pass y el futuro.'],
  ['Chupete Nintendo', 'legendario', 'El inventor del gameplay. Mario, Zelda, Pokemon. Todo.'],
  ['Chupete Steam', 'ultra_raro', 'La plataforma de Valve. El mercado de PC gaming.'],
  ['Chupete Figma', 'medio_raro', 'El diseño colaborativo. Adobe lo quiso comprar.'],
  ['Chupete Notion', 'poco_comun', 'La nota de notas. El todo en uno que organiza nada.'],
  ['Chupete Canva', 'poco_comun', 'El diseño para todos. Sin Photoshop ni drama.'],

  // ══════════════════════════════════════════════════════════════════
  // COLECCIÓN 12 — NATURALEZA & ANIMALES (50)
  // ══════════════════════════════════════════════════════════════════
  ['Chupete León', 'ultra_raro', 'El rey de la sabana. Melena y rugido en chupete.'],
  ['Chupete Tigre', 'ultra_raro', 'Rayas naranja y negro. El felino más temido.'],
  ['Chupete Elefante', 'raro', 'El más grande de la tierra. Memoria eterna.'],
  ['Chupete Ballena Azul', 'extraterrestre', 'El animal más grande que existió. 30 metros de criatura.'],
  ['Chupete Delfín', 'raro', 'El más inteligente del mar. Sonar natural.'],
  ['Chupete Orca', 'ultra_raro', 'Lobo del mar. Caza en manada. Blanco y negro perfecto.'],
  ['Chupete Tiburón', 'raro', 'El depredador del océano. 400 millones de años sin cambios.'],
  ['Chupete Pulpo', 'ultra_raro', 'Ocho brazos e inteligencia inhumana. Cromatóforos.'],
  ['Chupete Calamar Gigante', 'extraterrestre', 'El kraken real. Profundidades inexploradas.'],
  ['Chupete Medusa', 'raro', 'Transparente y letal. Danza sin cerebro.'],
  ['Chupete Águila', 'raro', 'Vista kilométrica. El rey del cielo.'],
  ['Chupete Cóndor', 'ultra_raro', 'El cóndor pasa. Argentina y Andes.'],
  ['Chupete Colibrí', 'raro', 'El más pequeño. Alas a 80 por segundo.'],
  ['Chupete Pavo Real', 'raro', 'Cola iridiscente. El flex del reino animal.'],
  ['Chupete Flamenco', 'poco_comun', 'Rosa. Parado en una pata. Elegante sin esfuerzo.'],
  ['Chupete Pingüino', 'poco_comun', 'Esmoquin natural. Patagonia en chupete.'],
  ['Chupete Oso Polar', 'medio_raro', 'Blanco ártico. El cambio climático lo amenaza.'],
  ['Chupete Panda', 'raro', 'Blanco y negro. La diplomacia china en oso.'],
  ['Chupete Koala', 'poco_comun', 'Eucalipto y sueño eterno. Australia en abrazo.'],
  ['Chupete Canguro', 'poco_comun', 'Bolsillo natural. El mamífero más australiano.'],
  ['Chupete Lobo', 'raro', 'Manada y aullido. La luna llena en chupete.'],
  ['Chupete Zorro', 'poco_comun', 'Naranja y astuto. El inteligente del bosque.'],
  ['Chupete Mapache', 'poco_comun', 'Máscara natural. Lava todo antes de comer.'],
  ['Chupete Oso Hormiguero', 'comun', 'Lengua larga. El raro de la fauna argentina.'],
  ['Chupete Capibara', 'raro', 'El roedor más grande. El más sociable también.'],
  ['Chupete Armadillo', 'poco_comun', 'Armadura natural. Se enrolla. Argentino puro.'],
  ['Chupete Yacaré', 'medio_raro', 'Cocodrilo del litoral. Majestuoso e inmóvil.'],
  ['Chupete Puma', 'ultra_raro', 'El gato montés patagónico. Silencioso y letal.'],
  ['Chupete Yaguareté', 'extraterrestre', 'El jaguar argentino. En peligro de extinción. Sagrado.'],
  ['Chupete Mariposa Monarca', 'raro', 'Naranja y negro. Migra miles de kilómetros.'],
  ['Chupete Abeja', 'poco_comun', 'Polinización y miel. Sin ellas no hay comida.'],
  ['Chupete Libélula', 'poco_comun', 'Vuelo perfecto. El insecto más maniobrable.'],
  ['Chupete Escorpión', 'medio_raro', 'Cola con veneno. Sobrevivió a los dinosaurios.'],
  ['Chupete Tarántula', 'medio_raro', 'Grande y peluda. Menos peligrosa de lo que parece.'],
  ['Chupete Gecko', 'poco_comun', 'Adhesión molecular. Escala paredes sin esfuerzo.'],
  ['Chupete Camaleón', 'raro', 'Cambia de color. El maestro del camuflaje.'],
  ['Chupete Axolotl', 'ultra_raro', 'Salamandra mexicana. Se regenera completamente.'],
  ['Chupete Mantis Religiosa', 'raro', 'Reza antes de comer a su pareja.'],
  ['Chupete Platypus', 'extraterrestre', 'Pico de pato, cola de castor, veneno. ¿Qué sos?'],
  ['Chupete Tardigrado', 'extraterrestre', 'El animal más resistente. Sobrevive el vacío espacial.'],
  ['Chupete Perezoso', 'comun', 'Tres dedos y lentitud legendaria. Relax total.'],
  ['Chupete Nutria', 'poco_comun', 'Flota de espaldas. Come mariscos en el pecho. Adorable.'],
  ['Chupete Cuervo', 'medio_raro', 'El más inteligente de las aves. Resuelve puzzles.'],
  ['Chupete Loro', 'poco_comun', 'Habla. O cree que habla. Plumas de colores.'],
  ['Chupete Tucán', 'raro', 'Pico enorme de colores. El pájaro más fotografiado de América.'],
  ['Chupete Quetzal', 'ultra_raro', 'Pluma verde esmeralda. El pájaro sagrado maya.'],
  ['Chupete Ave del Paraíso', 'extraterrestre', 'Papua Nueva Guinea. El animal más extraño que existe.'],
  ['Chupete Dragón de Komodo', 'ultra_raro', 'El lagarto más grande. Veneno bacteriano.'],
  ['Chupete Mantarraya', 'raro', 'Vuela bajo el agua. La más elegante del océano.'],
  ['Chupete Narval', 'extraterrestre', 'El unicornio del mar. Cuerno de marfil real.'],

  // ══════════════════════════════════════════════════════════════════
  // COLECCIÓN 13 — ARGENTINA PROFUNDA (50)
  // ══════════════════════════════════════════════════════════════════
  ['Chupete del Obelisco', 'legendario', 'El fálico monumento porteño. El centro de todo.'],
  ['Chupete de la 9 de Julio', 'ultra_raro', 'La avenida más ancha del mundo. Cruzarla es un deporte.'],
  ['Chupete de Palermo', 'raro', 'Hipster, restaurantes, parques. Buenos Aires de exportación.'],
  ['Chupete de San Telmo', 'raro', 'Antigüedades y tango. El barrio que fue y es.'],
  ['Chupete de La Boca', 'raro', 'La Bombonera a metros. Colores y conventillos.'],
  ['Chupete del Caminito', 'medio_raro', 'Turistas y colores. El postal más clásico.'],
  ['Chupete de Rosario', 'ultra_raro', 'La ciudad de Messi. Y de Fito. Y del Che.'],
  ['Chupete de Córdoba', 'raro', 'La Docta. Cuarteto y sierras. La segunda ciudad.'],
  ['Chupete de Mendoza', 'raro', 'Malbec y Aconcagua. La mejor provincia de vinos.'],
  ['Chupete de Salta', 'raro', 'La linda. Carnaval, cerros de colores y empanadas.'],
  ['Chupete de Tucumán', 'raro', 'La independencia argentina. 9 de julio de 1816.'],
  ['Chupete de Bariloche', 'ultra_raro', 'Chocolate y nieve. La postal patagónica.'],
  ['Chupete de Ushuaia', 'extraterrestre', 'El fin del mundo. La ciudad más austral.'],
  ['Chupete de Iguazú', 'extraterrestre', 'Las cataratas más grandes del mundo. Maravilla real.'],
  ['Chupete del Perito Moreno', 'extraterrestre', 'El glaciar que avanza. Santa Cruz y eternidad.'],
  ['Chupete de la Quebrada de Humahuaca', 'ultra_raro', 'Patrimonio mundial. Colores del noroeste.'],
  ['Chupete del Aconcagua', 'extraterrestre', 'La cumbre más alta de América. 6.962 metros.'],
  ['Chupete del Río de la Plata', 'raro', 'El más ancho del mundo. Entre Argentina y Uruguay.'],
  ['Chupete del Iberá', 'ultra_raro', 'Los esteros de Corrientes. Biodiversidad única.'],
  ['Chupete de la Patagonia', 'extraterrestre', 'El sur infinito. Viento, glaciares y silencio.'],
  ['Chupete del mate', 'legendario', 'El ritual argentino. Sin esto no hay conversación.'],
  ['Chupete del bombo', 'raro', 'El instrumento de la hinchada. Quilmes y cancha.'],
  ['Chupete del asado domenical', 'ultra_raro', 'Domingo, familia, brasa. La religión argentina.'],
  ['Chupete del colectivo 60', 'comun', 'La línea más larga de Buenos Aires. Siempre lleno.'],
  ['Chupete del subte A', 'poco_comun', 'El más antiguo. Madera original. Patrimonio vivo.'],
  ['Chupete del tren Sarmiento', 'comun', 'El de la vida en el oeste. Drama cotidiano.'],
  ['Chupete del Banco Nación', 'comun', 'La cola. Siempre la cola. El sistema.'],
  ['Chupete del INDEC', 'raro', 'Las estadísticas. A veces creíbles.'],
  ['Chupete del dólar blue', 'ultra_raro', 'El tipo de cambio paralelo. La economía real del argentino.'],
  ['Chupete de la cueva', 'raro', 'Donde se cambia el dólar. La economía informal.'],
  ['Chupete del cepo', 'medio_raro', 'La restricción cambiaria. El dolor de cabeza permanente.'],
  ['Chupete de la inflación', 'legendario', 'El monstruo argentino. Siempre presente.'],
  ['Chupete del FMI', 'raro', 'La deuda eterna. El organismo que Argentina llama.'],
  ['Chupete de Evita', 'extraterrestre', 'María Eva Duarte. El símbolo más poderoso de la política argentina.'],
  ['Chupete de Perón', 'ultra_raro', 'El general. El fenómeno político que dividió y une.'],
  ['Chupete del Che Guevara', 'extraterrestre', 'El rosarino eterno. La cara más reproducida del siglo XX.'],
  ['Chupete de Belgrano', 'legendario', 'El creador de la bandera. Prócer silencioso y enorme.'],
  ['Chupete de San Martín', 'en_el_ort', 'El libertador. El más grande de todos. Indiscutible.'],
  ['Chupete del gaucho', 'raro', 'Pampa y tradición. El jinete libre de la llanura.'],
  ['Chupete del farol porteño', 'poco_comun', 'La luz de los conventillos. Tango y noche.'],
  ['Chupete del ladrillo', 'comun', 'El ahorro argentino. La casa propia primero.'],
  ['Chupete del sulky', 'comun', 'Transporte del interior. Caballo y rueda.'],
  ['Chupete de la vaca lechera', 'poco_comun', 'El campo argentino. La que alimenta y exporta.'],
  ['Chupete del girasol', 'poco_comun', 'El campo pampeano. Aceite y horizonte.'],
  ['Chupete de la soja', 'raro', 'El oro verde argentino. La que salvó y endeudó.'],
  ['Chupete del pampero', 'medio_raro', 'El viento del sur. El que baja la temperatura en minutos.'],
  ['Chupete del asador', 'ultra_raro', 'El que maneja el fuego. El rol más respetado del asado.'],
  ['Chupete del cuchillo criollo', 'ultra_raro', 'Filo y tradición. Herencia gaucha.'],
  ['Chupete de la boleadora', 'raro', 'El arma del gaucho. Tres bolas y precisión.'],
  ['Chupete del poncho', 'raro', 'Abrigo del noroeste. Tejido a mano con historia.'],

  // ══════════════════════════════════════════════════════════════════
  // COLECCIÓN 14 — PELÍCULAS & SERIES (50)
  // ══════════════════════════════════════════════════════════════════
  ['Chupete Star Wars', 'extraterrestre', 'La galaxia muy muy lejana. May the force be with you.'],
  ['Chupete Darth Vader', 'ultra_raro', 'Respiración mecánica. El lado oscuro en chupete.'],
  ['Chupete Luke Skywalker', 'raro', 'Sable azul. El héroe original de la saga.'],
  ['Chupete Yoda', 'extraterrestre', 'El más sabio. Habla al revés pero siempre tiene razón.'],
  ['Chupete Harry Potter', 'ultra_raro', 'La cicatriz del rayo. Hogwarts en chupete.'],
  ['Chupete Hermione', 'ultra_raro', 'La más inteligente de los tres. Sin ella no sobreviven.'],
  ['Chupete Voldemort', 'extraterrestre', 'El que no debe ser nombrado. Nariz inexistente.'],
  ['Chupete El Señor de los Anillos', 'extraterrestre', 'Un anillo para gobernarlos a todos.'],
  ['Chupete Gollum', 'ultra_raro', 'Mi tesoro. El personaje más perturbador y simpático.'],
  ['Chupete Gandalf', 'legendario', 'No pasarás. El mago más poderoso de la ficción.'],
  ['Chupete The Matrix', 'extraterrestre', 'Pastilla roja o azul. Elige el chupete.'],
  ['Chupete Jurassic Park', 'ultra_raro', 'La vida se abre camino. T-Rex en chupete.'],
  ['Chupete Indiana Jones', 'raro', 'Sombrero y látigo. Arqueología de acción.'],
  ['Chupete James Bond', 'raro', 'Shaken, not stirred. El espía más elegante.'],
  ['Chupete Marvel', 'ultra_raro', 'El universo cinematográfico más grande de la historia.'],
  ['Chupete Iron Man', 'ultra_raro', 'I am Iron Man. El inicio del MCU.'],
  ['Chupete Spider-Man', 'raro', 'With great power. El más querido de Marvel.'],
  ['Chupete Thanos', 'extraterrestre', 'Las seis gemas del infinito. Perfectamente equilibrado.'],
  ['Chupete DC', 'raro', 'El universo rival. Batman, Superman, Wonder Woman.'],
  ['Chupete Batman', 'ultra_raro', 'Murciélago y dinero. El detective más oscuro.'],
  ['Chupete Joker', 'extraterrestre', 'Agente del caos. Sonrisa permanente.'],
  ['Chupete Breaking Bad', 'extraterrestre', 'I am the one who knocks. Walter White en chupete.'],
  ['Chupete The Wire', 'extraterrestre', 'La mejor serie de la historia. Omar coming.'],
  ['Chupete Game of Thrones', 'legendario', 'Winter is coming. Antes de la última temporada.'],
  ['Chupete House of the Dragon', 'ultra_raro', 'Los Targaryen de vuelta. El fuego y sangre continúa.'],
  ['Chupete Stranger Things', 'raro', 'El mundo del revés. Hawkins y los 80.'],
  ['Chupete The Last of Us', 'ultra_raro', 'Joel y Ellie. El zombie show que no es sobre zombies.'],
  ['Chupete Succession', 'extraterrestre', 'Los Roy. La familia más disfuncional de la TV premium.'],
  ['Chupete The Bear', 'ultra_raro', 'La cocina más estresante de la TV. Carmy y el servicio.'],
  ['Chupete Euphoria', 'raro', 'Rue Bennett. Maquillaje y trauma generacional.'],
  ['Chupete Rick and Morty', 'ultra_raro', 'Wubba lubba dub dub. Ciencia y nihilismo en animación.'],
  ['Chupete South Park', 'raro', 'Respetan a nadie. Llevan 25 años igual.'],
  ['Chupete Simpsons', 'legendario', 'Los Simpson predijeron todo. La familia amarilla eterna.'],
  ['Chupete Family Guy', 'raro', 'Peter Griffin y humor negro sin filtro.'],
  ['Chupete Futurama', 'ultra_raro', 'Año 3000. El hijo espiritual de los Simpsons.'],
  ['Chupete Naruto', 'raro', 'Believe it! El ninja naranja que duró 700 episodios.'],
  ['Chupete Dragon Ball Z', 'ultra_raro', 'It\'s over 9000. Goku y transformaciones eternas.'],
  ['Chupete One Piece', 'extraterrestre', 'El manga más largo. Luffy y el Rei Pirata.'],
  ['Chupete Attack on Titan', 'extraterrestre', 'Los titanes y la humanidad. El final más polémico.'],
  ['Chupete Death Note', 'ultra_raro', 'El cuaderno de la muerte. Light Yagami vs L.'],
  ['Chupete Fullmetal Alchemist', 'ultra_raro', 'Brotherhood. El anime más equilibrado y completo.'],
  ['Chupete Evangelion', 'extraterrestre', 'Unit-01 y traumas de infancia. Anno masterpiece.'],
  ['Chupete Cowboy Bebop', 'legendario', 'See you space cowboy. El jazz del anime.'],
  ['Chupete Demon Slayer', 'raro', 'Tanjiro y la hermana demonio. Animación increíble.'],
  ['Chupete Jujutsu Kaisen', 'raro', 'Itadori y los espíritus malditos. El anime del momento.'],
  ['Chupete Chainsaw Man', 'ultra_raro', 'Denji y Pochita. El más salvaje del shonen moderno.'],
  ['Chupete La Casa de Papel', 'raro', 'Bella ciao. El mono rojo de Dalí internacional.'],
  ['Chupete El Marginal', 'ultra_raro', 'La serie argentina de Netflix. Cárcel y suspenso real.'],
  ['Chupete Relatos Salvajes', 'extraterrestre', 'La película argentina más vista del mundo. Seis historias.'],
  ['Chupete El Secreto de sus Ojos', 'extraterrestre', 'Oscar a mejor película extranjera. Argentina en el mundo.'],

  // ══════════════════════════════════════════════════════════════════
  // COLECCIÓN 15 — RAREZAS ABSOLUTAS & MISCELÁNEAS (50)
  // ══════════════════════════════════════════════════════════════════
  ['Chupete del Error 404', 'comun', 'No encontrado. Existe igual.'],
  ['Chupete del Loading', 'comun', 'Cargando. Por favor espere. Siempre cargando.'],
  ['Chupete del Ctrl+Z', 'poco_comun', 'Deshacer. Si solo funcionara en la vida real.'],
  ['Chupete del Stack Overflow', 'medio_raro', 'La respuesta a todo. El templo de los devs.'],
  ['Chupete del README', 'poco_comun', 'Leer las instrucciones. Nadie lo hace.'],
  ['Chupete del Bug', 'comun', 'No es un bug, es una feature. Siempre.'],
  ['Chupete del Deploy en Viernes', 'raro', 'La decisión más temeraria del desarrollo. Nunca falles.'],
  ['Chupete del Merge Conflict', 'medio_raro', 'Cuando dos ramas no se llevan bien.'],
  ['Chupete del Spaghetti Code', 'comun', 'Código sin estructura. Pasta en el servidor.'],
  ['Chupete del Legacy Code', 'poco_comun', 'El código de antes que nadie toca por miedo.'],
  ['Chupete del Rubber Duck', 'poco_comun', 'El pato de debugging. Contarle el problema al pato.'],
  ['Chupete del Hotfix', 'raro', 'El parche de emergencia. Las 3am de los devs.'],
  ['Chupete de la Fibra Óptica', 'poco_comun', 'Internet de verdad. El sueño argentino.'],
  ['Chupete del Ping 999', 'comun', 'Lag eterno. El peor enemigo del gamer.'],
  ['Chupete del Wifi de Hotel', 'comun', 'Siempre promete, nunca cumple.'],
  ['Chupete del DNS', 'medio_raro', 'La guía telefónica de internet. Cuando falla, todo falla.'],
  ['Chupete del Firewall', 'medio_raro', 'La pared digital. Protege o molesta según el momento.'],
  ['Chupete del VPN', 'raro', 'Geolocalización falsa. Para ver Netflix de otros países.'],
  ['Chupete del Blockchain', 'ultra_raro', 'La tecnología que iba a cambiarlo todo. Sigue intentando.'],
  ['Chupete del NFT', 'raro', 'El momento más ridículo de la tecnología. Fue real.'],
  ['Chupete del Bitcoin', 'extraterrestre', 'La primera cripto. Sube y baja y sube y vos perdés.'],
  ['Chupete del Ethereum', 'ultra_raro', 'Smart contracts. El blockchain con más uso real.'],
  ['Chupete de la IA Generativa', 'extraterrestre', 'La revolución de 2022. Generás todo con texto.'],
  ['Chupete del Prompt Engineering', 'raro', 'El arte de hablarle a la IA. Nueva profesión.'],
  ['Chupete del Fine-tuning', 'ultra_raro', 'Entrenar modelos con tus datos. Técnico y poderoso.'],
  ['Chupete del GPU Cluster', 'extraterrestre', 'Miles de GPUs trabajando juntas. Eso entrena a la IA.'],
  ['Chupete del Singularity', 'en_el_ort', 'El punto donde la IA supera al humano. Ya cerca.'],
  ['Chupete del Open Source', 'ultra_raro', 'Código libre para todos. La filosofía que movió el mundo.'],
  ['Chupete del MIT License', 'raro', 'Hacé lo que quieras con esto. La licencia del bien.'],
  ['Chupete del Dark Web', 'ultra_raro', 'Lo que no indexa Google. Existe. No vayas.'],
  ['Chupete del Tor', 'raro', 'Anonimato digital. La cebolla de la privacidad.'],
  ['Chupete del Monolito de 2001', 'extraterrestre', 'El objeto negro de Kubrick. Donde todo empieza.'],
  ['Chupete del Arca de Noé', 'legendario', 'Dos de cada animal. El barco más famoso de la historia.'],
  ['Chupete de Pandora', 'ultra_raro', 'La caja que no había que abrir. Ahora todos los males sueltos.'],
  ['Chupete de Excalibur', 'legendario', 'La espada en la piedra. Solo el elegido lo saca.'],
  ['Chupete del Santo Grial', 'en_el_ort', 'La copa de la última cena. Buscada por siglos.'],
  ['Chupete de la Atlántida', 'extraterrestre', 'La civilización sumergida. ¿Existió? El chupete sí.'],
  ['Chupete de El Dorado', 'legendario', 'La ciudad de oro latinoamericana. Nunca encontrada.'],
  ['Chupete del Triángulo de las Bermudas', 'ultra_raro', 'Zona de misterios. Barcos y aviones desaparecidos.'],
  ['Chupete del Área 51', 'extraterrestre', 'Lo que el gobierno no muestra. Los aliens lo saben.'],
  ['Chupete de la Piedra Rosetta', 'legendario', 'La que descifró el egipcio. La clave de la historia.'],
  ['Chupete del Manuscrito Voynich', 'extraterrestre', 'El libro que nadie descifró. Idioma desconocido.'],
  ['Chupete del Código Da Vinci', 'raro', 'La conspiración más bestseller de la historia.'],
  ['Chupete de la Mona Lisa', 'legendario', 'La sonrisa más analizada del arte. ¿Qué esconde?'],
  ['Chupete de la Capilla Sixtina', 'extraterrestre', 'Miguel Ángel en el techo. Cuatro años boca arriba.'],
  ['Chupete del Guernica', 'ultra_raro', 'Picasso y la guerra. El cuadro más político del arte.'],
  ['Chupete del Grito de Munch', 'raro', 'La angustia existencial en naranja y azul.'],
  ['Chupete de Las Meninas', 'raro', 'Velázquez y el juego de la mirada. El cuadro que te mira.'],
  ['Chupete del Pensador', 'medio_raro', 'Rodin en bronce. La meditación hecha escultura.'],
  ['Chupete de La Piedad', 'extraterrestre', 'Miguel Ángel en mármol. El dolor más bello del arte.'],
]

// ─── GENERADOR DE IMAGEN ──────────────────────────────────────────────────────
async function generarImagen(nombre, rareza, descripcion) {
  const estiloRareza = RAREZAS[rareza]?.color || 'colorido y brillante'
  const nombreCorto = nombre.replace('Chupete ', '').replace('El Chupete ', '').toLowerCase()

  const prompt = encodeURIComponent(
    `baby pacifier product photography, isolated on dark background, ` +
    `${estiloRareza}, ` +
    `${nombreCorto} theme style, ` +
    `high quality 3D render, dramatic lighting, centered, no text`
  )

  const url = `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 99999)}`

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Error imagen: ${response.status}`)
  return await response.buffer()
}

// ─── SUBIR A SUPABASE STORAGE ─────────────────────────────────────────────────
async function subirImagen(buffer, rareza, index) {
  const filename = `${rareza}_gen_${index}.jpg`
  const filepath = `${rareza}/${filename}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filepath, buffer, { contentType: 'image/jpeg', upsert: true })

  if (error) throw new Error(`Error upload: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filepath)
  return data.publicUrl
}

// ─── INSERTAR EN DB ───────────────────────────────────────────────────────────
async function insertarItem(nombre, rareza, descripcion, imageUrl, coleccion) {
  const float = parseFloat((Math.random()).toFixed(4))

  const { error } = await supabase.from('items').insert({
    name: nombre,
    rarity: rareza,
    description: descripcion,
    image_url: imageUrl,
    float_value: float,
    collection: coleccion, // nueva columna opcional — agregala al schema si querés filtrar por colección
  })

  if (error) {
    // Si no existe la columna collection o float_value, insertá sin ellas
    await supabase.from('items').insert({
      name: nombre,
      rarity: rareza,
      description: descripcion,
      image_url: imageUrl,
    })
  }
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────
async function main() {
  const COLECCIONES = [
    'Bebidas & Marcas', 'Países del Mundo', 'Streamers & Creadores', 'Memes & Internet',
    'Materiales & Texturas', 'Comidas Argentinas', 'Gaming & Videojuegos', 'Espacio & Cosmos',
    'Música & Artistas', 'Deportes & Ídolos', 'Tecnología & Tech', 'Naturaleza & Animales',
    'Argentina Profunda', 'Películas & Series', 'Rarezas Absolutas'
  ]

  console.log(`🍬 ChupeteClicker — Generador v2.0`)
  console.log(`📦 ${CHUPETES.length} chupetes | 15 colecciones de 50\n`)

  const logFile = 'generacion_log.json'
  const resultados = []
  let exitosos = 0
  let fallidos = 0

  for (let i = 0; i < CHUPETES.length; i++) {
    const [nombre, rareza, descripcion] = CHUPETES[i]
    const coleccion = COLECCIONES[Math.floor(i / 50)]

    try {
      process.stdout.write(`[${i + 1}/${CHUPETES.length}] ${coleccion} | ${nombre} (${rareza})... `)

      const imageBuffer = await generarImagen(nombre, rareza, descripcion)
      const imageUrl = await subirImagen(imageBuffer, rareza, i)
      await insertarItem(nombre, rareza, descripcion, imageUrl, coleccion)

      console.log(`✅`)
      resultados.push({ nombre, rareza, coleccion, status: 'ok', imageUrl })
      exitosos++

      await new Promise(r => setTimeout(r, DELAY_MS))

    } catch (err) {
      console.log(`❌ ${err.message}`)
      resultados.push({ nombre, rareza, coleccion, status: 'error', error: err.message })
      fallidos++
      await new Promise(r => setTimeout(r, DELAY_MS * 2))
    }

    if (i % 10 === 0) fs.writeFileSync(logFile, JSON.stringify(resultados, null, 2))
  }

  fs.writeFileSync(logFile, JSON.stringify(resultados, null, 2))

  console.log(`\n✅ Exitosos: ${exitosos}`)
  console.log(`❌ Fallidos: ${fallidos}`)
  console.log(`📄 Log: ${logFile}`)

  // Resumen por colección
  console.log('\n📊 Resumen por colección:')
  COLECCIONES.forEach((col, idx) => {
    const items = resultados.filter(r => r.coleccion === col)
    const ok = items.filter(r => r.status === 'ok').length
    console.log(`  ${col}: ${ok}/50`)
  })
}

main().catch(console.error)
