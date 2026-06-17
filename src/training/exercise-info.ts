/**
 * Ficha técnica por ejercicio: "cómo hacerlo" en 2-4 claves cortas.
 * Sacado de la metodología aprobada (selección y técnica por músculo).
 * El lenguaje es de entrenador pero llano; los tecnicismos viven en el glosario.
 */
export interface ExerciseInfo {
  howTo: string[];
}

export const EXERCISE_INFO: Record<string, ExerciseInfo> = {
  // Pecho
  'Press inclinado': { howTo: ['Banco a 25–40° (no 45°, eso ya es hombro).', 'Retrae las escápulas y baja al pecho superior.', 'Empuja recto sin chocar arriba; no bloquees del todo los codos.'] },
  'Press banca': { howTo: ['Escápulas atrás y pies firmes en el suelo.', 'Baja la barra al pecho medio con control; codos ~45°.', 'Empuja sin rebotar; no bloquees los codos del todo.'] },
  'Press plano mancuerna': { howTo: ['Escápulas atrás; mancuernas a la altura del pecho.', 'Baja hasta notar estiramiento, codos ~45°.', 'Empuja en diagonal hacia dentro, sin chocarlas.'] },
  'Aperturas': { howTo: ['Codos semiflexionados y fijos todo el recorrido.', 'Abre hasta estirar (brazos algo por detrás del hombro).', 'Junta apretando el pecho, sin chocar las mancuernas.'] },
  'Fondos': { howTo: ['Inclina el torso adelante para cargar más pecho.', 'Hombros bajos, cuerpo en "flecha"; baja con control.', 'Sube sin bloquear; descanso 1,5–2 min.'] },
  'Cruces en polea': { howTo: ['Poleas altas; ligera inclinación al frente.', 'Codos semiflexionados fijos; junta abajo apretando.', 'Tensión constante: controla la vuelta.'] },
  'Press declinado': { howTo: ['Banco declinado; baja al pecho inferior.', 'Codos ~45°, control en la bajada.', 'Alternativa "amable" a los fondos.'] },
  'Press Larson': { howTo: ['Como el press banca pero con las piernas en el banco (sin empuje de piernas).', 'Aísla más pecho/hombro/tríceps; agarre algo cerrado = más recorrido.', 'Tempo controlado 1–2 s; suele hacerse a ~75% de tu top set.'] },
  // Hombro
  'Press militar': { howTo: ['Nunca bloquees los codos arriba del todo.', 'De pie: escápulas atrás, pecho fuera, rodillas algo flexionadas.', 'Respaldo poco inclinado (más = se vuelve pecho).'] },
  'Elevaciones laterales': { howTo: ['Sube hasta la línea de los hombros, codos algo flexionados.', 'Lidera con el codo, no con la mano.', 'Baja lento; mejor sentado/apoyado para no balancear.'] },
  'Pájaros': { howTo: ['Pecho apoyado o torso inclinado.', 'Brazos algo flexionados; abre en forma de "T".', 'Aprieta el deltoides posterior, sin tirar de trapecio.'] },
  'Press hombro en máquina': { howTo: ['Ajusta el asiento: agarres a la altura de los hombros.', 'Empuja sin bloquear; bajada controlada.', 'Ideal si tienes hombros delicados.'] },
  'Press militar con barra': { howTo: ['Barra desde las clavículas; aprieta glúteos y core.', 'Cabeza algo atrás para dejar pasar la barra.', 'Sube en línea recta; no arquees la lumbar.'] },
  'Elevaciones laterales en polea': { howTo: ['Polea a la altura de la cadera, ángulo 90° brazo-cable.', 'Tensión constante incluso en la parte baja.', 'Rango amplio; leve inclinación del torso.'] },
  'Aperturas inversas': { howTo: ['Máquina: brazos en "T", resistencia constante.', 'Aprieta el deltoides posterior.', 'Controla la vuelta.'] },
  'Press Arnold': { howTo: ['Empieza con las palmas hacia ti y gíralas a la vez que subes.', 'Aprieta glúteos y empuja con los talones (como un press militar).', 'Trabaja anterior + lateral; 8–10 reps cargando con cabeza.'] },
  'Elevación en Y en polea': { howTo: ['Cruza el brazo por delante del cuerpo abajo (estira el deltoides).', 'Sube en diagonal hacia fuera y arriba (forma de "Y"), no al frente.', 'Como "desenvainar una espada": tirón lateral, no elevación frontal.'] },
  // Tríceps
  'Press francés': { howTo: ['Codos quietos apuntando arriba.', 'Baja la barra a la frente/detrás con control.', 'Extiende sin abrir los codos.'] },
  'Extensión tríceps polea': { howTo: ['Cuerpo recto, brazos pegados al torso.', 'Extiende abajo y aguanta; muñecas rectas.', 'Trabaja las cabezas lateral y media.'] },
  'Extensión tríceps sobre la cabeza': { howTo: ['Polea a la cintura; da un paso adelante e inclina.', 'Codos juntos en "V", rango amplio.', 'Enfatiza la cabeza larga.'] },
  'Patada de tríceps': { howTo: ['Codo fijo detrás del cuerpo, brazo en "V".', 'Solo mueve el antebrazo; torso quieto.', 'Aprieta arriba.'] },
  'Extensión tríceps unilateral': { howTo: ['Mancuerna sentado o polea; tensión en la negativa.', 'Solo se mueve el antebrazo.', 'Rango completo, control.'] },
  // Espalda
  'Jalón al pecho': { howTo: ['Tira llevando los codos a los dorsales, no con los brazos.', 'Agarre medio/neutro; baja la barra al pecho alto.', '"Baja la barra", no "súbete tú"; controla la subida.'] },
  'Remo mancuerna': { howTo: ['Codo pegado al torso, negativa lenta.', 'Recorrido completo; no te pares a la mitad.', 'Torso estable, sin balanceo.'] },
  'Remo barra': { howTo: ['Torso a 30–45°, lumbar dentro (sin "modo trucha").', 'Lleva la barra al abdomen; codos en flecha.', 'Sin balanceo.'] },
  'Dominadas': { howTo: ['Misma técnica que el jalón: codos a las costillas.', 'Recorrido completo: estira abajo, pecho a la barra.', 'Core en tensión, no cruces las piernas.'] },
  'Remo Gironda': { howTo: ['Agarre cerrado/neutro; lleva al ombligo en horizontal.', 'Codos pegados; saca pecho al final.', 'Dorso recto.'] },
  'Pullover': { howTo: ['Estira los dorsales arriba con control.', 'Codos semifijos; lleva la mancuerna por encima.', 'Siente el estiramiento.'] },
  'Encogimiento de hombros': { howTo: ['Sube los hombros recto (sin rotar).', 'Ligera inclinación adelante; manos algo separadas.', 'Aprieta el trapecio arriba.'] },
  'Face pull': { howTo: ['Polea a la cara; tira llevando los codos atrás.', 'Brazos rectos (sin rotación) para alinear la fuerza.', 'Aprieta el deltoides posterior.'] },
  'Encogimientos de Kelso': { howTo: ['En remo con apoyo de pecho: retrae las escápulas.', 'Bloquea codos y mueve solo los omóplatos.', 'Para el trapecio medio.'] },
  'Dominadas escapulares': { howTo: ['Cuelga y deprime las escápulas (hombros lejos de las orejas).', 'Sin doblar codos; mueve solo los omóplatos.', 'Trapecio inferior y control escapular.'] },
  // Bíceps
  'Curl bíceps': { howTo: ['De pie, sin balanceo; bajada controlada.', 'Arco ligero hacia delante.', 'Supinación completa (palma arriba).'] },
  'Curl inclinado': { howTo: ['Brazo por detrás del cuerpo → cabeza larga.', 'Mantén la supinación desde el inicio.', 'Estira abajo, control.'] },
  'Curl concentrado': { howTo: ['Codo clavado (brazo por delante → cabeza corta).', 'Bajada lenta, sin balanceo.', 'Aprieta arriba.'] },
  'Curl martillo': { howTo: ['Agarre neutro → braquial (engorda el brazo).', 'Arco hacia delante, brazos rectos.', 'Bajada controlada.'] },
  'Curl predicador': { howTo: ['Brazo apoyado por delante; no despegues el codo.', 'Estira abajo con control.', 'Barra Z si te molesta la muñeca.'] },
  'Curl Bayesiano': { howTo: ['En polea, brazo por detrás del cuerpo → cabeza larga.', 'Tensión constante; supina desde el inicio.', 'Estira en el punto bajo.'] },
  // Pierna
  'Sentadilla': { howTo: ['Profunda (más rango = más glúteo).', 'Rodillas siguen la punta de los pies; core firme.', 'Principiante: hack o prensa, más estables.'] },
  'Hack squat': { howTo: ['Espalda apoyada; baja profundo.', 'Rodillas hacia las puntas.', 'Empuja con todo el pie.'] },
  'Prensa': { howTo: ['Pies a la anchura de hombros; baja con control.', 'No bloquees las rodillas arriba.', 'No despegues la lumbar del respaldo.'] },
  'Peso muerto rumano': { howTo: ['Enfoca isquios: estira en la bajada.', 'Barra cerca de las piernas; caderas atrás.', 'Sube empujando las caderas; lumbar neutra.'] },
  'Curl femoral': { howTo: ['Aísla isquios; rango completo.', 'Aprieta arriba, baja lento.', 'No arquees la lumbar.'] },
  'Extensión cuádriceps': { howTo: ['Sube y aprieta el cuádriceps arriba.', 'Bajada controlada.', 'Ajusta el respaldo a tu rodilla.'] },
  'Zancadas': { howTo: ['Baja lento, cuida la alineación de la rodilla.', 'Paso largo = más glúteo.', 'Elige la variante donde controles el equilibrio.'] },
  'Sentadilla búlgara': { howTo: ['Pie trasero elevado; baja recto.', 'Torso algo inclinado = más glúteo.', 'Controla el equilibrio.'] },
  'Gemelo de pie': { howTo: ['Superficie elevada para más rango.', 'Sube y aprieta arriba; baja estirando.', 'Puntas rectas por defecto.'] },
  // Glúteo
  'Hip thrust': { howTo: ['Piernas a ≤90°, pies planos, torso recto.', 'Aprieta los glúteos arriba; core en tensión.', 'No curves la lumbar. Progresa subiendo peso (5–15 reps).'] },
  'Hip thrust en máquina': { howTo: ['Cinturón sobre la cadera; pies planos.', 'Empuja con los talones y aprieta el glúteo arriba.', 'Más cómodo y estable que con barra; gran progresión de peso.'] },
  'Hip thrust unilateral': { howTo: ['Una pierna; controla el equilibrio (enfatiza el glúteo superior).', '12–15 reps por lado, sin ir pesado.', 'Corrige descompensaciones izquierda/derecha.'] },
  'Subida al cajón': { howTo: ['Cajón a la altura de la rodilla o algo más alto.', 'Sube empujando con el talón, sin impulso de la otra pierna.', 'Inclínate algo al frente para cargar más glúteo que cuádriceps.'] },
  'Hiperextensión 45°': { howTo: ['Extiende la cadera; redondea un poco la espalda alta para sentir el glúteo.', 'Aprieta arriba sin hiperextender la lumbar.', 'Progresa con reps o sujetando un disco al pecho.'] },
  'Puente de glúteo': { howTo: ['En el suelo; aprieta los glúteos arriba.', 'Core firme; no arquees la lumbar.', 'En casa: con mancuerna sobre la cadera.'] },
  'Patada de glúteo': { howTo: ['En polea: patada en diagonal/abducción (no vertical).', 'Estabiliza el torso.', 'Aprieta el glúteo arriba.'] },
  'Abducción de cadera': { howTo: ['Máquina; inclina el torso algo adelante para estirar.', 'Trabaja en el rango 90–45°.', 'Control en la vuelta.'] },
  // Core
  'Crunch': { howTo: ['Recorrido completo: acerca las costillas a las caderas.', 'Flexiona la columna, no tires del cuello.', 'Añade peso para progresar.'] },
  'Elevación de piernas': { howTo: ['Sube las piernas con control, sin balanceo.', 'Mantén el core en tensión.', 'Colgado o tumbado.'] },
  'Rotación de torso': { howTo: ['Trabaja oblicuos; gira desde el tronco.', 'Control, sin tirones.', 'Mantén la cadera estable.'] },
  'Plancha': { howTo: ['Cuerpo recto, glúteos y core apretados.', 'No hundas la cadera.', 'Respira y aguanta el tiempo objetivo.'] },
  // Antebrazo
  'Colgarse en barra': { howTo: ['Cuelga al fallo técnico (cuando se rompe la postura).', '2–3 series, descanso >2 min, al final de la rutina.', 'Cuando aguantes >1 min, añade peso.'] },
  'Curl de muñeca': { howTo: ['Antebrazo apoyado; flexiona solo la muñeca.', 'Reps altas (12–20), recorrido corto.', 'Control arriba y abajo.'] },
  'Curl inverso': { howTo: ['Agarre prono (pronación) → braquiorradial.', 'Reps altas; poco descanso.', 'Muñecas firmes.'] },
  'Extensión de muñeca': { howTo: ['Antebrazo apoyado; extiende la muñeca.', 'Reps altas (12–20).', 'Control en la vuelta.'] },
};

export function exerciseInfo(name: string): ExerciseInfo | null {
  return EXERCISE_INFO[name] ?? null;
}
