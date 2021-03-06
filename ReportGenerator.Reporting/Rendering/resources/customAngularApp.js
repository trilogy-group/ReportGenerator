/* Angular controller for summary report */
function SummaryViewCtrl($scope, $window) {
    var self = this;

    $scope.filteringEnabled = false;
    $scope.assemblies = [];
    $scope.branchCoverageAvailable = branchCoverageAvailable;

    $scope.enableFiltering = function () {
        console.log("Enabling filtering");

        $scope.assemblies = assemblies;
        $scope.filteringEnabled = true;
    };

    self.initialize = function () {
        var i, l, numberOfClasses;

        if ($window.history === undefined || $window.history.replaceState === undefined || $window.history.state === null) {
            numberOfClasses = 0;

            for (i = 0, l = assemblies.length; i < l; i++) {
                numberOfClasses += assemblies[i].classes.length;
                if (numberOfClasses > 1500) {
                    console.log("Number of classes (filtering disabled): " + numberOfClasses);
                    return;
                }
            }

            console.log("Number of classes (filtering enabled): " + numberOfClasses);
        }

        $scope.enableFiltering();
    };

    self.initialize();
}

/* Angular controller for class reports */
function DetailViewCtrl($scope, $window) {
    var self = this;

    $scope.selectedTestMethod = "AllTestMethods";

    $scope.switchTestMethod = function (method) {
        console.log("Selected test method: " + method);
        var lines, i, l, coverageData, lineAnalysis, cells;

        lines = document.querySelectorAll('.lineAnalysis tr');

        for (i = 1, l = lines.length; i < l; i++) {
            coverageData = JSON.parse(lines[i].getAttribute('data-coverage').replace(/'/g, '"'));
            lineAnalysis = coverageData[method];
            cells = lines[i].querySelectorAll('td');
            if (lineAnalysis === null) {
                lineAnalysis = coverageData.AllTestMethods;
                if (lineAnalysis.LVS !== 'gray') {
                    cells[0].setAttribute('class', 'red');
                    cells[1].innerText = cells[1].textContent = '0';
                    cells[4].setAttribute('class', 'lightred');
                }
            } else {
                cells[0].setAttribute('class', lineAnalysis.LVS);
                cells[1].innerText = cells[1].textContent = lineAnalysis.VC;
                cells[4].setAttribute('class', 'light' + lineAnalysis.LVS);
            }
        }
    };

    $scope.navigateToHash = function (hash) {
        // Prevent history entries when selecting methods/properties
        if ($window.history !== undefined && $window.history.replaceState !== undefined) {
            $window.history.replaceState(undefined, undefined, hash);
        }
    };
}

/* Angular application */
var coverageApp = angular.module('coverageApp', []);
coverageApp.controller('SummaryViewCtrl', SummaryViewCtrl);
coverageApp.controller('DetailViewCtrl', DetailViewCtrl);

coverageApp.directive('reactiveTable', function () {
    return {
        restrict: 'A',
        scope: {
            assemblies: '=',
            branchCoverageAvailable: '='
        },
        link: function (scope, el, attrs) {
            scope.$watchCollection('assemblies', function (newValue, oldValue) {
                React.renderComponent(
                    AssemblyComponent({ assemblies: newValue, branchCoverageAvailable: scope.branchCoverageAvailable }),
                    el[0]);
            });
        }
    };
});

coverageApp.directive('historyChart', function ($window) {
    return {
        restrict: 'A',
        link: function (scope, el, attrs) {
            var chartData = $window[attrs.data];
            new Chartist.Line('#' + el[0].id, {
                labels: [],
                series: chartData.series
                }, {
                    lineSmooth: false,
                    low: 0,
                    high: 100
                });

            var chart = $(el[0]);

            var tooltip = chart
              .append('<div class="tooltip"></div>')
              .find('.tooltip');

            chart.on('mouseenter', '.ct-point', function () {
                var point = $(this);
                var index = point.parent().children('.ct-point').index(point);

                tooltip
                    .html(chartData.tooltips[index % chartData.tooltips.length])
                    .show();
            });

            chart.on('mouseleave', '.ct-point', function () {
                tooltip.hide();
            });

            chart.on('mousemove', function (event) {
                tooltip.css({
                    left: (event.offsetX || event.originalEvent.layerX) - tooltip.width() / 2 - 5,
                    top: (event.offsetY || event.originalEvent.layerY) - tooltip.height() - 40
                });
            });
        }
    };
});