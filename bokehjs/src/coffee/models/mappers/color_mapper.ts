import {Transform} from "../transforms/transform"
import {Factor} from "../ranges/factor_range"
import * as p from "core/properties"
import {Arrayable, Color} from "core/types"
import {map} from "core/util/arrayable"
import {isNumber} from "core/util/types"
import {color2hex} from "core/util/color"
import {is_little_endian} from "core/util/compat"

export namespace ColorMapper {
  export interface Attrs extends Transform.Attrs {
    palette: (number | string)[]
    nan_color: Color
  }

  export interface Props extends Transform.Props {}
}

export interface ColorMapper extends ColorMapper.Attrs {}

export abstract class ColorMapper extends Transform<Color> {

  properties: ColorMapper.Props

  constructor(attrs?: Partial<ColorMapper.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "ColorMapper"

    this.define({
      palette:   [ p.Any           ], // TODO (bev)
      nan_color: [ p.Color, "gray" ],
    })
  }

  protected _palette: Uint32Array
  protected _nan_color: number

  initialize(): void {
    super.initialize()
    this._palette       = this._build_palette(this.palette)
    this._nan_color     = this._convert_color(this.nan_color)
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.change, () => {
      this._palette = this._build_palette(this.palette)
    })
  }

  // TODO (bev) This should not be needed, everything should use v_compute
  v_map_screen(data: Arrayable<number> | Arrayable<Factor>): ArrayBuffer {
    const values = this._get_values(data, this._palette)
    const buf = new ArrayBuffer(data.length * 4)
    if (is_little_endian) {
      const color = new Uint8Array(buf)
      for (let i = 0, end = data.length; i < end; i++) {
        const value = values[i]
        const ind = i*4
        // Bitwise math in JS is limited to 31-bits, to handle 32-bit value
        // this uses regular math to compute alpha instead (see issue #6755)
        color[ind] = Math.floor((value/4278190080.0) * 255)
        color[ind+1] = (value & 0xff0000) >> 16
        color[ind+2] = (value & 0xff00) >> 8
        color[ind+3] =  value & 0xff
      }
    } else {
      const color = new Uint32Array(buf)
      for (let i = 0, end = data.length; i < end; i++) {
        const value = values[i]
        color[i] = (value << 8) | 0xff // alpha
      }
    }
    return buf
  }

  compute(_x: number): never {
    // If it's just a single value, then a color mapper doesn't
    // really make sense, so return nothing
    return null as never
  }

  v_compute(xs: Arrayable<number> | Arrayable<Factor>): Arrayable<Color> {
    const  values = this._get_values(xs, this._palette)
    return map(values, (v) => "#" + v.toString(16).slice(0, 6))
  }

  protected abstract _get_values(data: Arrayable<number> | Arrayable<Factor>, palette: Float32Array): Arrayable<number>

  protected _convert_color(color: number | string): number {
    if (isNumber(color))
      return color
    else {
      if (color.length > 0 && color[0] != "#")
        color = color2hex(color)
      if (color.length != 9)
        color = color + 'ff'
      return parseInt(color.slice(1), 16)
    }
  }

  protected _build_palette(palette: (number | string)[]): Uint32Array {
    const new_palette = new Uint32Array(palette.length)
    for (let i = 0, end = palette.length; i < end; i++) {
      new_palette[i] = this._convert_color(palette[i])
    }
    return new_palette
  }
}
ColorMapper.initClass()
