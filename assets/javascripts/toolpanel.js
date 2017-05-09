window.ysy = window.ysy || {};
ysy.pro = ysy.pro || {};
ysy.pro.toolPanel = ysy.pro.toolPanel || {};
$.extend(ysy.pro.toolPanel, {
  extendees: [
    {
      id: "close_all_parent_issues",
      bind: function () {
        this.model = ysy.data.limits;
        this._register(ysy.settings.resource, 1);
      },
      func: function () {
        var openings = this.model.openings;
        var issues = ysy.data.issues.getArray();
        this.model.parentsIssuesClosed = !this.model.parentsIssuesClosed;
        if (this.model.parentsIssuesClosed) {
          for (var i = 0; i < issues.length; i++) {
            openings[issues[i].getID()] = false;
          }
        } else {
          for (i = 0; i < issues.length; i++) {
            delete openings[issues[i].getID()];
          }
        }
        this.model._fireChanges(this, "close_all_parent_issues");
        return false;
      },
      isOn: function () {
        return this.model.parentsIssuesClosed;
      }
    },
    {
      id: "close_all_milestones",
      bind: function () {
        this.model = ysy.data.limits;
        this._register(ysy.settings.resource, 1);
      },
      func: function () {
        var openings = this.model.openings;
        var milestones = ysy.data.milestones.getArray();
        this.model.milestonesClosed = !this.model.milestonesClosed;
        if (this.model.milestonesClosed) {
          for (var i = 0; i < milestones.length; i++) {
            openings[milestones[i].getID()] = false;
          }
        } else {
          for (i = 0; i < milestones.length; i++) {
            delete openings[milestones[i].getID()];
          }
        }
        this.model._fireChanges(this, "close_all_milestones");
        return false;
      },
      isOn: function () {
        return this.model.milestonesClosed;
      }
    },
    {
      id: "close_all_projects",
      bind: function () {
        this.model = ysy.data.limits;
        this._register(ysy.settings.resource, 1);
      },
      func: function () {
        var openings = this.model.openings;
        var projects = ysy.data.projects.getArray();
        this.model.projectsClosed = !this.model.projectsClosed;
        if (this.model.projectsClosed) {
          for (var i = 0; i < projects.length; i++) {
            if (projects[i].id === ysy.settings.projectID) continue;
            delete openings[projects[i].getID()];
            // gantt.close(projects[i].getID());
          }
        } else {
          for (i = 0; i < projects.length; i++) {
            if (!projects[i].needLoad) {
              openings[projects[i].getID()] = true;
            }
            //gantt.open(projects[i].getID());
          }
        }
        this.model._fireChanges(this, "close_all_projects");
        return false;
      },
      isOn: function () {
        return this.model.projectsClosed;
      }
    },
    {
      id: "close_all_something",
      bind: function () {
        this.model = ysy.data.limits;
        this._register(ysy.settings.resource, 1);
      },
      func: function () {
        if (!this.isOn()) {
          this.model.projectsClosed = false;
          this.model.milestonesClosed = false;
          this.model.parentsIssuesClosed = false;
        }
        $("#button_close_all_parent_issues").click();
        $("#button_close_all_milestones").click();
        $("#button_close_all_projects").click();
      },
      isOn: function () {
        return this.model.parentsIssuesClosed && this.model.milestonesClosed && this.model.projectsClosed;
      },
      isHidden: function () {
        return ysy.settings.resource.open;
      }
    }
  ],
  initToolbar: function (ctx) {
    var toolPanel = new ysy.view.ToolPanel();
    toolPanel.init(ysy.settings.toolPanel);
    ctx.children.push(toolPanel);
  },
  patch: function () {
    var toolClass = ysy.pro.toolPanel;
    var toolSetting = ysy.settings.toolPanel = new ysy.data.Data();
    toolSetting.init({
      open: false, _name: "ToolPanel", buttonIds: [], buttons: {},
      registerButtonSilent: function (button) {
        if (button.id === undefined) throw("Missing id for button");
        this.buttons[button.id] = button;
        this.buttonIds.push(button.id);
      }
    });

    ysy.proManager.register("initToolbar", this.initToolbar);
    ysy.proManager.register("close", this.close);

    $.extend(ysy.view.AllButtons.prototype.extendees, {
      tool_panel: {
        bind: function () {
          this.model = toolSetting;
        },
        func: function () {
          ysy.proManager.closeAll(toolClass);
          if (this.model.open) {
            toolClass.close();
          } else {
            toolClass.open();
          }
        },
        isOn: function () {
          return this.model.open;
        },
        isHidden: function () {
          return this.model.buttonIds.length === 0;
        }
      }
    });
    for (var i = 0; i < this.extendees.length; i++) {
      var button = this.extendees[i];
      if (button.isRemoved && button.isRemoved()) continue;
      toolSetting.registerButtonSilent(button);
    }
    toolSetting._fireChanges(this, "delayed registerButton");
    delete this.extendees;
  },
  registerButton: function (button) {
    if (button.isRemoved && button.isRemoved()) return;
    if (ysy.settings.toolPanel) {
      ysy.settings.toolPanel.registerButtonSilent(button);
      ysy.settings.toolPanel._fireChanges(this, "direct registerButton");
    } else {
      this.extendees.push(button);
    }
  },
  open: function () {
    if (ysy.settings.toolPanel.open) return;
    ysy.settings.toolPanel.setSilent({open: true});
    ysy.settings.toolPanel._fireChanges(this, "open");
  },
  close: function (except) {
    if (except && except.doNotCloseToolPanel) return;
    ysy.settings.toolPanel.setSilent({open: false});
    ysy.settings.toolPanel._fireChanges(this, "close");
  }
});

ysy.view.ToolPanel = function () {
  ysy.view.Widget.call(this);
};
ysy.view.extender(ysy.view.Widget, ysy.view.ToolPanel, {
  name: "ToolPanelWidget",
  templateName: "ToolButtons",
  _postInit: function () {
    $("#easy_gantt_tool_panel").find("a:not([href])").attr("href", "javascript:void(0)")
        .end().children().hide();
  },
  _updateChildren: function () {
    if (!this.model.open) {
      this.children = [];
      return;
    }
    var model = this.model;
    var children = [];
    // this.$target = $("#content");
    for (var i = 0; i < model.buttonIds.length; i++) {
      var elid = model.buttonIds[i];
      var extendee = model.buttons[elid];
      // if (!this.getChildTarget(extendee).length) continue;
      var button;
      if (extendee.widget) {
        button = new extendee.widget();
      } else {
        button = new ysy.view.Button();
      }
      $.extend(button, extendee);
      button.init();
      children.push(button);
    }
    this.children = children;
  },
  _repaintCore: function () {
    if (this.model.open) {
      this.$target.show();
      for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        this.setChildTarget(child, i);
        child.repaint(true);
      }
    } else {
      this.$target.hide();
    }
  },
  setChildTarget: function (child /*,i*/) {
    var target = this.$target.find("#" + child.elementPrefix + child.id);
    if (target.length === 0) throw("element #" + child.elementPrefix + child.id + " missing");
    child.$target = target;
  }
});
