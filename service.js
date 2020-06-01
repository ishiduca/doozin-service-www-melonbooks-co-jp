var url = require('url')
var xtend = require('xtend')
var trumpet = require('trumpet')
var inherits = require('inherits')
var urlencode = require('urlencode')
var { through, duplex, concat } = require('mississippi')
var DoozinService = require('@ishiduca/doozin-service')

function DoozinServiceWwwMelonbooksCoJp () {
  if (!(this instanceof DoozinServiceWwwMelonbooksCoJp)) {
    return new DoozinServiceWwwMelonbooksCoJp()
  }

  var origin = 'https://www.melonbooks.co.jp'
  var searchHome = origin + '/search/search.php'
  var hyperquest = xtend(
    DoozinService.defaultConfig.hyperquest, { origin, searchHome }
  )
  var config = xtend(DoozinService.defaultConfig, { hyperquest })

  DoozinService.call(this, config)
}

inherits(DoozinServiceWwwMelonbooksCoJp, DoozinService)
module.exports = DoozinServiceWwwMelonbooksCoJp

DoozinServiceWwwMelonbooksCoJp.prototype.createURI = function (params) {
  var { category, value, opts } = params
  var maps = {
    mak: 'circle',
    act: 'author',
    nam: 'title',
    mch: 'chara',
    gnr: 'genre',
    kyw: 'tag',
    com: 'detail'
  }
  var query = xtend({
    mode: 'search',
    search_disp: '',
    chara: '',
    orderby: 'date',
    disp_number: 200,
    pageno: 1,
    fromagee_flg: 2,
    text_type: 'all',
    // search_target: 0,
    product_type: 'all',
    'is_end_of_sale[]': 1,
    is_end_of_sale2: 1,
    'category_ids[]': 1
  }, {
    text_type: maps[category],
    name: value
  }, opts)

  return this.config.hyperquest.searchHome + '?' +
    urlencode.stringify(query, this.config.urlencode)
}

DoozinServiceWwwMelonbooksCoJp.prototype.createOpts = function (params) {
  return xtend({
    method: this.config.hyperquest.method,
    headers: xtend(this.config.hyperquest.headers)
  })
}

DoozinServiceWwwMelonbooksCoJp.prototype.scraper = function () {
  var tr = trumpet()
  var rs = through.obj()

  var isBingo = false
  var i = 0

  var mid = through.obj()
  mid.on('pipe', s => (i += 1))
  mid.on('unpipe', s => ((i -= 1) || mid.end()))
  mid.pipe(rs)

  var selector = 'div[class="product clearfix"]>.relative'
  tr.selectAll(selector, div => {
    isBingo = true

    var links = []
    var snk = through.obj()
    var src = through.obj()
    src.pipe(mid, { end: false })
    snk.pipe(concat(x => src.end(x.reduce((a, b) => xtend(a, b), {}))))

    var tr = trumpet()
    tr.select('.thumb>a', a => {
      a.getAttribute('href', h => {
        var urlOfTitle = this.config.hyperquest.origin + h
        snk.write({ urlOfTitle })
      })
      a.getAttribute('title', title => {
        snk.write({ title })
      })
    })

    tr.select('.thumb>a>img', img => {
      img.getAttribute('data-src', src => {
        var conf = this.config.urlencode
        snk.write({ srcOfThumbnail: _srcOfThumbnail(src, conf) })
      })
    })

    tr.selectAll('div.title>p.circle>a', a => {
      a.getAttribute('href', h => {
        var href = this.config.hyperquest.origin + h
        a.getAttribute('title', text => {
          links.push({ href, text, circle: true })
        })
      })
    })

    tr.selectAll('div.title>p.author>a', a => {
      a.getAttribute('href', h => {
        var href = this.config.hyperquest.origin + h
        a.getAttribute('title', text => {
          links.push({ href, text, author: true })
        })
      })
    })

    div.createReadStream().pipe(tr).once('end', () => snk.end({ links }))
  })

  tr.once('end', () => isBingo || mid.end())

  return duplex.obj(tr, rs)
}

function _srcOfThumbnail (str, config) {
  var uri = 'https:' + str
    .replace(/^\*/, '')
    .replace(/&amp;/g, '&')
    .replace(/&?c=\d/, '')
    .replace(/&?aa=\d/, '')
    .replace(/&$/, '')

  var u = url.parse(uri, true)
  var width = 319
  var height = 450
  return u.protocol + '//' + u.host + u.pathname + '?' +
    urlencode.stringify(xtend(u.query, { width, height }), config)
}
