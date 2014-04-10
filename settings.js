/* Copyright (c) 2013-2014 Richard Rodger, MIT License */
"use strict";


var util = require('util')

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


  // "load-command"
  seneca.add({
    role:plugin, 
    cmd:'load',

    ref:{required$:true},
    kind:{required$:true,string$:true},

  }, cmd_load_settings )


  // "save-command"
  seneca.add({
    role:plugin, 
    cmd:'save',

    ref:{required$:true},
    kind:{required$:true,string$:true},

  }, cmd_save_settings )


  // "define-spec-command"
  seneca.add({
    role:plugin, 
    cmd:'define_spec',
     
    kind: {required$:true}

  }, cmd_define_spec )


  // "spec-command"
  seneca.add({
    role:plugin, 
    cmd:'spec',
    
    kind: {required$:true}

  }, cmd_spec )


  /// "resolve-args"
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
    delete out.ref

    return out
  }


  /// "cmd_load_settings"
  function cmd_load_settings( args, done ) {
    settingsent.load$( {kind:args.kind, ref:args.ref}, function( err, settings ) {
      if( err ) return done(err);

      var data = (settings && settings.settings) || options.default_data
      done( null, { ok:true, settings: data } )
    })
  }


  /// "cmd_save_settings"
  function cmd_save_settings( args, done ) {
    settingsent.load$( {kind:args.kind, ref:args.ref}, function( err, settings ) {
      if( err ) return done(err);
      
      if( !settings ) {
        settings = settingsent.make$( {kind:args.kind, ref:args.ref} )
      }
      
      settings.settings = _.extend( {}, options.default_data, settings.settings, args.settings )

      settings.save$( function(err, out){
        if( err ) return done(err);
        done( null, { ok:true, settings: out.settings } )
      })
    })
  }


  var valid_setting_types = {
    "rating" : "Star rating.",
    "yesno" : "Yes or no buttons.",
    "onoff" : "An on/off slider.",
    "text" : "Single line text.",
    "email" : "Email address.",
    "tel" : "Phone number.",
    "number" : "Small numeric value.",
    "time" : "Time.",
    "date" : "Date.",
    "datetime" : "Date with time.",
    "color" : "Color.",
    "url" : "A url.",
    "range" : "Range/slider.",
    

    "checkbox" : "A checkbox.",
    
    "buttons" : "Pre-defined selection, chosen by buttons.",
    "dropdown" : "Pre-defined selection, chosen by drop-down.",
    "dropdownplus" : "Pre-defined selection, chosen by drop-down, with option for user-provided text.",
    
    "longtext" : "Multi line text.",

    "radio" : "A set of radio buttons.",
  }


  // FIX: needs to use seneca.fail and callbacks
  function validate_spec(spec) {
    for (var spec_name in spec) {
      var spec_type = spec[spec_name]['type'];
      if (!valid_setting_types.hasOwnProperty(spec_type)) {
        throw "invalid type '" + spec_type + "' for setting " + spec_name;
      }
    }
  }


  /// "cmd_define_spec"
  function cmd_define_spec( args, done ) {
    validate_spec(args.spec);

    // NOTE: spec field stores kind, top level kind == 'spec', as these are a type of setting
    settingsent.load$({kind:'spec',spec:args.kind}, function( err, settings ){
      if( err ) return done(err);

      if( !settings ) {
        settings = settingsent.make$( {kind:'spec',spec:args.kind,data:args.spec} )
      }
      else {
        settings.data = _.extend( {}, settings.data, args.spec ) 
      }

      settings.save$( function(err,settings){
        if( err ) return done(err);
        done( null, {ok:true, kind:args.kind, spec:settings.data})
      })
    })
  }


  /// "cmd_spec"
  function cmd_spec( args, done ) {
    settingsent.load$( {kind:'spec', spec:args.kind}, function(err,settings){
      if( err ) return done(err);

      if( !settings ) return done(null,{ok:false});
      done(null,{ok:true, kind:args.kind, spec:settings.data})
    })
  }


  /// "buildcontext"
  function buildcontext( req, res, args, act, respond ) {
    var kind = args.kind || 'user' // defaults to user settings

    var user = req.seneca && req.seneca.user
    if( user ) {
      if( 'account' == args.kind ) {
        args.ref = args.account || user.accounts[0]
      }
      else args.ref = user.id;
    }

    if( args.data ) {
      args.settings = args.data
    }

    act(args,respond)
  }


  /// "connect"
  var app = connect()
  app.use(connect.static(__dirname+'/web'))


  /// "web-interface"
  seneca.act_if(options.web, {role:'web', use:{
    prefix:options.prefix,
    pin:{role:plugin,cmd:'*'},

    /// "map"
    map:{
      spec: { GET:buildcontext },
      load: { GET:buildcontext },
      save: { POST:buildcontext, data:true }
    },

    /// @end
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
  /// @end




  // define sys/settings entity
  seneca.add({init:plugin}, function( args, done ){
    seneca.act('role:util, cmd:define_sys_entity', {list:[settingsent.canon$()]})
    done()
  })


  return {
    name: plugin
  }
}
