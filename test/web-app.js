var connect = require('connect')

var seneca = require('seneca')()
var app = connect()

app.use(connect.query())
app.use(connect.json())

seneca.use('mem-store', {web: {dump: true}})
seneca.use('user')
seneca.use(function () {
  this.act({role: 'web', use: function (req, res, next) {
    req.seneca.user = req.user
    next()
  }})
})
seneca.use('..')

seneca.ready(function (err) {
  if (err) return process.exit(!console.error(err))

  seneca.act('role:user, cmd:register, nick:n1', function (err, out) {
    if (err) return process.exit(!console.error(err))

    seneca.act('role:settings, cmd:define_spec, kind:user', {spec: {
      a: {'type': 'text', 'nice': 'A', 'help': 'Example of text.'},
      b: {'type': 'email', 'nice': 'B', 'help': 'Example of email.'},
      c: {'type': 'tel', 'nice': 'C', 'help': 'Example of tel.'},
      d: {'type': 'number', 'nice': 'D', 'help': 'Example of number.'},
      e: {'type': 'time', 'nice': 'E', 'help': 'Example of time.'},
      f: {'type': 'date', 'nice': 'F', 'help': 'Example of date.'},
      g: {'type': 'datetime', 'nice': 'G', 'help': 'Example of datetime.'},
      h: {'type': 'color', 'nice': 'H', 'help': 'Example of color.'},
      i: {'type': 'url', 'nice': 'I', 'help': 'Example of url.'},
      j: {'type': 'checkbox', 'nice': 'J', 'help': 'Example of checkbox.'},
      k: {'type': 'range', 'nice': 'K', 'help': 'Example of range.', 'default': 50},
      l: {'type': 'rating', 'nice': 'L', 'help': 'Example of rating.', 'stars': 6},
      ll: {'type': 'rating', 'nice': 'LL', 'help': 'Example of rating.'},
      m: {'type': 'yesno', 'nice': 'M', 'help': 'Example of yesno.'},
      n: {'type': 'onoff', 'nice': 'N', 'help': 'Example of onoff slider.', 'default': 0},
      o: {'type': 'buttons', 'nice': 'O', 'help': 'Example of selectbuttons.', 'options': ['foo', 'bar', 'baz']},
      p: {'type': 'dropdown', 'nice': 'P', 'help': 'Example of selectdropdown.', 'options': ['foo', 'bar', 'baz']},
      q: {'type': 'dropdownplus', 'nice': 'Q', 'help': 'Example of selectdropdownplus.', 'options': ['foo', 'bar', 'baz']},
      r: {'type': 'longtext', 'nice': 'R', 'help': 'Example of longtext.'},
      s: {'type': 'radio', 'nice': 'S', 'help': 'Example of radio.', 'options': ['foo', 'bar', 'baz']}
    }})
    seneca.act('role:settings, cmd:save, kind:user, settings:{a:"aaa",s:"foo"}, ref:"' + out.user.id + '"')

    app.use(function (req, res, next) {
      req.user = out.user

      res.send = function (obj) {
        res.writeHead(200)
        res.end(JSON.stringify(obj))
      }

      next()
    })

    app.use(seneca.export('web'))

    app.listen(8888)
  })
})
