'use strict';

angular.module('sidrApp')
.controller('LeadsCtrl', function ($scope, $rootScope, $state, UserService, LeadService, SessionService, LocationService, TagService, ngTableParams, CONST) {
  $rootScope.$broadcast("updatePage", {
      pageCaption: 'Leads',
      pageSubCaption:  ''
  });
  $scope.exportUrls = {
    csv: '',
    json: ''
  }

  $scope.usersDropdown = [];
  UserService.getUsersMap().then(function(res){
    angular.forEach(res.result, function(row){
      $scope.usersDropdown.push({id: row.id, title: row.name});
    });
  })
  $scope.confidentiality = LeadService.getConfidentialityMap();
  $scope.confidentialityDropdown = LeadService.getConfidentialityDropdown();
  $scope.leadStatus = LeadService.getLeadStatusMap();
  $scope.leadStatusDropdown = LeadService.getLeadStatusDropdown();
  $scope.leadTypes = LeadService.getTypesDropdown();

  $scope.tagsPulldown = TagService.getDropdown('source');
  $scope.tagTitles = TagService.getTitleMap('source');

  $scope.tagsPulldownContentFormat = TagService.getDropdown('content_format');
  $scope.tagTitlesContentFormat = TagService.getTitleMap('content_format');

  $scope.LeadService = LeadService;
  $scope.countries = LocationService.getCountriesDropdown();
  $scope.tableParams = new ngTableParams({
      page: 1,
      count: 50,
      filter: {
        status: CONST.STATUS_PENDING,
        domain_id: SessionService.user.state.focus_domain_id
      }
  }, {
      total: 0,
      getData: function($defer, params) {
          LeadService.find(params.$params, function(data){
            params.total(data.total);
            $defer.resolve(data.result);
            $scope.exportUrls = {
              csv: LeadService.getExportUrl('csv', $scope.tableParams.filter),
              json: LeadService.getExportUrl('json', $scope.tableParams.filter)
            }
          });
      }
  });

  $scope.actions = {
    changeStatus: function(lead, $index, status){
      LeadService.updateStatus(lead.id, status).then(function(rsp){
        lead.status = rsp.status;
      })
    }
  }
})
.controller('LeadCtrl', function ($scope, $rootScope, $state, users, lead, Lead, LeadService, APIService, TagService, LocationService) {
  $scope.users = users;
  $scope.lead = lead;
  $scope.countries = LocationService.getCountries();
  $scope.confidentialityDropdown = LeadService.getConfidentialityDropdown();
  $scope.serverErrors = [];
  $scope.tags = TagService.getByClass('source');
  $scope.tagsContentFormat = TagService.getByClass('content_format');

  $scope.today = function() {
    $scope.dt = new Date();
  };

  $scope.dateOptions = {
   formatYear: 'yy',
   startingDay: 1
 };
  var uploader = $scope.uploader = APIService.uploader('/binbag');

  uploader.onSuccessItem = function(fileItem, response, status, headers) {
      if(typeof $scope.lead.binbags === 'undefined' || $scope.lead.binbags === null){
        $scope.lead.binbags = [];
      }
      $scope.lead.binbags.push(response);
      fileItem.remove();
  };

  $rootScope.$broadcast("updatePage", {
      pageCaption: ($scope.lead.isNew() ? 'Create Lead' : 'Edit Lead') + ':  ' + LeadService.getLeadTypeName(lead.lead_type),
      pageSubCaption:  $scope.lead.name
  });


  $scope.actions = {
    updateWebsite: function extractDomain(url) {
        if(typeof url === 'undefined'){
          $scope.lead.website = null;
          return;
        }
        var domain;
        if (url.indexOf("://") > -1) {
            domain = url.split('/')[2];
        }
        else if (url.indexOf("/") > -1) {
            domain = url.split('/')[0];
        }
        else {
          $scope.lead.website = null;
          return;
        }
        $scope.lead.website = domain.split(':')[0];
    },
    submit: function(form, lead, next){
      $scope.serverErrors = [];
      LeadService.save($scope.lead).then(
            function(rsp){
              $scope.lead = new Lead(rsp);
              if(next == 'return'){
                $state.transitionTo('signed.leads').then(function(){
                  // notification or something
                });
              }
              else{
                $state.transitionTo('signed.lead', {'lead_type': rsp.lead_type}, {reload: true}).then(function(){

                });
              }
            },
            function(res){
                if(typeof res.data.message !== 'undefined'){
                  $scope.serverErrors.push(res.data.message);
                }
            });
    }
  };
});
