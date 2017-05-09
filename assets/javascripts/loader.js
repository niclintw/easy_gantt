window.ysy = window.ysy || {};
ysy.data = ysy.data || {};
ysy.data.loader = ysy.data.loader || {};
$.extend(ysy.data.loader, {
  /*
   * this object is responsible for downloading and preparing data from server
   */
  _name: "Loader",
  loaded: false,
  inited: false,
  _onChange: [],
  init: function () {
    var settings = ysy.settings;
    var data = ysy.data;
    if (settings.paths.rootPath.substr(-1) !== "/") {
      settings.paths.rootPath += "/";
    }
    if (!settings.project) {
      settings.global = true;
    }
    if (settings.project) {
      settings.projectID = parseInt(settings.project.id);
    }
    settings.zoom = new ysy.data.Data();
    settings.zoom.init({zoom: data.storage.getSavedZoom() || ysy.settings.defaultZoom || "day", _name: "Zoom"});
    settings.controls = new ysy.data.Data();
    settings.controls.init({controls: false, _name: "Task controls"});
    settings.baseline = new ysy.data.Data();
    settings.baseline.init({open: false, _name: "Baselines"});
    settings.critical = new ysy.data.Data();
    settings.critical.init({open: false, active: false, _name: "Critical path"});
    settings.addTask = new ysy.data.Data();
    settings.addTask.init({open: false, type: "issue", _name: "Add Task"});
    settings.resource = new ysy.data.Data();
    settings.resource.init({open: false, _name: "Resource Management"});
    settings.scheme = new ysy.data.Data();
    settings.scheme.init({by: ysy.settings.schemeBy, _name: "Schema switch"});
    settings.sumRow = new ysy.data.Data();
    settings.sumRow.init({_name: "SumRow"});
    settings.sample = new data.Data();
    data.limits = new data.Data();
    data.limits.init({openings: {}});
    data.relations = new data.Array();
    data.issues = new data.Array();
    data.milestones = new data.Array();
    data.projects = new data.Array();
    data.baselines = new data.Array();
    ysy.view.patch();
    ysy.proManager.patch();
    settings.sample.init();
    this.inited = true;
  },
  load: function () {
    // second part of program initialization
    this.loaded = false;
    //this.projects=new ysy.data.Array;
    //var data=ysy.availableProjects;
    ysy.log.debug("load()", "load");
    if (ysy.settings.sample.active) {
      ysy.gateway.polymorficGetJSON(
          ysy.settings.paths.sample_data.replace("{{version}}", ysy.settings.sample.active), null,
          $.proxy(this._loadSampleData, this),
          function () {
            ysy.log.error("Error: Example data fetch failed");
          }
      );
    } else {
      ysy.gateway.loadGanttdata(
          $.proxy(this._handleMainGantt, this),
          function () {
            ysy.log.error("Error: Unable to load data");
          }
      );
    }
  },
  loadSubEntity: function (type, id) {
    if (type === "project" && this.loadProject) {
      return this.loadProject(id);
    }
  },
  register: function (func, ctx) {
    this._onChange.push({func: func, ctx: ctx});
  },
  _fireChanges: function (who, reason) {
    for (var i = 0; i < this._onChange.length; i++) {
      var ctx = this._onChange[i].ctx;
      if (!ctx || ctx.deleted) {
        this._onChange.splice(i, 1);
        continue;
      }
      //this.onChangeNew[i].func();
      ysy.log.log("-- changes to " + ctx.name + " widget");
      $.proxy(this._onChange[i].func, ctx)();
    }
  },
  _processColumns: function (columns) {
    var expandees = {
      assigned_to: {
        source: "/easy_auto_completes/assignable_users?issue_id={{issue_id}}",
        type: "select",
        target: "issue[assigned_to_id]"
      },
      status: {
        target: "issue[status_id]",
        type: "select",
        source: "/easy_auto_completes/allowed_issue_statuses?issue_id={{issue_id}}"
      },
      priority: {
        target: "issue[priority_id]",
        type: "select",
        source: "/easy_auto_completes/issue_priorities"
      },
      estimated_hours: {
        target: "issue[estimated_hours]",
        type: "hours",
        mapped: "estimated_hours"
      }
    };
    for (var i = 0; i < columns.length; i++) {
      $.extend(columns[i], expandees[columns[i].name]);
    }
    return columns;
  },
  _handleMainGantt: function (data) {
    if (!data.easy_gantt_data) return;
    var json = data.easy_gantt_data;
    ysy.log.debug("_handleGantt()", "load");
    //  -- LIMITS --
    //ysy.data.limits.set({ // TODO
    //  start_date: moment(json.start_date, "YYYY-MM-DD"),
    //  end_date: moment(json.end_date, "YYYY-MM-DD")
    //});
    //  -- COLUMNS --
    ysy.data.columns = this._processColumns(json.columns);
    // ARRAY INITIALIZATION
    //  -- RELATIONS --
    ysy.data.relations.clear();
    //  -- ISSUES --
    ysy.data.issues.clear();
    //  -- MILESTONES --
    ysy.data.milestones.clear();
    //  -- PROJECTS --
    ysy.data.projects.clear();
    // ARRAY FILLING
    //  -- PROJECTS --
    this._loadProjects(json.projects);
    //  -- ISSUES --
    this._loadIssues(json.issues);
    //  -- MILESTONES --
    this._loadMilestones(json.versions); // after issue loading because of shared milestones
    //  -- RELATIONS --
    this._loadRelations(json.relations);
    this._loadHolidays(json.holidays);
    //  -- SCHEMES --
    if (this._loadSchemes) this._loadSchemes(json.schemes);

    ysy.log.debug("data loaded", "load");
    ysy.log.message("JSON loaded");
    this._fireChanges();
    ysy.history.clear();
    this.loaded = true;
  },
  _loadIssues: function (json) {
    if (!json) return;
    var issues = ysy.data.issues;
    for (var i = 0; i < json.length; i++) {
      var issue = new ysy.data.Issue();
      issue.init(json[i]);
      issues.pushSilent(issue);
    }
    issues._fireChanges(this, "load");
  },
  _loadRelations: function (json) {
    if (!json) return;
    var relations = ysy.data.relations;
    var allowedTypes = {
      precedes: true,
      finish_to_finish: true,
      start_to_start: true,
      start_to_finish: true
    };
    for (var i = 0; i < json.length; i++) {
      // TODO enable other relation types
      if (allowedTypes[json[i].type]) {
        var rela = new ysy.data.Relation();
      } else {
        rela = new ysy.data.SimpleRelation();
      }
      rela.init(json[i]);
      relations.pushSilent(rela);
    }
    relations._fireChanges(this, "load");
  },
  _loadMilestones: function (json) {
    if (!json) return;
    var milestones = ysy.data.milestones;
    for (var i = 0; i < json.length; i++) {
      var mile = new ysy.data.Milestone();
      mile.init(json[i]);
      milestones.pushSilent(mile);

      var issues = mile.getIssues();
      var projectIds = {};
      for (var j = 0; j < issues.length; j++) {
        projectIds[issues[j].project_id] = true;
      }
      delete projectIds[mile.project_id];
      var sharedForIds = Object.getOwnPropertyNames(projectIds);
      if (sharedForIds.length === 0) continue;
      var realProjectId = json[i].project_id;
      delete json[i].project_id;
      for (j = 0; j < sharedForIds.length; j++) {
        var sharedMile = new ysy.data.SharedMilestone();
        $.extend(sharedMile, {
          project_id: parseInt(sharedForIds[j]),
          real_project_id: realProjectId
        });
        sharedMile.init(json[i]);
        milestones.pushSilent(sharedMile);
      }
    }
    milestones._fireChanges(this, "load");
  },
  _loadProjects: function (json) {
    if (!json) return;
    var projects = ysy.data.projects;
    //var main_id = ysy.settings.projectID;
    for (var i = 0; i < json.length; i++) {
      //if (json[i].id === main_id) continue;
      var project = new ysy.data.Project();
      project.init(json[i]);
      projects.pushSilent(project);
    }
    projects._fireChanges(this, "load");
    var openings = ysy.data.limits.openings;
    for (var id in openings) {
      if (!openings.hasOwnProperty(id)) continue;
      if (ysy.main.startsWith(id, "p")) {
        var realId = id.substring(1);
        project = projects.getByID(realId);
        if (!project) continue;
        if (!project.needLoad) continue;
        project.needLoad = false;
        this.loadProject(realId);
      }
    }
  },
  _loadHolidays: function (json) {
    if (!json) return;
    ysy.settings.holidays = json;
    ysy.view.initNonworkingDays();
  },
  _loadSampleData: function (data) {
    if (!data.easy_gantt_data) return;
    var json = data.easy_gantt_data;
    var projects = json.projects;
    for (var i = 0; i < projects.length; i++) {
      projects[i].needLoad = false;
      projects[i].permissions = {editable: true};
    }
    var issues = json.issues;
    for (i = 0; i < issues.length; i++) {
      issues[i].permissions = {editable: true};
    }
    var versions = json.versions;
    for (i = 0; i < versions.length; i++) {
      versions[i].permissions = {editable: true};
    }
    this._handleMainGantt(data);
  }

});
if (!ysy.gateway) ysy.gateway = {};
$.extend(ysy.gateway, {
  loadGanttdata: function (callback, fail) {
    $.getJSON(ysy.settings.paths.mainGantt)
        .done(callback)
        .fail(fail);
  }
});
