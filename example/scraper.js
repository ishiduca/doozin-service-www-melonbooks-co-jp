var fs = require('fs')
var path = require('path')
var { pipe, through } = require('mississippi')
var Service = require('../service')

var s = new Service()

pipe(
  fs.createReadStream(path.join(__dirname, 'result.html')),
  s.scraper(),
  through.obj((res, _, done) => {
    console.log(res)
    done()
  }),
  error => {
    console.log(error || 'END')
  }
)
