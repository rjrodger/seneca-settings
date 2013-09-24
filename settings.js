/* Copyright (c) 2013 Richard Rodger, MIT License */
"use strict";


var _       = require('underscore')
var async   = require('async')
var connect = require('connect')



module.exports = function( options ) {
  var seneca = this
  var plugin = 'settings'


  seneca.depends(plugin,[
    'user'
  ])


  options = seneca.util.deepextend({
    default_data:{},
    prefix: '/settings',
    web:true
  },options)
  



  var settingsent = seneca.make$( 'sys/settings' )
  var userent     = seneca.make$( 'sys/user' )


  // actions provided
  seneca.add( {role:plugin, cmd:'load'},     
              {user:'object$'}, 
              cmd_load_settings )

  seneca.add( {role:plugin, cmd:'save'},     
              {user:'object$'}, 
              cmd_save_settings )


  seneca.add( {role:plugin, cmd:'define_spec'},     
              {kind:'string$,required$',spec:'object$,required$'}, 
              cmd_define_spec )


  seneca.add( {role:plugin, cmd:'spec'},     
              {kind:'string$,required$'}, 
              cmd_spec )



  // resolve entity args by id
  seneca.act({
    role:   'util',
    cmd:    'ensure_entity',
    pin:    { role:plugin, cmd:'*' },
    entmap: {
      user: userent,
    }
  })
  


  function clean( settings ) {
    if( !settings ) return null;

    var out = settings.data$()
    delete out.id
    delete out.user

    return out
  }


  function cmd_load_settings( args, done ) {
    settingsent.load$({kind:'user',user:args.user.id}, function( err, settings ){
      if( err ) return done(err);
      var data = (settings && settings.data) || options.default_data
      done( null, { ok:true, settings: data } )
    })
  }


  function cmd_save_settings( args, done ) {
    settingsent.load$({kind:'user',user:args.user.id}, function( err, settings ){
      if( err ) return done(err);
      
      if( !settings ) {
        settings = settingsent.make$({kind:'user',user:args.user.id})
      }
      
      settings.data = _.extend( options.default_data, settings.data, args.data )
      settings.save$( function(err, out){
        if( err ) return done(err);
        done( null, { ok:true, settings: out.data } )
      })
    })
  }


  function cmd_define_spec( args, done ) {
    // NOTE: spec field stores kind, top level kind == 'spec', as these are a type of setting
    settingsent.load$({kind:'spec',spec:args.kind}, function( err, settings ){
      if( err ) return done(err);

      if( !settings ) {
        settings = settingsent.make$( {kind:'spec',spec:args.kind,data:args.spec} )
      }
      else {
        settings.data = _.extend( settings.data, args.spec ) 
      }

      settings.save$( function(err,settings){
        if( err ) return done(err);

        done( null, {ok:true, kind:args.kind, spec:settings.data})
      })
    })
  }


  function cmd_spec( args, done ) {
    settingsent.load$( {kind:'spec', spec:args.kind}, function(err,settings){
      if( err ) return done(err);

      if( !settings ) return done(null,{ok:false});
      done(null,{ok:true, kind:args.kind, spec:settings.data})
    })
  }



  function buildcontext( req, res, args, act, respond ) {
    var user = req.seneca && req.seneca.user
    if( user ) {
      args.user = user
    }

    act(args,respond)
  }


  var app = connect()
  app.use(connect.static(__dirname+'/web'))


  // web interface
  seneca.act_if(options.web, {role:'web', use:{
    prefix:options.prefix,
    pin:{role:plugin,cmd:'*'},
    map:{
      spec: { GET:buildcontext },
      load: { GET:buildcontext },
      save: { POST:buildcontext, data:true }
    },

    
    endware: function( req, res, next ) {
      if( 0 != req.url.indexOf(options.prefix) ) return next();

      req = _.clone(req)
      req.url = req.url.substring(options.prefix.length)


      if(''===req.url) {
        res.writeHead(301, {
          'Location': options.prefix+'/'
        })
        return res.end()
      }

      return app(req,res,next)
    }
  }})




  // define sys/settings entity
  seneca.add({init:plugin}, function( args, done ){
    seneca.act('role:util, cmd:define_sys_entity', {list:[settingsent.canon$()]})
    done()
  })


  return {
    name: plugin
  }
}
