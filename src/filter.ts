import * as pandoc from 'pandoc-filter'
const mjAPI: any = require('mathjax-node')

mjAPI.start()

function tex2svg(mn: string, inline: boolean) {
  return new Promise<string>(function(resolve, reject) {
    mjAPI.typeset(
      {
        math: mn,
        format: inline ? 'inline-TeX' : 'TeX',
        svg: true,
        speakText: false,
        linebreaks: false,
      },
      function(data: any) {
        if (data.error) reject(data.error)
        else resolve(data.svg)
      },
    )
  })
}

function wrap(s: string) {
  return `<p>${s}</p>`
}

interface Config {
  inlineSVG: boolean
}

function action(config: Config): pandoc.FilterAction {
  return async function(elt) {
    if (elt.t === 'Math') {
      const inline = elt.c[0].t != 'DisplayMath'
      const tex = elt.c[1]
      const svg = await tex2svg(tex, inline)
      if (config.inlineSVG) {
        return pandoc.RawInline('html', inline ? svg : wrap(svg))
      } else {
        const src =
          'data:image/svg+xml;charset=utf-8;base64,' +
          Buffer.from(svg).toString('base64')
        return pandoc.Image(['', [], []], [pandoc.Str(tex)], [src, ''])
      }
    } else {
      return undefined
    }
  }
}

export = function(config: Config) {
  pandoc.stdio(action(config))
}