export enum DisplayStyle {
  Normal, // by default
  Hidden,
  Highlight,
  Translucent,
}

export interface NodeDisplay {
  id: string;
  label?: string;
  detail: string;
}

export interface EdgeDisplay {
  source: string;
  target: string;
  weight?: number;
  label?: string;
  detail: string;
  style?: DisplayStyle;
}

export interface DataToDisplay {
  meta?: Object;
  nodes?: NodeDisplay[];
  edges?: EdgeDisplay[];
}
