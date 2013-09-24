

var connect = require('connect')


var seneca = require('seneca')()
var app    = connect()


app.use( connect.query() )

seneca.use('mem-store',{web:{dump:true}})
seneca.use('user')
seneca.use(function(){
  this.act({role:'web',use:function(req,res,next){
    req.seneca.user = req.user
    next()
  }})
})
seneca.use('..')

seneca.ready( function(err){
  if( err ) process.exit( console.error(err) && 1 );

  seneca.act('role:user, cmd:register, nick:n1', function(err,out){
    if( err ) process.exit( console.error(err) && 1 );

    seneca.act('role:settings, cmd:define_spec, kind:user, spec:{foo:"string"}')
    seneca.act('role:settings, cmd:save, kind:user, data:{foo:"aaa"}, user:"'+out.user.id+'"')

    app.use( function(req,res,next){
      req.user = out.user

      res.send = function(obj) {
        res.writeHead(200)
        res.end(JSON.stringify(obj))
      }

      next()
    })

    app.use( seneca.export('web') )

    app.listen(8888)
  })
})

