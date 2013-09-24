/* Copyright (c) 2013 Richard Rodger, MIT License */
"use strict";


var _     = require('underscore')
var async = require('async')



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
              load_settings )

  seneca.add( {role:plugin, cmd:'save'},     
              {user:'object$'}, 
              save_settings )



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


  function load_settings( args, done ) {
    settingsent.load$({kind:'user',user:args.user.id}, function( err, settings ){
      if( err ) return done(err);
      var data = (settings && settings.data) || options.default_data
      done( null, { ok:true, settings: data } )
    })
  }


  function save_settings( args, done ) {
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



  function buildcontext( req, res, args, act, respond ) {
    var user = req.seneca && req.seneca.user
    if( user ) {
      args.user = user
    }

    act(args,respond)
  }



  // web interface
  seneca.act_if(options.web, {role:'web', use:{
    prefix:options.prefix,
    pin:{role:plugin,cmd:'*'},
    map:{
      load: { GET:buildcontext },
      save: { POST:buildcontext }
    },
    endware: function( req, res, next ) {
      
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
