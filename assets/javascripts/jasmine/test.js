window.ysy = window.ysy || {};
ysy.pro = ysy.pro || {};
ysy.pro.test = {
  jasmineStarted: false,
  startCounter:0,
  beatCallbacks:[],
  patch: function () {
    ysy.view.onRepaint.push($.proxy(this.beat, this));
  },
  beat: function () {
    if (!this.jasmineStarted) {
      if (ysy.data.loader.loaded) {
        if(this.startCounter++ > 3){
          this.jasmineStarted = true;
          this.jasmineStart();
        }
      }
    }
    if(this.beatCallbacks.length){
      var newCallbacks=[];
      for(var i=0;i<this.beatCallbacks.length;i++){
        var callPack=this.beatCallbacks[i];
        if(callPack.rounds===1){
          callPack.callback();
        }else{
          callPack.rounds--;
          newCallbacks.push(callPack);
        }
      }
      this.beatCallbacks = newCallbacks;
    }
  },
  fewBeatsAfter:function(callback,count){
    if(count === undefined) count = 2;
    this.beatCallbacks.push({callback:callback,rounds:count});
  },
  parseResult: function () {
    var specs = window.jsApiReporter.specs();
    var shortReport = "";
    var report = "";
    var allPassed = true;
    for (var i = 0; i < specs.length; i++) {
      var spec = specs[i];
      if (spec.failedExpectations.length === 0) {
        shortReport += ".";
      } else {
        allPassed = false;
        shortReport += "X";
        report += "__TEST " + spec.fullName + "______\n";
        for (var j = 0; j < spec.failedExpectations.length; j++) {
          var fail = spec.failedExpectations[j];
          var split = fail.stack.split("\n");
          report += "   " + split[0] + "\n";
          for (var k = 1; k < split.length; k++) {
            if (split[k].indexOf("boot.js") > -1) break;
            if (split[k].indexOf("jasmine.js") === -1) {
              report += split[k] + "\n";
            }
          }
        }
      }
    }
    if (allPassed) {
      return "success";
    }
    return " RESULTS: " + shortReport + "\n" + report;
  }
};