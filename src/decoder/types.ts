export type FieldResult = {
  position: string;
  fieldDe: string;
  fieldEn: string;
  rawCode: string;
  found: boolean;
  valueDe?: string;
  valueEn?: string;
  extra?: Record<string, unknown>;
};

export type DecodedNumber = {
  input: string;
  normalized: string;
  valid: boolean;
  warnings: string[];
  errors: string[];
  fields: {
    productType: FieldResult;
    connectionType: FieldResult;
    pressure: FieldResult;
    size: FieldResult;
    screwMaterial: FieldResult;
    bodyMaterial: FieldResult;
    medium: FieldResult;
    handwheelCap: FieldResult;
    connectionDetails: FieldResult;
    suffix: FieldResult;
  };
};

export type Tokens = {
  pos1to3: string;
  pos4to5: string;
  pos6: string;
  pos7to8: string;
  pos9: string;
  pos10: string;
  pos11: string;
  pos12: string;
  pos13to16: string;
};
