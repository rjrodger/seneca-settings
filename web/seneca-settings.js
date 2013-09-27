(function(window, angular) {
"use strict";

var senecaSettingsModule = angular.module('senecaSettingsModule', [])

senecaSettingsModule.service('senecaSettingsAPI', ['$http',function($http){
  return {
    foo: function(){ return 'bar'; },
    /// "spec"
    spec: function(kind,done){
      $http({method:'GET',url:'/settings/spec?kind='+kind, cache:false})
        .success(function(out){
          done(out.spec)
        })
    },
    /// "load"
    load: function(kind,done){
      $http({method:'GET',url:'/settings/load?kind='+kind, cache:false})
        .success(function(out){
          done(out.settings)
        })
    },
    /// "save"
    save: function(kind,settings,done){
      $http({method:'POST',url:'/settings/save?kind='+kind, data:settings, cache:false})
        .success(function(out){
          done(out.settings)
        });
    }
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
          });
        })
      })
    },
    templateUrl: "_settings_template.html"
  }
  return def
}])

senecaSettingsModule.controller("Settings", ["$scope", 'senecaSettingsAPI', function($scope, senecaSettingsAPI) {
    // If define_spec were enabled via the API, could initialize the spec here
    // based on data specified in web/index.html <script> block.

    $scope.update_settings = function() {
        senecaSettingsAPI.save($scope.kind, $scope.settings, function (out) {
            console.log("response of update_settings:");
            console.log(out);
        });
    }
}]);

}(window, angular));

