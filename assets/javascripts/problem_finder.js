window.ysy = window.ysy || {};
ysy.pro = ysy.pro || {};
ysy.pro.problemFinder = $.extend(ysy.pro.problemFinder, {
  patch: function () {
    var setting = new ysy.data.Data();
    setting.init({
      _name: "Problem finder",
      opened: false,
      issueProblems: [],
      relationProblems: []
    });
    ysy.settings.problemFinder = setting;
    ysy.data.issues.childRegister(function () {
      ysy.pro.problemFinder.recalculateProblemsInIssues.call(this);
      ysy.pro.problemFinder.recalculateProblemsInRelations.call(this);
    }, setting);
    ysy.data.relations.childRegister(this.recalculateProblemsInRelations, setting);
    ysy.data.issues.register(this.recalculateProblemsInIssues, setting);
    ysy.data.relations.register(this.recalculateProblemsInRelations, setting);
    ysy.proManager.register("close", this.close);

    ysy.view.AllButtons.prototype.extendees.problem_finder = {
      widget: ysy.view.ProblemFinder,
      bind: function () {
        this.model = setting;
      },
      func: function () {
        this.model.setSilent({opened: !this.model.opened});
        this.model._fireChanges(this, "open problem list");
      },
      isOn: function () {
        return this.model.opened;
      },
      isHidden: function () {
        return this.problemCount() === 0;
      }
    };

  },
  recalculateProblemsInIssues: function () {
    var problems = [];
    var array = ysy.data.issues.getArray();
    for (var i = 0; +i < array.length; i++) {
      var entity = array[i];
      var entityProblems = entity.getProblems();
      if (!entityProblems) continue;
      for (var j = 0; j < entityProblems.length; j++) {
        problems.push({
          issue: entity,
          text: entityProblems[j]
        })
      }
    }
    this.issueProblems = problems;
    this._fireChanges(this, "issues problems recalculated");
  },
  recalculateProblemsInRelations: function () {
    var problems = [];
    var array = ysy.data.relations.getArray();
    for (var i = 0; +i < array.length; i++) {
      var entity = array[i];
      var entityProblems = entity.getProblems();
      if (!entityProblems) continue;
      for (var j = 0; j < entityProblems.length; j++) {
        problems.push({
          relation: entity,
          text: entityProblems[j]
        })
      }
    }
    this.relationProblems = problems;
    this._fireChanges(this, "relations problems recalculated");
  },
  close: function () {
    ysy.settings.problemFinder.setSilent({opened: false});
    ysy.settings.problemFinder._fireChanges(this, "event close");
  },
  scrollToIssue: function (issueId) {
    var task = gantt._pull[issueId];
    if (!task) return;
    gantt.selectTask(issueId);
    gantt.showTask(issueId);
  }
});
ysy.view.ProblemFinder = function () {
  ysy.view.Widget.call(this);
  this.listIsHidden = true;
};
ysy.view.extender(ysy.view.Button, ysy.view.ProblemFinder, {
  name: "ProblemFinderWidget",
  templateName: "ProblemFinder",
  elementPrefix: "button_",
  outerClickBind: false,
  specialRepaint: function (hidden) {
    if (hidden && this.listIsHidden) return;
    var $problemList = $("#gantt_problem_list");
    if (hidden) {
      $problemList.hide();
      this.listIsHidden = true;
      return;
    }
    var rendered = Mustache.render(ysy.view.getTemplate(this.templateName), {
      count: this.problemCount()
    });
    this.$target.html(rendered);
    if (this.model.opened) {
      if (!$problemList.length) {
        $problemList = $('<div id="gantt_problem_list" class="gantt-menu-problems-list"></div>').insertAfter($("#button_problem_finder"))
            .css({maxHeight: ($(window).height() - 110) + "px"})
      }
      this.bindOuterClick();
      rendered = Mustache.render(ysy.view.getTemplate(this.templateName + "List"), this.out());
      $problemList.html(rendered).show();
      this.listIsHidden = false;
    } else {
      $problemList.hide();
      this.listIsHidden = true;
    }
  },
  out: function () {
    var issueProblems = [];
    var relationProblems = [];
    var problems = this.model.issueProblems;
    for (var i = 0; i < problems.length; i++) {
      var problem = problems[i];
      issueProblems.push({
        name: problem.issue.name,
        text: problem.text,
        issueId: problem.issue.id
      });
    }
    var issues = ysy.data.issues;
    problems = this.model.relationProblems;
    for (i = 0; i < problems.length; i++) {
      problem = problems[i];
      var source = issues.getByID(problem.relation.source_id);
      var target = issues.getByID(problem.relation.target_id);
      relationProblems.push({
        sourceName: (source ? source.name : "#" + problem.relation.source_id),
        targetName: (target ? target.name : "#" + problem.relation.target_id),
        text: problem.text,
        issueId: problem.relation.target_id
      });
    }
    return {"issues": issueProblems, "relations": relationProblems};

  },
  problemCount: function () {
    return this.model.issueProblems.length + this.model.relationProblems.length;
  },
  bindOuterClick: function () {
    if (this.outerClickBind) return;
    var self = this;
    $(document).on("click.problem_finder", function (e) {
      //is inside ProblemList
      if (e && e.target.closest("#gantt_problem_list")) return;
      $(document).off("click.problem_finder");
      self.outerClickBind = false;
      ysy.pro.problemFinder.close();
    });
    this.outerClickBind = true;
  }
});
