import {TickFormatter} from "./tick_formatter"
import {Axis} from "../axes/axis"

export namespace CategoricalTickFormatter {
  export interface Attrs extends TickFormatter.Attrs {}

  export interface Props extends TickFormatter.Props {}
}

export interface CategoricalTickFormatter extends CategoricalTickFormatter.Attrs {}

export class CategoricalTickFormatter extends TickFormatter {

  properties: CategoricalTickFormatter.Props

  constructor(attrs?: Partial<CategoricalTickFormatter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'CategoricalTickFormatter'
  }

  doFormat(ticks: string[], _axis: Axis): string[] {
    return ticks
  }
}
CategoricalTickFormatter.initClass()
