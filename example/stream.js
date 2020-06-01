var { pipe, concat } = require('mississippi')
var Service = require('../service')
var s = new Service
var request = {
  category: 'act',
  value: 'あんこまん'
}
pipe(
  s.createStream(request),
  concat(results => {
    console.log(JSON.stringify({ results, request }))
  }),
  error => {
    error && console.error(error)
  }
)
