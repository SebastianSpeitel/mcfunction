import { mkdirIfNotExist } from "./utility";
import fs from "fs";
import pth from "path";
import { Command } from "./commands";
import { Readable, pipeline as pipeline_ } from "stream";
import { promisify } from "util";
import { Transpiler } from "./transpiler";
const pipeline = promisify(pipeline_);

interface OptionsName {
  commands: Iterable<Command>;
}
interface OptionsSource {
  name?: string;
}

function isIterable<T = any>(iter: any): iter is Iterable<T> {
  return typeof iter[Symbol.iterator] === "function";
}

export class McFunction {
  readonly commands: Set<Command>;
  readonly name: string;
  dependencies = new Set<McFunction>();

  constructor(name: string, opts?: OptionsName);
  constructor(name: string, cmds?: Iterable<Command>);
  constructor(source: () => void, opts?: OptionsSource);
  constructor(
    nameOrSource: string | (() => void),
    optsOrCmds: Partial<OptionsName & OptionsSource> | Iterable<Command> = {}
  ) {
    if (Array.isArray(optsOrCmds) || isIterable(optsOrCmds)) {
      optsOrCmds = { commands: optsOrCmds };
    }

    if (typeof nameOrSource === "function") {
      this.name = nameOrSource.name;
      this.commands = new Set();

      const transpiler = new Transpiler();
      const { rootFunction: self, functions } = transpiler.transpile(
        nameOrSource,
        optsOrCmds.name
      );

      self.dependencies = new Set(functions.values());

      return self;
    }

    this.name = optsOrCmds.name ?? nameOrSource;
    this.commands = new Set(optsOrCmds.commands ?? []);
  }

  compile(): ReturnType<McFunction["generate"]>;
  compile(path: string): Promise<any>;
  compile(path?: string) {
    if (!path) {
      return this.generate();
    }

    const functionPath = pth.join(path, `${this.name}.mcfunction`);
    mkdirIfNotExist(pth.dirname(functionPath));
    const writeStream = fs.createWriteStream(functionPath);

    const compiling: Promise<any>[] = [];

    // pipeline accepts a generator, but typescript doesn't know that
    compiling.push(pipeline(Readable.from(this.generate()), writeStream));

    for (const sub of this.dependencies) {
      if (sub === this) continue;
      compiling.push(sub.compile(path));
    }

    return Promise.all(compiling);
  }

  private async *generate() {
    const deleteSubCommands = (cmd: Command) => {
      const cmds = cmd[Command.ARGUMENTS].filter(
        a => a instanceof Command
      ) as Command[];

      for (const c of cmds) {
        deleteSubCommands(c);
        this.commands.delete(c);
      }
    };

    this.commands.forEach(deleteSubCommands);

    for (const cmd of this.commands) {
      for await (const s of cmd.compile()) {
        yield s;
      }
      yield "\n";
    }
  }

  /**
   * Add a command to the function
   * @param {Command} command the command to be added
   * @deprecated pass the commands as an array to the constructor instead
   */
  addCommand(command: Command) {} // eslint-disable-line
  /**
   * Copies the function
   * @param {McFunction} funct the function to be copied
   * @returns {McFunction} a reference to the function
   * @deprecated This implementation only creates a shallow copy and copies aren't necessary anyways
   */
  static copy(funct: McFunction): McFunction {
    return funct;
  }

  /**
   * @deprecated Use the constructor instead
   */
  static from(source: () => void, opts: { name?: string } = {}) {
    return new McFunction(source, opts);
  }
}

export * from "./arguments";
export * from "./commands";
