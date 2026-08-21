/**
 * Regras de negocio: tecnicas de mega hair e intervalo ideal de manutencao.
 */
export type TechniqueId = 'fita_adesiva' | 'ponto_americano' | 'queratina' | 'microesferas';

export type Technique = {
  id: TechniqueId;
  label: string;
  /** Dias entre a ultima aplicacao e o retorno ideal. */
  maintenanceDays: number;
};

export const TECHNIQUES: Technique[] = [
  { id: 'fita_adesiva', label: 'Fita Adesiva', maintenanceDays: 45 },
  { id: 'ponto_americano', label: 'Ponto Americano', maintenanceDays: 60 },
  { id: 'queratina', label: 'Queratina', maintenanceDays: 90 },
  { id: 'microesferas', label: 'Microesferas', maintenanceDays: 60 },
];

export const TECHNIQUE_BY_ID: Record<TechniqueId, Technique> = TECHNIQUES.reduce(
  (acc, technique) => ({ ...acc, [technique.id]: technique }),
  {} as Record<TechniqueId, Technique>
);

/** Faltando 10 dias ou menos para o retorno, a cliente entra em "Proximo". */
export const SOON_THRESHOLD_DAYS = 10;
