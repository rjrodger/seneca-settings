(function(window, angular) {
"use strict";

var senecaSettingsModule = angular.module('senecaSettingsModule', [])

senecaSettingsModule.service('senecaSettingsAPI', ['$http',function($http){
  return {
    foo: function(){ return 'bar'; },
    spec: function(kind,done){
      $http({method:'GET',url:'/settings/spec?kind='+kind, cache:false})
        .success(function(out){
          done(out.spec)
        })
    },
    load: function(kind,done){
      $http({method:'GET',url:'/settings/load?kind='+kind, cache:false})
        .success(function(out){
          done(out.settings)
        })
    },
    save: function(kind,settings,done){
      $http({method:'POST',url:'/settings/save?kind='+kind, data:settings, cache:false})
        .success(function(out){
          done(out.settings)
        })
    },
  }
}])

senecaSettingsModule.directive('senecaSettings', ['senecaSettingsAPI', function (senecaSettingsAPI) {
  var def = {
    restrict:'A',
    scope:{
      kind:'@',
    },
    link: function( scope ){
      scope.$watch('kind', function(kind){
        senecaSettingsAPI.spec(kind, function(spec){
          scope.spec = spec

          senecaSettingsAPI.load(kind, function(settings){
            scope.settings = settings
          })
        })
      })
    },
    template:'<b>{{kind}} settings</b><br>'+
      'spec:{{spec}}<br>'+
      'settings:{{settings}}<br>'
  }
  return def
}])

}(window, angular));
