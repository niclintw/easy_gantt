window.ysy = window.ysy || {};
ysy.view = ysy.view || {};
ysy.view.addGanttAddons = function () {
  gantt.ascStop = function (task, start_date, end_date, ancestorLink) {
    var diff;
    if (task.soonest_start && start_date && start_date.isBefore(task.soonest_start)) {
      diff = task.soonest_start.diff(start_date, "seconds");
      start_date.add(diff, "seconds");
      if(end_date) end_date.add(diff, "seconds");
    }
    var sumMove = 0;
    for (var i = 0; i < task.$target.length; i++) {
      var lid = task.$target[i];
      if (ancestorLink && parseInt(lid) === ancestorLink.id) continue; // skip link sourcing moved parent
      var link = gantt._lpull[lid];
      if(link.skipPush) continue;
      var targetDate;
      if (link.type === "precedes" || link.type == "start_to_start") {
        if (!start_date) continue;
        targetDate = start_date;
      } else if (link.type === "finish_to_finish" || link.type == "start_to_finish") {
        if (!end_date) continue;
        targetDate = end_date;
      } else continue;
      //if (link.type !== "precedes") continue;
      var source = gantt._pull[link.source];
      var sourceDate = gantt.getLinkSourceDate(source, link.type);
      var linkLast = gantt._working_time_helper.add_worktime(sourceDate, link.delay, "day", targetDate._isEndDate === true);
      diff = -targetDate.diff(linkLast, "seconds");
      // ysy.log.debug("sourceDate="+sourceDate.toISOString()+" linkLast="+linkLast.toISOString());
      if (diff > 0) {
        sumMove += diff;
        ysy.log.debug("ascStop linkLast=" + linkLast.format("YYYY-MM-DD") + " diff=" + diff, "task_drag");
        if (start_date) {
          start_date.add(diff, "seconds");
        }
        if (end_date) {
          end_date.add(diff, "seconds");
        }
      }
    }
    return sumMove;
  };
  gantt.moveDesc = function (task, diff, ancestorLink, resizing) {
    // runs after task dates are already modified.
    ysy.log.debug("moveDesc():  task=" + task.text + " diff=" + (diff/86400) + (ancestorLink?" ancestorLink=" + ancestorLink.id:""),"task_drag");
    if(gantt._get_safe_type(task.type)!=="task"){
      if(task.type==="milestone"){
        return gantt.moveMilestoneChildren(task);
      }
    }
    var first = !ancestorLink;
    var bothDir = ysy.settings.linkBothDir;
    // diff in seconds
    if (diff === 0) return 0;
    if (diff <= 0 && !bothDir) {
      gantt.moveChildren(task, diff);
      return 0;
    }
    var mileBack = 0;
    if (diff > 0) {
      if (ysy.settings.milestonePush) {
        mileBack = gantt.milestoneDescStop(task, first ? 0 : diff);
        if (mileBack !== 0) {
          diff -= mileBack;
          ysy.log.debug("task=" + task.text + " oldDiff=" + ((diff+mileBack)/86400) +" newDiff=" + (diff/86400) + " mileDiff=" + (mileBack/86400),"task_drag_milestone");
        }
      }
    }
    if (first && mileBack !== 0) {
      if (resizing !== "right") {
        task.start_date.add(Math.floor(-mileBack), 'seconds');
      }
      if (resizing !== "left") {
        task.end_date.add(Math.floor(-mileBack), 'seconds');
      }
      ysy.log.debug("FIRST " + task.text + " corrected by mileDiff=" + (mileBack/3600/24) +" to "+task.start_date.format("YYYY-MM-DD"),"task_drag_milestone");
    }
    gantt.moveChildren(task, diff);

    if (!first && (diff > 0 || bothDir)) {
      ysy.log.debug("Task " + task.text + " pushed by " + (diff/86400) + " days", "task_drag");
      task.start_date.add(Math.floor(diff), 'seconds');
      task.end_date.add(Math.floor(diff), 'seconds');
      // var oldStartDate = moment(task.start_date);
      task._changed = gantt.config.drag_mode.move;
      gantt.refreshTask(task.id);
    }
    if (!first && diff < 0) {
      var ascDiff = gantt.ascStop(task, task.start_date, task.end_date, ancestorLink);
      if (ascDiff !== 0) {
        // ysy.log.debug("diff=" + diff + " ascStopDiff=" + ascDiff);
        diff += ascDiff;
      }
    }
    var start_date = +task.start_date / 1000;
    var end_date = +task.end_date / 1000;
    for (var i = 0; i < task.$source.length; i++) {
      var lid = task.$source[i];
      var link = gantt._lpull[lid];
      if(link.skipPush) continue;
      var desc = gantt._pull[link.target];
      if (diff < 0 && bothDir) {
        // ysy.log.debug("desc=" + desc.text +" diff="+diff);
        gantt.moveDesc(desc, diff, link);
        // ysy.log.debug("task=" + task.text + " diff=" + diff + " reduced by " + backDiff);
      } else {
        var descDiff = gantt.getFreeDelay(link, desc, start_date, end_date);
        if (descDiff <= 0) continue;
        // ysy.log.debug("desc=" + desc.text +" diff="+diff+" descDiff="+descDiff);
        gantt.moveDesc(desc, descDiff, link);
      }
    }
    ysy.log.debug("Task " + task.text + " pushed back by " + (diff/86400) + " days", "task_drag");
    return 0;
  };
  gantt.moveChildren = function (task, shift) {
    if (!(gantt._get_safe_type(task.type) === "task" && ysy.settings.parentIssueDates)) {
      if (task.$open && gantt.isTaskVisible(task.id)) return;
    }
    var branch = gantt._branches[task.id];
    if (!branch || branch.length === 0) return;
    ysy.log.debug("Shift children of \"" + task.text + "\" by " + shift + " seconds", "parent");
    ysy.log.debug("moveChildren():  of \"" + task.text + "\" by " + shift + " seconds", "task_drag");
    for (var i = 0; i < branch.length; i++) {
      var childId = branch[i];
      //if(gantt.isTaskVisible(childId)){continue;}
      var child = gantt.getTask(childId);
      child.start_date.add(shift, 'seconds');
      child.end_date.add(shift, 'seconds');
      child._changed = gantt.config.drag_mode.move;
      gantt.refreshTask(child.id);
      gantt.moveDesc(child, shift);
    }
  };
  gantt.moveMilestoneChildren=function(milestone){
    var branch = gantt._branches[milestone.id];
    if (!branch || branch.length === 0) return 0;
    // ysy.log.debug("Shift children of \"" + milestone.text + "\" by " + shift + " seconds", "parent");
    // ysy.log.debug("moveChildren():  of \"" + milestone.text + "\" by " + shift + " seconds", "task_drag");
    for (var i = 0; i < branch.length; i++) {
      var childId = branch[i];
      var child = gantt.getTask(childId);
      if(child.end_date.isAfter(milestone.end_date)){
        var shift = milestone.end_date.diff(child.end_date,"seconds");
        child.start_date.add(shift, 'seconds');
        child.end_date.add(shift, 'seconds');
        child._changed = gantt.config.drag_mode.move;
        gantt.refreshTask(child.id);
        gantt.moveDesc(child, shift);
      }
    }
    return 0;
  };
  gantt.milestoneStop = function (task, diff) {
    var issue = task.widget && task.widget.model;
    if (!issue) return 0;
    var milestone = ysy.data.milestones.getByID(issue.fixed_version_id);
    if (!milestone) return 0;
    var milDiff = milestone.start_date.diff(task.end_date, "seconds");
    milDiff -= diff;
    if (milDiff < 0) {
      ysy.log.debug("milestoneStop() for " + task.text + " milDiff=" + (milDiff/86400) +
          " diff=" + (diff/86400) +" at "+milestone.start_date.format("YYYY-MM-DD"), "task_drag_milestone");
      return -milDiff;
    }
    return 0;
  };
  gantt.milestoneDescStop = function (task, diff) {
    ysy.log.debug("milestoneDescStop(): task "+task.text+" moving by "+(diff/86400),"task_drag");
    var backDiff = gantt.milestoneStop(task, diff);
    var start_date = +task.start_date / 1000 + diff;
    var end_date = +task.end_date / 1000 + diff;
    for (var i = 0; i < task.$source.length; i++) {
      var lid = task.$source[i];
      var link = gantt._lpull[lid];
      var desc = gantt._pull[link.target];
      var descDiff = gantt.getFreeDelay(link, desc, start_date, end_date);
      if (descDiff <= 0) continue;
      backDiff = Math.max(backDiff, gantt.milestoneDescStop(desc, descDiff));
    }
    return backDiff;
  };
  gantt.getLinkSourceDate = function (source, type) {
    if (type === "precedes") return source.end_date;
    if (type === "finish_to_finish") return source.end_date;
    if (type === "start_to_start") return source.start_date;
    if (type === "start_to_finish") return source.start_date;
    return null;
  };
  gantt.getLinkTargetDate = function (target, type) {
    if (type === "precedes") return target.start_date;
    if (type === "finish_to_finish") return target.end_date;
    if (type === "start_to_start") return target.start_date;
    if (type === "start_to_finish") return target.end_date;
    return null;
  };
  gantt.getLinkCorrection = function (type) {
    if (type === "precedes") return 1;
    if (type === "start_to_finish") return -1;
    return 0;
  };
  gantt.getFreeDelay = function (link, desc, ascStartDate, ascEndDate) {
    if (!desc) desc = gantt._pull[link.target];
    var sourceDate;
    var daysToSeconds = 60 * 60 * 24;
    if (!ascStartDate) {
      var asc = gantt._pull[link.source];
      ascStartDate = asc.start_date / 1000;
      ascEndDate = asc.end_date / 1000;
    }
    if (link.type === "precedes" || link.type === "finish_to_finish") {
      if (!ascEndDate) return 0;
      sourceDate = ascEndDate;
    } else if (link.type === "start_to_finish" || link.type === "start_to_start") {
      if (!ascStartDate) return 0;
      sourceDate = ascStartDate;
    } else return 0;
    var targetDate = gantt.getLinkTargetDate(desc, link.type);
    var correction = gantt.getLinkCorrection(link.type);
    var delay = (targetDate / 1000 - sourceDate) / daysToSeconds;
    return (link.delay + correction - delay) * daysToSeconds;

  };
  gantt.updateAllTask = function (seed_task) {
    ysy.history.openBrack();
    var toPush = {};
    // sort + reverse in order to process milestones before tasks
    var pullIds = Object.getOwnPropertyNames(gantt._pull).sort().reverse();
    for (var i = 0; i < pullIds.length; i++) {
      var task = gantt._pull[pullIds[i]];
      if (task._changed) {
        //gantt._tasks_dnd._fix_dnd_scale_time(task,{mode:task._changed});
        gantt._tasks_dnd._fix_working_times(task, {mode: task._changed});
        gantt._update_parents(task.id, false);
        task.widget.update(task);
        task._changed = false;
        ysy.log.debug("UpdateAllTask update " + task.text, "task_drag");
        toPush[task.real_id] = task.widget.model;
      }
    }
    //seed_task.widget.model.pushFollowers(true);
    // Enrichment of toPush by all issues which points to issues in toPush
    var relations = ysy.data.relations.getArray();
    for (i = 0; i < relations.length; i++) {
      var relation = relations[i];
      if (toPush[relation.target_id]) {
        toPush[relation.source_id] = relation.getSource();
      }
    }
    for (var id in toPush) {
      if (!toPush.hasOwnProperty(id)) continue;
      var issue = toPush[id];
      if (issue) issue.pushFollowers();
    }

    ysy.history.closeBrack();
  };
  //###############################################################################
  gantt.render_delay_element = function (link, pos) {
    if(link.widget && link.widget.model.isSimple) return null;
    //if(link.delay===0){return null;}
    var sourceDate = gantt.getLinkSourceDate(gantt._pull[link.source], link.type);
    var targetDate = gantt.getLinkTargetDate(gantt._pull[link.target], link.type);
    var actualDelay = gantt._working_time_helper.get_work_units_between(sourceDate, targetDate, "day");
    actualDelay = Math.round(actualDelay);
    var text = (link.delay ? link.delay : '') + (actualDelay !== link.delay ? ' (' + actualDelay + ')' : '');
    return $('<div>')
        .css({position: "absolute", left: pos.x, top: pos.y})
        .html(text)[0];
  };
  //##############################################################################
  /*
   * Přepsané funkce z dhtmlxganttu, kvůli efektivnějšímu napojení či kvůli odstranění bugů
   */
  //##########################################################################################
  gantt.allowedParent = function (child, parent) {
    var type = child.type;
    if (!type) {
      type = "task";
    }
    var allowed = gantt.config["allowedParent_" + type];
    if (parent) {
      if (!allowed) return false;
      if (parent.real_id > 1000000000000) return false;
      var parentType = parent.type || "task";
      return allowed.indexOf(parentType) >= 0;
    }
    return allowed;

  };
  gantt.getShowDate = function () {
    var pos = gantt._restore_scroll_state();
    if (!pos) return null;
    return this.dateFromPos(pos.x + this.config.task_scroll_offset);
  };
  gantt.silentMoveTask = function (task, parentId) {
    ysy.log.debug("silentMoveTask", "move_task");
    var id = task.id;
    var sourceId = this.getParent(id);
    if (sourceId == parentId) return;

    this._replace_branch_child(sourceId, id);
    var tbranch = this.getChildren(parentId);
    tbranch.push(id);

    this.setParent(task, parentId);
    this._branches[parentId] = tbranch;

    var childTree = this._getTaskTree(id);
    for (var i = 0; i < childTree.length; i++) {
      var item = this._pull[childTree[i]];
      if (item)
        item.$level = this.calculateTaskLevel(item);
    }
    task.$level = gantt.calculateTaskLevel(task);
    this.refreshData();

  };
  gantt.getCachedScroll = function () {
    if (!gantt._cached_scroll_pos) return {x: 0, y: 0};
    return {x: gantt._cached_scroll_pos.x || 0, y: gantt._cached_scroll_pos.y || 0};
  };
  gantt.reconstructTree = function () {
    var tasks = gantt._pull;
    var ids = Object.getOwnPropertyNames(tasks);
    for (var i = 0; i < ids.length; i++) {
      var task = tasks[ids[i]];
      if (task.realParent === undefined) continue;
      gantt.silentMoveTask(task, task.realParent);
      delete task.realParent;
    }
  }
};
