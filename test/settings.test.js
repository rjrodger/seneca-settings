/* Copyright (c) 2013-2014 Richard Rodger */
"use strict";

// mocha settings.test.js

var util = require('util')

var seneca  = require('seneca')

var assert  = require('chai').assert

var async   = require('async')
var _       = require('underscore')




function cberr(win){
  return function(err){
    if(err) {
      assert.fail(err, 'callback error')
    }
    else {
      win.apply(this,Array.prototype.slice.call(arguments,1))
    }
  }
}




var si = seneca()
si.use( 'user' )
si.use( '..', {default_data:{a:1}} )

var userpin     = si.pin({role:'user',cmd:'*'})
var settingspin = si.pin({role:'settings',cmd:'*'})


describe('settings', function() {
  
  it('happy', function() {
    var tmp = {}
    
    async.series({
      register_users: function(cb){
        userpin.register({name:'N1',nick:'n1'},cberr(function(out){
          tmp.n1 = out.user.id
          cb()
        }))
      },

      default_settings: function(cb){
        settingspin.load({kind:'user',ref:tmp.n1},cberr(function(out){
          assert.equal( 1, out.settings.a )

          cb()
        }))
      },


      save_settings: function(cb){
        settingspin.save({kind:'user',ref:tmp.n1,settings:{b:2}},cberr(function(out){
          assert.isNotNull(out)
          assert.equal( 1, out.settings.a )
          assert.equal( 2, out.settings.b )

          cb()
        }))
      },


      load_settings: function(cb){
        settingspin.load({kind:'user',ref:tmp.n1},cberr(function(out){
          assert.isNotNull(out)
          assert.equal( 1, out.settings.a )
          assert.equal( 2, out.settings.b )

          cb()
        }))
        
      },

    })
  })


  it('define-spec', function(){
    async.series({
      define: function(cb){
        settingspin.define_spec({kind:'foo',spec:{q:{type:'number'}}}, function(err,out){
          assert.isNull(err)
          assert.isNotNull(out)
          assert.ok(out.ok)
          assert.equal( 'foo', out.kind )
          assert.equal( "{ type: 'number' }", util.inspect(out.spec.q) )

          cb()
        })
      },

      get: function(cb){
        settingspin.spec({kind:'foo'}, function(err,out){
          assert.isNull(err)
          assert.isNotNull(out)
          assert.ok(out.ok)
          assert.equal( 'foo', out.kind )
          assert.equal( "{ type: 'number' }", util.inspect(out.spec.q) )

          cb()
        })
      }
    })
  })

})

