export abstract class ArgumentObject {
  public abstract compile(): string;
  public toString(): string {
    return this.compile();
  }
}

export type Argument = ArgumentObject | string;

export * from "./entity";
export * from "./nbt";
export * from "./selector";
export * from "./util";
export * from "./value";
