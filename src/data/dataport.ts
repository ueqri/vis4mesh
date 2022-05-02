import { DataPortMetaResponse } from "./data";
import { DataPortFlatResponse } from "./data";
import { DataPortRangeResponse } from "./data";

export default abstract class DataPort {
  constructor(/*uri: string*/) {} // argument constrain for DataPort

  abstract init(): Promise<DataPortMetaResponse>;
  abstract flat(): Promise<DataPortFlatResponse>;
  abstract range(start: number, end: number): Promise<DataPortRangeResponse>;
}
