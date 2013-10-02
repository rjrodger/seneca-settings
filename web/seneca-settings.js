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
      });
    },
    templateUrl: "/settings/_settings_template.html"
  }
  return def
}])

senecaSettingsModule.controller("Settings", ["$scope", "$timeout", 'senecaSettingsAPI', function($scope, $timeout, senecaSettingsAPI) {
    $scope.update_settings = function() {
        senecaSettingsAPI.save($scope.kind, $scope.settings, function (out) {
            $scope.status_message = "Settings updated successfully.";
            $scope.status_class = "alert-success";

            // Clear status message after a few seconds.
            $timeout(function() {
                $scope.status_message = "";
                $scope.status_class = "";
            }, 3000);
        });
    }

    $scope.status_message = "";
    $scope.status_class = "";
}]);

}(window, angular));

